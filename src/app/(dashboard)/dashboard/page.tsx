"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, FileCheck, Send, Zap, ChevronRight,
  Sparkles, Clock, ExternalLink, CheckCircle2,
  Users, Building2, X, Bot, User,
} from "lucide-react";
import { validateProject, validateAllocationSum, type Community } from "@/lib/types/community";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, Stagger, StaggerItem, motion } from "@/components/ui/motion";
import { AnimatePresence } from "framer-motion";

// ── Pipeline ────────────────────────────────────────────────────────────────

type PipelineState = "faltan_datos" | "pendiente_firma" | "listo_para_enviar" | "activado";

function derivePipelineState(c: Community): PipelineState {
  if (c.phase === "activo" || c.phase === "enviado") return "activado";
  const issues = validateProject(c);
  const errors = issues.filter(i => i.type === "error");
  if (errors.length > 0) return "faltan_datos";
  const active = c.participants.filter(p => p.status !== "exited");
  const pendingSigs = active.filter(p => p.signatureState === "pending").length;
  if (pendingSigs > 0) return "pendiente_firma";
  const alloc = validateAllocationSum(c.participants);
  const hasTxt = c.documents.txt;
  if (alloc.valid && hasTxt && active.every(p => p.signatureState === "signed")) return "listo_para_enviar";
  return "faltan_datos";
}

interface DerivedCommunity {
  id: string;
  nombre: string;
  estado: PipelineState;
  errores: string[];
  fechaActivacion?: string;
  firmasPendientes?: string;
}

const PIPELINE: { id: PipelineState; label: string; icon: typeof AlertCircle; badgeClass: string }[] = [
  { id: "faltan_datos", label: "Faltan datos", icon: AlertCircle, badgeClass: "badge-warning" },
  { id: "pendiente_firma", label: "Pendiente firma", icon: FileCheck, badgeClass: "badge-info" },
  { id: "listo_para_enviar", label: "Listo para enviar", icon: Send, badgeClass: "badge-success" },
  { id: "activado", label: "Activado", icon: Zap, badgeClass: "badge-active" },
];

function buildDerived(communities: Community[]): DerivedCommunity[] {
  return communities.map(c => {
    const estado = derivePipelineState(c);
    const issues = validateProject(c);
    const active = c.participants.filter(p => p.status !== "exited");
    const pendingSigs = active.filter(p => p.signatureState === "pending").length;
    const signed = active.filter(p => p.signatureState === "signed").length;
    return {
      id: c.id,
      nombre: c.name,
      estado,
      errores: issues.map(i => i.message),
      fechaActivacion: estado === "activado" ? c.createdAt : undefined,
      firmasPendientes: pendingSigs > 0 ? `${signed} de ${active.length} participantes han firmado` : undefined,
    };
  });
}

// ── Chat ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const PLACEHOLDER_TEXTS = [
  "¿Cuántas comunidades tengo pendientes de firma?",
  "¿Qué errores tiene el Edificio Lumina?",
  "¿Cuál es el siguiente paso para Torres del Parque?",
  "¿Cómo funciona el fichero TXT para la distribuidora?",
];

import { useTypewriter } from "@/hooks/useTypewriter";

// Simple markdown renderer — handles **bold**, bullet lists, line breaks
function MdText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <div className={className}>
      {lines.map((line, i) => {
        // Bullet list
        const isBullet = /^[-*•]\s/.test(line);
        const content = line.replace(/^[-*•]\s/, "");
        // Bold: **text**
        const parts = content.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        );
        if (isBullet) {
          return (
            <div key={i} className="flex gap-1.5 mt-0.5">
              <span className="flex-shrink-0 mt-[3px]">·</span>
              <span>{parts}</span>
            </div>
          );
        }
        return line.trim() === "" ? (
          <div key={i} className="h-2" />
        ) : (
          <div key={i} className="mt-0.5 first:mt-0">{parts}</div>
        );
      })}
    </div>
  );
}

