"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";

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
  content: "Hi! Let's practice English. How has your day been so far?"
};

export default function EnglishTutor() {
  const [messages, setMessages] = useState<TutorMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);

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
  }, []);

  useEffect(() => {
    localStorage.setItem(conversationKey, JSON.stringify(messages));
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading) return;

    const userMessage: TutorMessage = { id: crypto.randomUUID(), role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const text = await requestTutor("chat", nextMessages);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: text }]);
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
    setMessages([welcomeMessage]);
    setSummary("");
    setError("");
    localStorage.removeItem(conversationKey);
    localStorage.removeItem(summaryKey);
  }

  return (
    <section className="englishTutor" aria-label="Prática de inglês com IA">
      <div className="englishTutorHeader">
        <div>
          <span>
            <Sparkles size={15} aria-hidden />
            English AI Practice
          </span>
          <small>Converse em inglês e receba correções durante a prática.</small>
        </div>
        <button type="button" onClick={clearConversation} aria-label="Começar nova conversa">
          <Trash2 size={15} aria-hidden />
        </button>
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
        <button type="submit" disabled={!input.trim() || loading} aria-label="Enviar mensagem">
          <Send size={17} aria-hidden />
        </button>
      </form>

      <div className="englishTutorActions">
        <button type="button" onClick={createSummary} disabled={summarizing || !messages.some((message) => message.role === "user")}>
          {summarizing ? <Loader2 className="spin" size={15} aria-hidden /> : <Sparkles size={15} aria-hidden />}
          {summarizing ? "Analisando..." : "Resumir minha prática"}
        </button>
        <span>O histórico fica salvo neste dispositivo.</span>
      </div>

      {error && <div className="englishTutorError">{error}</div>}
      {summary && (
        <div className="englishSummary">
          <strong>Resumo da sessão</strong>
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
