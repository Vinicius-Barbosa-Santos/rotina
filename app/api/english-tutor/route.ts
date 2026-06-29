import { NextResponse } from "next/server";
import { getGeminiUsageLimitMessage, recordGeminiUsage } from "@/lib/gemini-usage";

type TutorMessage = {
  role: "user" | "assistant";
  content: string;
};

type TutorRequest = {
  mode?: "chat" | "summary" | "transcribe";
  messages?: TutorMessage[];
  pronunciationNotes?: string[];
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

const chatMaxMessages = 30;
const chatMaxCharacters = 12_000;
const summaryMaxMessages = 80;
const summaryMaxCharacters = 30_000;
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

    const usage = await recordGeminiUsage("transcribe");
    if (!usage.allowed) return usageLimitResponse("transcribe", usage.limit);

    return transcribeAudio({ apiKey, audioData, mimeType });
  }

  const messages = sanitizeMessages(body?.messages ?? [], mode);
  const pronunciationNotes = sanitizePronunciationNotes(body?.pronunciationNotes ?? []);

  if (!messages.length) {
    return NextResponse.json({ message: "Escreva uma mensagem para começar." }, { status: 400 });
  }

  const usageKind = mode === "summary" ? "summary" : "chat";
  const usage = await recordGeminiUsage(usageKind);
  if (!usage.allowed) return usageLimitResponse(usageKind, usage.limit);

  const { response, payload } = await requestGemini({
    apiKey,
    body: {
      systemInstruction: {
        parts: [
          {
            text:
              mode === "summary"
                ? `${summaryInstructions}\n\nPronunciation observations collected directly from the learner's recordings:\n${
                    pronunciationNotes.length
                      ? pronunciationNotes.map((note) => `- ${note}`).join("\n")
                      : "- No reliable pronunciation observations were collected."
                  }`
                : conversationInstructions
          }
        ]
      },
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }]
      })),
      generationConfig: {
        maxOutputTokens: mode === "summary" ? 3_000 : 600,
        thinkingConfig: { thinkingBudget: 0 }
      }
    }
  });
  if (!response.ok) {
    return NextResponse.json(
      { message: getGeminiErrorMessage(payload, "Não consegui falar com a tutora agora.") },
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
Also evaluate pronunciation from the audio itself. Mention only clear, useful pronunciation points. Do not infer pronunciation problems from grammar or wording.
Return a JSON object with:
- "transcript": the literal English transcript;
- "pronunciationFeedback": a concise observation in Brazilian Portuguese, with specific English words to practice, or an empty string when pronunciation cannot be assessed reliably.`
            },
            { inlineData: { mimeType, data: audioData } }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            transcript: { type: "STRING" },
            pronunciationFeedback: { type: "STRING" }
          },
          required: ["transcript", "pronunciationFeedback"]
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    }
  });
  if (!response.ok) {
    return NextResponse.json(
      { message: getGeminiErrorMessage(payload, "Não consegui transcrever a gravação.") },
      { status: response.status }
    );
  }

  const result = parseTranscriptionResult(extractOutputText(payload) ?? "");
  if (!result.text) return NextResponse.json({ message: "Nenhuma fala foi detectada na gravação." }, { status: 422 });
  return NextResponse.json(result);
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
  if (isQuotaErrorMessage(message)) return false;
  return status === 503 || message.includes("high demand") || message.includes("overloaded");
}

function getGeminiErrorMessage(payload: GeminiResponse | undefined, fallback: string) {
  const message = payload?.error?.message ?? "";
  const lowerMessage = message.toLowerCase();
  const retryMatch = message.match(/retry in ([\d.]+)s/i);
  const retrySeconds = retryMatch ? Math.ceil(Number(retryMatch[1])) : null;

  if (isQuotaErrorMessage(lowerMessage)) {
    return retrySeconds
      ? `O Gemini atingiu um limite temporário. Tente novamente em cerca de ${retrySeconds} segundos.`
      : "O Gemini atingiu o limite temporário do plano gratuito. Tente novamente em alguns minutos.";
  }

  if (lowerMessage.includes("high demand") || lowerMessage.includes("overloaded")) {
    return "O Gemini está com alta demanda agora. Tente novamente em alguns minutos.";
  }

  return message || fallback;
}

function usageLimitResponse(kind: "chat" | "summary" | "transcribe", limit: number) {
  return NextResponse.json(
    { message: getGeminiUsageLimitMessage(kind, limit) },
    { status: 429 }
  );
}

function isQuotaErrorMessage(message: string) {
  return message.includes("quota exceeded") || message.includes("rate limit") || message.includes("free_tier_requests");
}

function allowRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const visitor = forwardedFor || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  if (requestWindows.size > 1_000) {
    requestWindows.forEach((window, key) => {
      if (window.resetsAt <= now) requestWindows.delete(key);
    });
  }
  const current = requestWindows.get(visitor);

  if (!current || current.resetsAt <= now) {
    requestWindows.set(visitor, { count: 1, resetsAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (current.count >= maxRequestsPerHour) return false;
  current.count += 1;
  return true;
}

function sanitizeMessages(messages: TutorMessage[], mode: "chat" | "summary") {
  const maxMessages = mode === "summary" ? summaryMaxMessages : chatMaxMessages;
  const maxCharacters = mode === "summary" ? summaryMaxCharacters : chatMaxCharacters;
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
      return characters <= maxCharacters;
    })
    .reverse();
}

function sanitizePronunciationNotes(notes: unknown) {
  return (Array.isArray(notes) ? notes : [])
    .filter((note) => typeof note === "string")
    .map((note) => note.trim().slice(0, 500))
    .filter(Boolean)
    .slice(-30);
}

function extractOutputText(payload?: GeminiResponse) {
  return payload?.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();
}

function parseTranscriptionResult(output: string) {
  try {
    const parsed = JSON.parse(output) as { transcript?: unknown; pronunciationFeedback?: unknown };
    return {
      text: typeof parsed.transcript === "string" ? parsed.transcript.trim() : "",
      pronunciationFeedback:
        typeof parsed.pronunciationFeedback === "string" ? parsed.pronunciationFeedback.trim() : ""
    };
  } catch {
    return { text: output.trim(), pronunciationFeedback: "" };
  }
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
Review every learner message in the conversation. The report must be comprehensive, not a brief summary.
Do not omit a correction merely because the original sentence was understandable.
Deduplicate repeated mistakes, but list every distinct opportunity to improve grammar, spelling, punctuation, word choice, sentence structure, clarity, tone, fluency, and naturalness.
Clearly distinguish evidence from written messages from evidence collected through audio pronunciation observations.

Use exactly these sections:

## Cenário praticado
## O que você comunicou bem
## Correções completas da escrita
## Como soar mais natural
## Fala, fluência e clareza
## Pronúncia observada nos áudios
## Padrões que mais se repetem
## Vocabulário e frases melhores
## Plano de estudo personalizado

In "Correções completas da escrita", enumerate every distinct issue using this exact structure:
1. Original: "short learner fragment"
   Correção: "correct English"
   Mais natural: "natural workplace English"
   Explicação: concise explanation in Brazilian Portuguese

If a sentence is grammatically correct but unnatural, include it under "Como soar mais natural".
Evaluate confidence and fluency only when the conversation or audio observations provide evidence; never pretend to hear written text.
For pronunciation, use only the supplied audio observations. Never infer pronunciation from spelling or grammar. If there are no reliable observations, say so clearly.
Identify recurring patterns and rank them by impact. Finish with specific exercises and at least 5 reusable workplace sentences tailored to the learner's actual mistakes.
Be direct, constructive, and detailed. Quote only short fragments from the learner's messages.
`.trim();