function ChatPanel({
  messages,
  streaming,
  streamingText,
  onClose,
  noApiKey,
}: {
  messages: ChatMessage[];
  streaming: boolean;
  streamingText: string;
  onClose: () => void;
  noApiKey: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    const container = chatContainerRef.current;
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

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Asistente Repartio</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">IA</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* No API key warning */}
      {noApiKey && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <strong>ANTHROPIC_API_KEY no configurada.</strong> Añádela en <code>.env</code> y reinicia el servidor para activar el chat.
        </div>
      )}

      {/* Messages */}
      <div ref={chatContainerRef} className="h-72 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Pregúntame sobre tus comunidades</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tengo acceso a todos tus datos en tiempo real</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              m.role === "user" ? "bg-primary/20" : "bg-muted"
            }`}>
              {m.role === "user" ? <User className="w-3.5 h-3.5 text-primary" /> : <Bot className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}>
              {m.role === "assistant"
                ? <MdText text={m.content} />
                : m.content}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed bg-muted text-foreground">
              {streamingText
                ? <MdText text={streamingText} />
                : <span className="animate-pulse">···</span>}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Community Row ───────────────────────────────────────────────────────────

function CommunityRow({ community: com, onNavigate, onEnviado }: { community: DerivedCommunity; onNavigate: () => void; onEnviado?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [marking, setMarking] = useState(false);

  const handleMarkEnviado = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMarking(true);
    try {
      await fetch(`/api/communities/${com.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fase: "enviado" }),
      });
      onEnviado?.();
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="hover:bg-muted/30 transition-colors">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        <span className="text-sm font-medium text-foreground flex-1">{com.nombre}</span>
        {com.estado === "faltan_datos" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full badge-warning font-medium">
            {com.errores.length} problema{com.errores.length !== 1 ? "s" : ""}
          </span>
        )}
        {com.estado === "pendiente_firma" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full badge-info font-medium">
            {com.firmasPendientes || "Firmas pendientes"}
          </span>
        )}
        {com.estado === "listo_para_enviar" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full badge-success font-medium">Todo listo</span>
        )}
        {com.estado === "activado" && com.fechaActivacion && (
          <span className="text-[10px] px-2 py-0.5 rounded-full badge-active font-medium">
            Activa desde {new Date(com.fechaActivacion).toLocaleDateString("es-ES")}
          </span>
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4 pl-11 space-y-2">
          {com.estado === "faltan_datos" && com.errores.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-destructive/70 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{err}</span>
            </div>
          ))}
          {com.estado === "pendiente_firma" && (
            <div className="flex items-start gap-2 text-xs">
              <FileCheck className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{com.firmasPendientes || "Pendientes de firma"}</span>
            </div>
          )}
          {com.estado === "listo_para_enviar" && (
            <button
              onClick={handleMarkEnviado}
              disabled={marking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {marking
                ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Marcando...</>
                : <><Send className="w-3 h-3" /> Marcar como enviado</>
              }
            </button>
          )}
          {com.estado === "activado" && (
            <p className="text-xs text-muted-foreground">
              Comunidad activa desde {com.fechaActivacion ? new Date(com.fechaActivacion).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </p>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium mt-2 hover:opacity-90 transition-opacity"
          >
            Arreglar problema ahora
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const placeholder = useTypewriter(PLACEHOLDER_TEXTS);
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [noApiKey, setNoApiKey] = useState(false);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/communities")
      .then(r => r.json())
      .then(data => { setCommunities(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const comunidades = useMemo(() => buildDerived(communities), [communities]);

  const grouped = useMemo(() => {
    const map: Record<PipelineState, DerivedCommunity[]> = {
      faltan_datos: [], pendiente_firma: [], listo_para_enviar: [], activado: [],
    };
    comunidades.forEach(c => map[c.estado].push(c));
    return map;
  }, [comunidades]);

  const defaultExpanded = useMemo(() => {
    return PIPELINE.find(p => grouped[p.id].length > 0)?.id ?? "faltan_datos";
  }, [grouped]);

  const [activeState, setActiveState] = useState<PipelineState>("faltan_datos");

  useEffect(() => {
    if (!loading) setActiveState(defaultExpanded);
  }, [loading, defaultExpanded]);

  const totalParticipants = communities.reduce((s, c) => s + c.participants.filter(p => p.status !== "exited").length, 0);
  const totalPower = communities.reduce((s, c) => s + c.potenciaInstalada, 0);

  // Chat send handler with SSE streaming
  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || streaming) return;

    setChatOpen(true);
    setChatInput("");
    setNoApiKey(false);
    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages);
    setStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (res.status === 503) {
        setNoApiKey(true);
        setStreaming(false);
        return;
      }

      if (!res.ok) {
        setChatMessages(prev => [...prev, { role: "assistant", content: "Lo siento, hubo un error. Inténtalo de nuevo." }]);
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
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const { text: t } = JSON.parse(data);
            fullText += t;
            setStreamingText(fullText);
          } catch {}
        }
      }

      setChatMessages(prev => [...prev, { role: "assistant", content: fullText }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Inténtalo de nuevo." }]);
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  };

  const activePipeline = PIPELINE.find(p => p.id === activeState)!;
  const activeCount = grouped[activeState]?.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-8 py-12 space-y-12">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <FadeIn className="flex items-end justify-between gap-6">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Panel de control
          </p>
          <h1 className="font-heading text-[32px] font-semibold leading-[1.15] tracking-[-0.015em] text-foreground">
            Todas tus comunidades, de un vistazo
          </h1>
          <p className="text-sm text-muted-foreground">
            Revisa el estado de cada instalación y actúa sobre las que requieren tu atención.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-xs">
          <a href="/communities/new">Nueva comunidad</a>
        </Button>
      </FadeIn>

      {/* ── AI Chat input ──────────────────────────────────────────────────── */}
      <FadeIn delay={0.05} className="space-y-3">
        <div className="group relative flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs transition-colors focus-within:border-foreground/20">
          <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
            onFocus={() => { if (!chatOpen && chatMessages.length > 0) setChatOpen(true); }}
            placeholder={chatInput ? "" : (chatOpen ? "Escribe un mensaje…" : placeholder + "\u258F")}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 text-foreground"
          />
          <button
            onClick={handleChatSend}
            disabled={streaming || !chatInput.trim()}
            aria-label="Enviar"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <ChatPanel
                messages={chatMessages}
                streaming={streaming}
                streamingText={streamingText}
                onClose={() => setChatOpen(false)}
                noApiKey={noApiKey}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </FadeIn>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4" delayChildren={0.1}>
          <StaggerItem>
            <KpiCard title="Comunidades" value={communities.length} icon={Building2} />
          </StaggerItem>
          <StaggerItem>
            <KpiCard title="Participantes" value={totalParticipants} icon={Users} />
          </StaggerItem>
          <StaggerItem>
            <KpiCard title="Potencia total" value={totalPower} suffix=" kWp" icon={Zap} />
          </StaggerItem>
        </Stagger>
      )}

      {/* ── Pipeline section ───────────────────────────────────────────────── */}
      <FadeIn delay={0.15} className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Pipeline
            </h2>
            <p className="text-xs text-muted-foreground">
              Filtra tus comunidades por estado operativo
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-[88px] rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PIPELINE.map((state) => {
              const count = grouped[state.id].length;
              const isActive = activeState === state.id;
              const Icon = state.icon;
              return (
                <motion.button
                  key={state.id}
                  onClick={() => setActiveState(state.id)}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.15 }}
                  className={`group relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-colors ${
                    isActive
                      ? "border-foreground/20 shadow-card"
                      : "border-border hover:border-foreground/15"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${state.badgeClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="font-heading text-2xl font-semibold leading-none tabular-nums text-foreground">
                      {count}
                    </p>
                  </div>
                  <p className={`mt-5 text-xs font-medium transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  }`}>
                    {state.label}
                  </p>
                  {isActive && (
                    <motion.div
                      layoutId="pipeline-active"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </FadeIn>

      {/* ── Community list ─────────────────────────────────────────────────── */}
      <FadeIn delay={0.2} className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              {activePipeline.label}
            </h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {activeCount} {activeCount === 1 ? "comunidad" : "comunidades"} en este estado
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {loading ? (
            <div className="divide-y divide-border">
              {[1,2,3].map(i => <Skeleton key={i} className="m-0 h-14 rounded-none" />)}
            </div>
          ) : activeCount === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Sin comunidades aquí</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                No hay ninguna comunidad en estado “{activePipeline.label.toLowerCase()}”.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {grouped[activeState].map((com) => (
                <CommunityRow
                  key={com.id}
                  community={com}
                  onNavigate={() => router.push(`/communities/${com.id}`)}
                  onEnviado={() => {
                    setCommunities(prev => prev.map(c =>
                      c.id === com.id ? { ...c, phase: "enviado" as const } : c
                    ));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* ── Activity feed ──────────────────────────────────────────────────── */}
      <FadeIn delay={0.25} className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Últimos movimientos
            </h2>
            <p className="text-xs text-muted-foreground">Actividad reciente en tus comunidades</p>
          </div>
          <Clock className="h-4 w-4 text-muted-foreground/60" />
        </div>

        <div className="rounded-xl border border-border bg-card">
          {communities.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              Aún no hay actividad.
            </div>
          ) : (
            <ol className="relative px-6 py-5">
              <div className="absolute left-[31px] top-6 bottom-6 w-px bg-border" aria-hidden />
              {communities.slice(0, 5).map((c, i, arr) => (
                <li key={c.id} className={`relative flex gap-4 ${i < arr.length - 1 ? "pb-5" : ""}`}>
                  <div className="relative z-10 mt-1 flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-foreground/30 ring-4 ring-card" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {c.participants.filter(p => p.status !== "exited").length} participantes · {c.potenciaInstalada} kWp
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span className="capitalize">{c.phase}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
