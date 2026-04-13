"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, FileCheck, Send, Zap, ChevronRight,
  Sparkles, Clock, ExternalLink, CheckCircle2,
  Users, Building2,
} from "lucide-react";
import { mockCommunities } from "@/lib/mock-data";
import { validateProject, validateAllocationSum, type Community } from "@/lib/types/community";
import { KpiCard } from "@/components/dashboard/KpiCard";

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

function buildDerivedCommunities(): DerivedCommunity[] {
  return mockCommunities.map(c => {
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

const ultimosMovimientos = [
  { comunidad: "Residencial Aurora", accion: "Comunidad activa y en funcionamiento", fecha: "Hace 2 días" },
  { comunidad: "Edificio Lumina", accion: "Pendiente de firmas de participantes", fecha: "Hace 1 día" },
  { comunidad: "Torres del Parque", accion: "Coeficientes de reparto actualizados", fecha: "Hace 3 días" },
  { comunidad: "Urbanización Las Encinas", accion: "Documentación lista para enviar a distribuidora", fecha: "Hace 5 días" },
  { comunidad: "Polígono Solar Norte", accion: "Nuevo participante añadido", fecha: "Hace 1 semana" },
];

// ── Typewriter ──────────────────────────────────────────────────────────────

const PLACEHOLDER_TEXTS = [
  "¿Cuántas comunidades tengo pendientes de firma?",
  "¿Qué errores tiene el Edificio Lumina?",
  "¿Cuál es el siguiente paso para Torres del Parque?",
  "Envía la documentación de Urbanización Las Encinas",
];

function useTypewriter(texts: string[], typingSpeed = 80, pauseMs = 3500) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx <= current.length) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        if (charIdx === current.length) {
          timeout = setTimeout(() => setDeleting(true), pauseMs);
          return;
        }
        setCharIdx(c => c + 1);
      }, typingSpeed);
    } else if (deleting && charIdx >= 0) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        if (charIdx === 0) {
          setDeleting(false);
          setIdx(i => (i + 1) % texts.length);
          return;
        }
        setCharIdx(c => c - 1);
      }, typingSpeed / 2);
    }

    return () => clearTimeout(timeout);
  }, [charIdx, deleting, idx, texts, typingSpeed, pauseMs]);

  return display;
}

// ── Community Row ───────────────────────────────────────────────────────────

function CommunityRow({ community: com, onNavigate }: { community: DerivedCommunity; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);

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
              onClick={(e) => { e.stopPropagation(); onNavigate(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Send className="w-3 h-3" /> Enviar a distribuidora
            </button>
          )}
          {com.estado === "activado" && (
            <p className="text-xs text-muted-foreground">
              Comunidad activa desde {com.fechaActivacion ? new Date(com.fechaActivacion).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </p>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(); }}
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            Ir a la comunidad <ExternalLink className="w-3 h-3" />
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

  const comunidades = useMemo(() => buildDerivedCommunities(), []);

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

  const [activeState, setActiveState] = useState<PipelineState>(defaultExpanded);

  const totalParticipants = mockCommunities.reduce((s, c) => s + c.participants.filter(p => p.status !== "exited").length, 0);
  const totalPower = mockCommunities.reduce((s, c) => s + c.potenciaInstalada, 0);

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6 animate-fade-in pb-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Panel de Control</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumen del estado de todas tus comunidades</p>
      </div>

      {/* AI Chat input */}
      <div className="space-y-3">
        <div className="relative flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={chatInput ? "" : placeholder + "\u258F"}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 text-foreground"
            disabled
          />
          <button
            disabled
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Comunidades" value={mockCommunities.length} icon={Building2} delay={0} />
        <KpiCard title="Participantes" value={totalParticipants} icon={Users} delay={100} />
        <KpiCard title="Potencia total" value={totalPower} suffix=" kWp" icon={Zap} delay={200} />
        <KpiCard title="Ahorro estimado" value={10160} prefix="€" icon={Sparkles} trend="+12%" delay={300} />
      </div>

      {/* Pipeline */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="grid grid-cols-4 gap-2">
          {PIPELINE.map((state) => {
            const count = grouped[state.id].length;
            const isActive = activeState === state.id;
            const Icon = state.icon;
            return (
              <button
                key={state.id}
                onClick={() => setActiveState(state.id)}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                  isActive ? "bg-muted ring-1 ring-primary/20" : "hover:bg-muted/50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${state.badgeClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium truncate ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {state.label}
                  </p>
                  <p className="text-lg font-bold text-foreground leading-none mt-0.5">{count}</p>
                </div>
                {isActive && <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Community list for active state */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          {(() => {
            const state = PIPELINE.find(p => p.id === activeState)!;
            const Icon = state.icon;
            return (
              <>
                <div className={`w-5 h-5 rounded flex items-center justify-center ${state.badgeClass}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className="text-sm font-semibold text-foreground">{state.label}</span>
                <span className="text-xs text-muted-foreground">
                  — {grouped[activeState].length} comunidad{grouped[activeState].length !== 1 ? "es" : ""}
                </span>
              </>
            );
          })()}
        </div>
        {grouped[activeState].length === 0 ? (
          <div className="px-4 py-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hay comunidades en este estado</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {grouped[activeState].map((com) => (
              <CommunityRow key={com.id} community={com} onNavigate={() => router.push(`/communities/${com.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Últimos movimientos
        </h2>
        <div className="relative border-l-2 border-border ml-2 space-y-0">
          {ultimosMovimientos.map((mov, i) => (
            <div key={i} className="relative pl-6 pb-4 last:pb-0">
              <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-primary/60 ring-2 ring-background" />
              <p className="text-[13px] text-foreground">
                <span className="font-medium">{mov.comunidad}</span>
                <span className="text-muted-foreground"> — {mov.accion}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{mov.fecha}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
