"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Mic, Send, Sparkles, Trash2, Volume2, VolumeX } from "lucide-react";
import {
  requestAudioTranscription,
  requestTutor,
  welcomeTutorMessage,
  type TutorMessage
} from "@/lib/english-tutor";
import { readStorageJson } from "@/lib/storage";

const conversationKey = "rotina_english_tutor_conversation";
const summaryKey = "rotina_english_tutor_summary";
const pronunciationNotesKey = "rotina_english_tutor_pronunciation_notes";

export default function EnglishTutor() {
  const [messages, setMessages] = useState<TutorMessage[]>([welcomeTutorMessage]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [pronunciationNotes, setPronunciationNotes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const savedSummary = localStorage.getItem(summaryKey);

    setMessages(readStorageJson<TutorMessage[]>(conversationKey, [welcomeTutorMessage]));
    if (savedSummary) setSummary(savedSummary);
    setPronunciationNotes(readStorageJson<string[]>(pronunciationNotesKey, []));
    setSpeechSupported("speechSynthesis" in window && "mediaDevices" in navigator && "MediaRecorder" in window);

    return () => {
      recorderRef.current?.stop();
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(conversationKey, JSON.stringify(messages));
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading) return;

    stopRecording();
    const userMessage: TutorMessage = { id: crypto.randomUUID(), role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const text = await requestTutor("chat", nextMessages);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: text }]);
      if (voiceEnabled) speak(text);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não consegui falar com a tutora.");
    } finally {
      setLoading(false);
    }
  }

  async function createSummary() {
    if (!messages.some((message) => message.role === "user") || summarizing) return;

    setError("");
    setSummarizing(true);
    try {
      const text = await requestTutor("summary", messages, pronunciationNotes);
      setSummary(text);
      localStorage.setItem(summaryKey, text);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não consegui criar o resumo.");
    } finally {
      setSummarizing(false);
    }
  }

  function clearConversation() {
    stopRecording();
    window.speechSynthesis?.cancel();
    setMessages([welcomeTutorMessage]);
    setSummary("");
    setPronunciationNotes([]);
    setError("");
    localStorage.removeItem(conversationKey);
    localStorage.removeItem(summaryKey);
    localStorage.removeItem(pronunciationNotesKey);
  }

  function toggleVoice() {
    if (!speechSupported) {
      setError("A conversa por voz não é suportada neste navegador. Você ainda pode praticar por texto.");
      return;
    }

    const nextEnabled = !voiceEnabled;
    setVoiceEnabled(nextEnabled);
    setError("");
    if (nextEnabled) speak(messages.at(-1)?.content ?? welcomeTutorMessage.content);
    else window.speechSynthesis.cancel();
  }

  function speak(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/Quick correction:[\s\S]*/i, "").replace(/[#*_`]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
      return;
    }

    startRecording();
  }

  async function startRecording() {
    if (!("mediaDevices" in navigator) || !("MediaRecorder" in window)) {
      setError("O microfone para fala não é suportado neste navegador.");
      return;
    }

    window.speechSynthesis?.cancel();
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 128_000
      });

      audioChunksRef.current = [];
      recordingStreamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        if (audio.size > 0) await transcribeAudio(audio);
      };
      recorder.start();
      setRecording(true);
    } catch (requestError) {
      setRecording(false);
      setError(
        requestError instanceof DOMException && requestError.name === "NotAllowedError"
          ? "O acesso ao microfone foi bloqueado. Libere a permissão do navegador e tente novamente."
          : "Não consegui iniciar a gravação. Tente novamente."
      );
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function transcribeAudio(audio: Blob) {
    setTranscribing(true);
    setError("");
    try {
      const result = await requestAudioTranscription(audio);
      setInput(result.text);
      if (result.pronunciationFeedback) {
        setPronunciationNotes((current) => {
          const next = [...current, result.pronunciationFeedback].slice(-12);
          localStorage.setItem(pronunciationNotesKey, JSON.stringify(next));
          return next;
        });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não consegui transcrever o áudio.");
    } finally {
      setTranscribing(false);
    }
  }

  function downloadSummary() {
    if (!summary) return;

    const date = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeStyle: "short"
    }).format(new Date());
    const content = `# Relatório de prática de inglês\n\nGerado em ${date}\n\n${summary}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-ingles-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="englishTutor" aria-label="Prática de inglês com IA">
      <div className="englishTutorHeader">
        <div>
          <span>
            <Sparkles size={15} aria-hidden />
            Developer English Practice
          </span>
          <small>Pratique comunicação para daily, tarefas, bugs, code review e entrevistas.</small>
        </div>
        <div className="englishTutorHeaderActions">
          <button type="button" onClick={toggleVoice} aria-label={voiceEnabled ? "Desativar voz" : "Ativar voz"}>
            {voiceEnabled ? <Volume2 size={15} aria-hidden /> : <VolumeX size={15} aria-hidden />}
          </button>
          <button type="button" onClick={clearConversation} aria-label="Começar nova conversa">
            <Trash2 size={15} aria-hidden />
          </button>
        </div>
      </div>

      <div className="englishConversation" ref={conversationRef}>
        {messages.map((message) => (
          <div className={`englishMessage ${message.role}`} key={message.id}>
            <small>{message.role === "assistant" ? "Tutora" : "Você"}</small>
            <p>{message.content}</p>
          </div>
        ))}
        {loading && (
          <div className="englishMessage assistant loading">
            <Loader2 className="spin" size={16} aria-hidden />
            <span>Preparando resposta...</span>
          </div>
        )}
      </div>

      <form
        className="englishComposer"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Write something in English..."
          rows={2}
        />
        <button
          className={recording ? "englishMicButton listening" : "englishMicButton"}
          type="button"
          onClick={toggleRecording}
          disabled={!speechSupported || transcribing}
          aria-label={recording ? "Parar gravação" : "Gravar resposta"}
        >
          {transcribing ? <Loader2 className="spin" size={17} aria-hidden /> : <Mic size={17} aria-hidden />}
        </button>
        <button type="submit" disabled={!input.trim() || loading} aria-label="Enviar mensagem">
          <Send size={17} aria-hidden />
        </button>
      </form>

      <div className="englishTutorActions">
        <button type="button" onClick={createSummary} disabled={summarizing || !messages.some((message) => message.role === "user")}>
          {summarizing ? <Loader2 className="spin" size={15} aria-hidden /> : <Sparkles size={15} aria-hidden />}
          {summarizing ? "Analisando..." : "Gerar relatório da prática"}
        </button>
        <span>
          {speechSupported
            ? recording
              ? "Gravando. Fale com calma e toque novamente para transcrever."
              : transcribing
                ? "Transcrevendo sua resposta com o Gemini..."
                : "Ative a voz para ouvir a tutora e grave sua resposta pelo microfone."
            : "A fala não está disponível neste navegador; pratique por texto."}
        </span>
      </div>

      {error && <div className="englishTutorError">{error}</div>}
      {summary && (
        <div className="englishSummary">
          <div className="englishSummaryHeader">
            <strong>Relatório da sessão</strong>
            <button type="button" onClick={downloadSummary}>
              <Download size={15} aria-hidden />
              Baixar arquivo
            </button>
          </div>
          <p>{summary}</p>
        </div>
      )}
    </section>
  );
}

function getSupportedAudioMimeType() {
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
}
