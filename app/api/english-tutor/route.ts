import { NextResponse } from "next/server";

type TutorMessage = {
  role: "user" | "assistant";
  content: string;
};

type TutorRequest = {
  mode?: "chat" | "summary" | "transcribe";
  messages?: TutorMessage[];
  audio?: {
    data?: string;
    mimeType?: string;
  };
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
  const mode = body?.mode === "summary" || body?.mode === "transcribe" ? body.mode : "chat";

  if (mode === "transcribe") {
    const audioData = body?.audio?.data;
    const mimeType = body?.audio?.mimeType;
    if (!audioData || !mimeType || audioData.length > 12_000_000) {
      return NextResponse.json({ message: "A gravação está vazia ou muito longa." }, { status: 400 });
    }

    return transcribeAudio({ apiKey, audioData, mimeType });
  }

  const messages = sanitizeMessages(body?.messages ?? []);

  if (!messages.length) {
    return NextResponse.json({ message: "Escreva uma mensagem para começar." }, { status: 400 });
  }

  const { response, payload } = await requestGemini({
    apiKey,
    body: {
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
    }
  });
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

async function transcribeAudio({
  apiKey,
  audioData,
  mimeType
}: {
  apiKey: string;
  audioData: string;
  mimeType: string;
}) {
  const { response, payload } = await requestGemini({
    apiKey,
    body: {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Transcribe this audio as accurately and literally as possible.
The speaker is a Brazilian software developer practicing spoken English.
The audio may contain technical terms such as API, backend, frontend, React, Java, JavaScript, TypeScript, AWS, Jira, bug, endpoint, database, deploy, deployment, pull request, code review, branch, commit, merge, test, production, and staging.
Do not translate, correct grammar, improve phrasing, summarize, or invent missing words.
Preserve the speaker's actual mistakes and wording.
If a word is unclear, choose the closest phonetic transcription instead of rewriting the sentence.
Return only the transcript, without comments, quotes, labels, corrections, or markdown.`
            },
            { inlineData: { mimeType, data: audioData } }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 }
      }
    }
  });
  if (!response.ok) {
    return NextResponse.json(
      { message: payload?.error?.message ?? "Não consegui transcrever a gravação." },
      { status: response.status }
    );
  }

  const text = extractOutputText(payload);
  if (!text) return NextResponse.json({ message: "Nenhuma fala foi detectada na gravação." }, { status: 422 });
  return NextResponse.json({ text });
}

async function requestGemini({ apiKey, body }: { apiKey: string; body: Record<string, unknown> }) {
  const primaryModel = process.env.GEMINI_ENGLISH_TUTOR_MODEL || "gemini-2.5-flash";
  const fallbackModel = process.env.GEMINI_ENGLISH_TUTOR_FALLBACK_MODEL || "gemini-2.5-flash-lite";
  const models = primaryModel === fallbackModel ? [primaryModel] : [primaryModel, fallbackModel];
  let lastResponse: Response | undefined;
  let lastPayload: GeminiResponse | undefined;

  for (const [index, model] of models.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 400));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );
    const payload = (await response.json().catch(() => undefined)) as GeminiResponse | undefined;
    lastResponse = response;
    lastPayload = payload;

    if (response.ok || !shouldTryFallback(response.status, payload)) return { response, payload };
  }

  return { response: lastResponse!, payload: lastPayload };
}

function shouldTryFallback(status: number, payload?: GeminiResponse) {
  const message = payload?.error?.message?.toLowerCase() ?? "";
  return status === 429 || status === 503 || message.includes("high demand") || message.includes("overloaded");
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
