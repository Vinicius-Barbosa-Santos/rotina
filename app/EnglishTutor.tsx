"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Send, Sparkles, Trash2, Volume2, VolumeX } from "lucide-react";

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }>;
  }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const conversationKey = "rotina_english_tutor_conversation";
const summaryKey = "rotina_english_tutor_summary";

const welcomeMessage: TutorMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi! Let's practice a developer daily. What did you work on yesterday, and what will you work on today?"
};

export default function EnglishTutor() {
  const [messages, setMessages] = useState<TutorMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const keepListeningRef = useRef(false);

  useEffect(() => {
    const savedMessages = localStorage.getItem(conversationKey);
    const savedSummary = localStorage.getItem(summaryKey);

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages) as TutorMessage[]);
      } catch {
        localStorage.removeItem(conversationKey);
      }
    }
    if (savedSummary) setSummary(savedSummary);
    setSpeechSupported(Boolean(window.speechSynthesis && (window.SpeechRecognition || window.webkitSpeechRecognition)));

    return () => {
      keepListeningRef.current = false;
      recognitionRef.current?.stop();
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

    stopListening();
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
      const text = await requestTutor("summary", messages);
      setSummary(text);
      localStorage.setItem(summaryKey, text);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não consegui criar o resumo.");
    } finally {
      setSummarizing(false);
    }
  }

  function clearConversation() {
    stopListening();
    window.speechSynthesis?.cancel();
    setMessages([welcomeMessage]);
    setSummary("");
    setError("");
    localStorage.removeItem(conversationKey);
    localStorage.removeItem(summaryKey);
  }

  function toggleVoice() {
    if (!speechSupported) {
      setError("A conversa por voz não é suportada neste navegador. Você ainda pode praticar por texto.");
      return;
    }

    const nextEnabled = !voiceEnabled;
    setVoiceEnabled(nextEnabled);
    setError("");
    if (nextEnabled) speak(messages.at(-1)?.content ?? welcomeMessage.content);
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

  function toggleListening() {
    if (listening) {
      stopListening();
      return;
    }

    startListening();
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("O microfone para fala não é suportado neste navegador.");
      return;
    }

    keepListeningRef.current = true;
    window.speechSynthesis?.cancel();
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcripts: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript?.trim();
        if (transcript && result.isFinal !== false) transcripts.push(transcript);
      }
      if (transcripts.length) {
        setInput((current) => `${current}${current ? " " : ""}${transcripts.join(" ")}`);
      }
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        keepListeningRef.current = false;
        setListening(false);
        setError("O acesso ao microfone foi bloqueado. Libere a permissão do navegador e tente novamente.");
      }
    };
    recognition.onend = () => {
      if (!keepListeningRef.current) {
        setListening(false);
        return;
      }

      window.setTimeout(() => {
        if (!keepListeningRef.current) return;
        try {
          recognition.start();
        } catch {
          keepListeningRef.current = false;
          setListening(false);
          setError("Não consegui manter o microfone ativo. Tente novamente.");
        }
      }, 250);
    };
    recognitionRef.current = recognition;
    setError("");
    setListening(true);
    try {
      recognition.start();
    } catch {
      keepListeningRef.current = false;
      setListening(false);
      setError("Não consegui iniciar o microfone. Tente novamente.");
    }
  }

  function stopListening() {
    keepListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
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
          className={listening ? "englishMicButton listening" : "englishMicButton"}
          type="button"
          onClick={toggleListening}
          disabled={!speechSupported}
          aria-label={listening ? "Parar microfone" : "Responder usando o microfone"}
        >
          <Mic size={17} aria-hidden />
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
            ? listening
              ? "Microfone ativo. Fale com calma e toque novamente para parar."
              : "Ative a voz para ouvir a tutora e use o microfone para responder."
            : "A fala não está disponível neste navegador; pratique por texto."}
        </span>
      </div>

      {error && <div className="englishTutorError">{error}</div>}
      {summary && (
        <div className="englishSummary">
          <strong>Relatório da sessão</strong>
          <p>{summary}</p>
        </div>
      )}
    </section>
  );
}

async function requestTutor(mode: "chat" | "summary", messages: TutorMessage[]) {
  const response = await fetch("/api/english-tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode,
      messages: messages.map(({ role, content }) => ({ role, content }))
    })
  });
  const payload = (await response.json()) as { text?: string; message?: string };

  if (!response.ok || !payload.text) {
    throw new Error(payload.message ?? "Não consegui falar com a tutora.");
  }

  return payload.text;
}
