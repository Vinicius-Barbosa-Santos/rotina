export type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export const welcomeTutorMessage: TutorMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi! Let's practice a developer daily. What did you work on yesterday, and what will you work on today?"
};

export async function requestTutor(
  mode: "chat" | "summary",
  messages: TutorMessage[],
  pronunciationNotes: string[] = []
) {
  const response = await fetch("/api/english-tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode,
      pronunciationNotes,
      messages: messages.map(({ role, content }) => ({ role, content }))
    })
  });
  const payload = (await response.json()) as { text?: string; message?: string };

  if (!response.ok || !payload.text) {
    throw new Error(payload.message ?? "Não consegui falar com a tutora.");
  }

  return payload.text;
}

export async function requestAudioTranscription(audio: Blob) {
  if (audio.size > 8 * 1024 * 1024) throw new Error("O áudio ficou muito longo. Grave uma resposta mais curta.");

  const data = await blobToBase64(audio);
  const response = await fetch("/api/english-tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "transcribe",
      audio: { data, mimeType: audio.type || "audio/webm" }
    })
  });
  const payload = (await response.json()) as { text?: string; pronunciationFeedback?: string; message?: string };
  if (!response.ok || !payload.text) throw new Error(payload.message ?? "Não consegui transcrever o áudio.");
  return { text: payload.text, pronunciationFeedback: payload.pronunciationFeedback ?? "" };
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Não consegui ler a gravação."));
    reader.readAsDataURL(blob);
  });
}
