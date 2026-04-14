"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, Zap } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "¿Qué comunidades tengo pendientes de firma?",
  "¿Cómo funciona el fichero TXT para la distribuidora?",
  "¿Qué documentos necesito para activar una comunidad?",
  "Explícame los coeficientes β del autoconsumo colectivo",
];

// Simple markdown renderer
function MdText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const isBullet = /^[-*•]\s/.test(line);
        const content = line.replace(/^[-*•]\s/, "");
        const parts = content.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        );
        if (isBullet) return (
          <div key={i} className="flex gap-2">
            <span className="flex-shrink-0 text-primary mt-0.5">·</span>
            <span>{parts}</span>
          </div>
        );
        return line.trim() === ""
          ? <div key={i} className="h-2" />
          : <div key={i}>{parts}</div>;
      })}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [noApiKey, setNoApiKey] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
      userScrolledUp.current = !atBottom;
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!userScrolledUp.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput("");
    setNoApiKey(false);

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (res.status === 503) { setNoApiKey(true); setStreaming(false); return; }
      if (!res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, hubo un error. Inténtalo de nuevo." }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      if (!reader) { setStreaming(false); return; }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try { const { text: t } = JSON.parse(data); fullText += t; setStreamingText(fullText); } catch {}
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullText }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Inténtalo de nuevo." }]);
    } finally {
      setStreaming(false);
      setStreamingText("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">Chat energético</h1>
          <p className="text-xs text-muted-foreground">Asistente IA con acceso a tus comunidades en tiempo real</p>
        </div>
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Empty state */}
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">¿En qué puedo ayudarte?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Tengo acceso a todas tus comunidades, participantes y documentos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-sm text-muted-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {noApiKey && (
                <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 max-w-md">
                  <strong>ANTHROPIC_API_KEY no configurada.</strong> Añádela en <code>.env</code> y reinicia el servidor.
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                m.role === "user" ? "bg-primary/20" : "bg-muted"
              }`}>
                {m.role === "user"
                  ? <User className="w-3.5 h-3.5 text-primary" />
                  : <Bot className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}>
                {m.role === "assistant" ? <MdText text={m.content} /> : m.content}
              </div>
            </div>
          ))}

          {/* Streaming */}
          {streaming && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm bg-muted text-foreground text-sm leading-relaxed">
                {streamingText
                  ? <MdText text={streamingText} />
                  : <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                }
              </div>
            </div>
          )}

          {noApiKey && messages.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <strong>ANTHROPIC_API_KEY no configurada.</strong> Añádela en <code>.env</code>.
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border px-6 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Escribe tu mensaje..."
            disabled={streaming}
            className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={streaming || !input.trim()}
            className="p-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
