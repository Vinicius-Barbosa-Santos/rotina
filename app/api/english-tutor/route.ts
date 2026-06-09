import { NextResponse } from "next/server";

type TutorMessage = {
  role: "user" | "assistant";
  content: string;
};

type TutorRequest = {
  mode?: "chat" | "summary";
  messages?: TutorMessage[];
};

type GeminiResponse = {
  error?: { message?: string };
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

const maxMessages = 30;
const maxConversationCharacters = 12_000;
const maxRequestsPerHour = 30;
const requestWindows = new Map<string, { count: number; resetsAt: number }>();

export async function POST(request: Request) {
  if (!allowRequest(request)) {
    return NextResponse.json(
      { message: "Muitas mensagens em pouco tempo. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Configure GEMINI_API_KEY para ativar a tutora de inglês." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => undefined)) as TutorRequest | undefined;
  const mode = body?.mode === "summary" ? "summary" : "chat";
  const messages = sanitizeMessages(body?.messages ?? []);

  if (!messages.length) {
    return NextResponse.json({ message: "Escreva uma mensagem para começar." }, { status: 400 });
  }

  const model = process.env.GEMINI_ENGLISH_TUTOR_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: mode === "summary" ? summaryInstructions : conversationInstructions }]
        },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }]
        })),
        generationConfig: {
          maxOutputTokens: mode === "summary" ? 1_200 : 600,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    }
  );

  const payload = (await response.json().catch(() => undefined)) as GeminiResponse | undefined;
  if (!response.ok) {
    return NextResponse.json(
      { message: payload?.error?.message ?? "Não consegui falar com a tutora agora." },
      { status: response.status }
    );
  }

  const text = extractOutputText(payload);
  if (!text) {
    return NextResponse.json({ message: "A tutora não retornou uma resposta." }, { status: 502 });
  }

  return NextResponse.json({ text });
}

function allowRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const visitor = forwardedFor || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const current = requestWindows.get(visitor);

  if (!current || current.resetsAt <= now) {
    requestWindows.set(visitor, { count: 1, resetsAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (current.count >= maxRequestsPerHour) return false;
  current.count += 1;
  return true;
}

function sanitizeMessages(messages: TutorMessage[]) {
  const sanitized = messages
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? "").trim().slice(0, 2_000)
    }))
    .filter((message) => message.content)
    .slice(-maxMessages);

  let characters = 0;
  return sanitized
    .reverse()
    .filter((message) => {
      characters += message.content.length;
      return characters <= maxConversationCharacters;
    })
    .reverse();
}

function extractOutputText(payload?: GeminiResponse) {
  return payload?.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();
}

const conversationInstructions = `
You are an English communication coach for a Brazilian software developer.
Run realistic workplace conversations in English. Rotate naturally between scenarios such as:
- giving a daily stand-up update;
- explaining a task, technical decision, or pull request;
- reporting and investigating a bug;
- asking a teammate for help or clarification;
- discussing deadlines, blockers, and trade-offs;
- code review feedback;
- job interview questions.

Stay in character as a teammate, tech lead, product manager, or interviewer. Keep replies concise and suitable for spoken conversation.
Ask exactly one practical follow-up question in every reply. Adapt to the learner's apparent level.
Do not interrupt the flow with a long lesson. When the learner makes a meaningful communication or English mistake, add a short section at the end:

Quick correction:
- You wrote: ...
- Better: ...
- Why: ... (briefly, in Portuguese)

Prioritize clarity, confidence, natural workplace phrasing, and useful software-development vocabulary.
Ignore tiny stylistic issues when the sentence is clear. Be encouraging without excessive praise.
`.trim();

const summaryInstructions = `
Analyze the English workplace communication practice of a Brazilian software developer.
Write the report in Brazilian Portuguese, while keeping English examples in English.
Use exactly these short sections:

## Cenário praticado
## O que você comunicou bem
## Correções importantes
## Vocabulário técnico aprendido
## Frases úteis para o trabalho
## Próximo foco de comunicação

Evaluate clarity, confidence, grammar, and ability to explain technical work.
Be specific and quote only short fragments from the learner's messages.
Explain corrections clearly and give 3 practical example sentences the learner can reuse at work.
`.trim();
