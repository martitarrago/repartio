"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, CheckCircle2, Clock, PenLine, XCircle, Mail, MailX, Loader2, Wifi, Copy, Link, Check, History, RotateCcw, ChevronDown, ChevronUp, Users } from "lucide-react";
import { type Community } from "@/lib/types/community";
import { supabase } from "@/lib/supabase";

interface ValidationIssue {
  type: "error" | "warning";
  message: string;
}

interface SignaturesTabProps {
  community?: Community;
  communityId?: string;
  conjuntoId?: string;
  validationErrors?: ValidationIssue[];
  onConjuntoRestored?: (conjuntoId: string) => void;
}

interface HistoryEntry {
  id: string;
  estado: string;
  modo: string;
  version: number;
  creadoEn: string;
  isActive: boolean;
  coeficientes: { nombre: string; cups: string; valor: number }[];
  firmas: { id: string; nombre: string; firmadoEn: string | null }[];
}

interface Signer {
  id: string;
  name: string;
  unit: string;
  email: string;
  cups: string;
  state: "signed" | "pending" | "rejected";
  signedAt?: string;
  conjuntoFirmadoId?: string;
}

function stateFromDb(estado: string): "signed" | "pending" | "rejected" {
  if (estado === "FIRMADO") return "signed";
  if (estado === "RECHAZADO") return "rejected";
  return "pending";
}

export function SignaturesTab({ community, communityId, conjuntoId, validationErrors = [], onConjuntoRestored }: SignaturesTabProps) {
  const hasErrors = validationErrors.length > 0;
  const participants = community?.participants.filter(p => p.status !== "exited") || [];

  const [signers, setSigners] = useState<Signer[]>(
    participants.map(p => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      email: p.email,
      cups: p.cups,
      state: p.signatureState,
      signedAt: p.signatureState === "signed" ? new Date().toISOString().slice(0, 10) : undefined,
      conjuntoFirmadoId: p.conjuntoFirmadoId,
    }))
  );

  const [sendingSignatures, setSendingSignatures] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [signatureLinks, setSignatureLinks] = useState<{ nombre: string; email: string | null; link: string; emailSent: boolean }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Historial de firmas
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const instalId = communityId ?? community?.id;

  const fetchHistory = useCallback(async () => {
    if (!instalId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/communities/${instalId}/firma-history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch {} finally {
      setLoadingHistory(false);
    }
  }, [instalId]);

  const handleRestore = async (entryId: string) => {
    if (!instalId) return;
    setRestoringId(entryId);
    try {
      const res = await fetch(`/api/communities/${instalId}/firma-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conjuntoId: entryId }),
      });
      if (res.ok) {
        onConjuntoRestored?.(entryId);
        await fetchHistory();
      }
    } catch {} finally {
      setRestoringId(null);
    }
  };

  // Supabase Realtime — suscribirse a cambios en la tabla Participante
  useEffect(() => {
    const instalId = communityId ?? community?.id;
    if (!instalId) return;

    const channel = supabase
      .channel(`firmas:${instalId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Participante",
          filter: `instalacionId=eq.${instalId}`,
        },
        (payload) => {
          const updated = payload.new as {
            id: string;
            estadoFirma: string;
            firmadoEn?: string;
          };
          setSigners(prev =>
            prev.map(s =>
              s.id === updated.id
                ? {
                    ...s,
                    state: stateFromDb(updated.estadoFirma),
                    signedAt: updated.firmadoEn
                      ? new Date(updated.firmadoEn).toISOString().slice(0, 10)
                      : s.signedAt,
                  }
                : s
            )
          );
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, community?.id]);

  // Una firma solo es válida si fue sobre el conjunto de coeficientes actual
  const isValidSignature = (s: Signer) =>
    s.state === "signed" && (!conjuntoId || s.conjuntoFirmadoId === conjuntoId);
  const isStaleSignature = (s: Signer) =>
    s.state === "signed" && conjuntoId && s.conjuntoFirmadoId !== conjuntoId;

  const signed = signers.filter(isValidSignature).length;
  const stale = signers.filter(isStaleSignature).length;
  const pending = signers.filter(s => s.state === "pending").length + stale;
  const rejected = signers.filter(s => s.state === "rejected").length;
  const total = signers.length;
  const progress = total > 0 ? (signed / total) * 100 : 0;

  const handleRequestSignatures = async (isReminder = false) => {
    const instalId = communityId ?? community?.id;
    if (!instalId) return;

    if (isReminder) setSendingReminder(true);
    else setSendingSignatures(true);
    setSignatureLinks([]);
    try {
      const res = await fetch(`/api/communities/${instalId}/sign`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.links) {
        setSignatureLinks(data.links);
      } else {
        console.error("Error solicitando firmas:", data);
      }
    } finally {
      if (isReminder) setSendingReminder(false);
      else setSendingSignatures(false);
    }
  };

  const handleCopyLink = (link: string, nombre: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(nombre);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSimulateSign = (id: string) => {
    // Solo disponible en desarrollo — el webhook real lo hace en producción
    setSigners(prev => prev.map(s =>
      s.id === id ? { ...s, state: "signed" as const, signedAt: new Date().toISOString().slice(0, 10) } : s
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress hero */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-foreground">Firmas del acuerdo</h3>
              {realtimeConnected && (
                <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Wifi className="w-2.5 h-2.5" /> En vivo
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Acuerdo de reparto de energía — {community?.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRequestSignatures()}
              disabled={sendingSignatures || hasErrors}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              title={hasErrors ? "Corrige los errores de la comunidad antes de solicitar firmas" : undefined}
            >
              {sendingSignatures ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Solicitar firmas
            </button>
            <button
              onClick={() => handleRequestSignatures(true)}
              disabled={sendingReminder || sendingSignatures || pending === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
              title={pending === 0 ? "No hay firmas pendientes" : "Reenviar enlace de firma a pendientes"}
            >
              {sendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar recordatorio
            </button>
          </div>
        </div>

        {hasErrors && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-xs mb-4">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Corrige estos errores antes de solicitar firmas:</p>
              <ul className="mt-1 space-y-0.5">
                {validationErrors.map((e, i) => <li key={i}>• {e.message}</li>)}
              </ul>
            </div>
          </div>
        )}

        {stale > 0 && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs mb-4">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                {stale} firma{stale !== 1 ? "s" : ""} obsoleta{stale !== 1 ? "s" : ""}
              </p>
              <p className="text-amber-700 mt-0.5">
                Los coeficientes de reparto cambiaron desde que se firmaron. Solicita una nueva ronda de firmas.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-primary">{signed}</p>
            <p className="text-[10px] text-muted-foreground">Firmados</p>
          </div>
          <div className="bg-amber-100 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{pending}</p>
            <p className="text-[10px] text-muted-foreground">Pendientes</p>
          </div>
          <div className="bg-red-100 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{rejected}</p>
            <p className="text-[10px] text-muted-foreground">Rechazados</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso de firmas</span>
            <span className="font-semibold text-foreground">{signed} de {total}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Avatar row */}
        <div className="flex items-center gap-1 flex-wrap mt-4">
          {signers.map((s) => {
            const initials = s.name.split(" ").map(n => n[0]).join("").slice(0, 2);
            return (
              <div
                key={s.id}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  s.state === "signed"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : s.state === "rejected"
                    ? "bg-destructive/20 text-destructive"
                    : "bg-muted text-muted-foreground opacity-50"
                }`}
                title={`${s.name} (${s.unit})`}
              >
                {initials}
                {s.state === "signed" && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </div>
                )}
                {s.state === "rejected" && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card flex items-center justify-center">
                    <XCircle className="w-3 h-3 text-destructive" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Signature links panel */}
      {signatureLinks.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3 border border-primary/20 bg-primary/5 animate-fade-in">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Enlaces de firma generados
            </h3>
            <span className="text-xs text-muted-foreground">
              — compártelos por WhatsApp o email
            </span>
          </div>
          <div className="space-y-2">
            {signatureLinks.map((item) => (
              <div key={item.nombre} className="flex items-center gap-3 bg-background rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{item.nombre}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.link}</p>
                </div>
                {item.emailSent && (
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">Email enviado</span>
                )}
                <button
                  onClick={() => handleCopyLink(item.link, item.nombre)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                  {copiedId === item.nombre ? (
                    <><Check className="w-3 h-3" /> Copiado</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copiar</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de documentos firmados */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <button
          onClick={() => { setHistoryOpen(v => !v); if (!historyOpen && history.length === 0) fetchHistory(); }}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Historial de acuerdos firmados</span>
          </div>
          {historyOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {historyOpen && (
          <div className="px-6 pb-5 space-y-3 animate-fade-in">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No hay acuerdos firmados en el historial.
              </p>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-xl border p-4 space-y-3 transition-colors ${
                    entry.isActive
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {entry.isActive ? (
                          <span className="text-[10px] font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            Archivado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.creadoEn).toLocaleDateString("es-ES", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        v{entry.version}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                      >
                        {expandedEntry === entry.id ? "Ocultar" : "Ver detalle"}
                      </button>
                      {!entry.isActive && (
                        <button
                          onClick={() => handleRestore(entry.id)}
                          disabled={restoringId === entry.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {restoringId === entry.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Restaurar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Firmas summary */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {entry.firmas.length} firma{entry.firmas.length !== 1 ? "s" : ""}
                    </div>
                    <div className="flex -space-x-1.5">
                      {entry.firmas.slice(0, 5).map((f) => (
                        <div
                          key={f.id}
                          className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold ring-2 ring-card"
                          title={`${f.nombre} — ${f.firmadoEn ? new Date(f.firmadoEn).toLocaleDateString("es-ES") : ""}`}
                        >
                          {f.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                      ))}
                      {entry.firmas.length > 5 && (
                        <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-bold ring-2 ring-card">
                          +{entry.firmas.length - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail: coeficientes + firmas */}
                  {expandedEntry === entry.id && (
                    <div className="space-y-3 pt-2 border-t border-border animate-fade-in">
                      {/* Coeficientes */}
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Coeficientes</p>
                        <div className="space-y-1">
                          {entry.coeficientes.map((c) => (
                            <div key={c.cups} className="flex items-center justify-between text-xs">
                              <span className="text-foreground">{c.nombre}</span>
                              <span className="font-mono text-muted-foreground">{(c.valor * 100).toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Firmas detalladas */}
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Firmas</p>
                        <div className="space-y-1">
                          {entry.firmas.map((f) => (
                            <div key={f.id} className="flex items-center justify-between text-xs">
                              <span className="text-foreground">{f.nombre}</span>
                              <span className="text-muted-foreground">
                                {f.firmadoEn ? new Date(f.firmadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Signers list */}
      <div className="space-y-2">
        {signers.map((s, i) => {
          const initials = s.name.split(" ").map(n => n[0]).join("").slice(0, 2);
          return (
            <div
              key={s.id}
              className="glass-card rounded-xl px-4 py-3 flex items-center gap-4 hover-lift animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                  s.state === "signed" ? "bg-primary text-primary-foreground" :
                  s.state === "rejected" ? "bg-destructive/20 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{s.unit}{s.unit && s.email ? " · " : ""}{s.email}</span>
                  {!s.email && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      <MailX className="w-2.5 h-2.5" />
                      Sin email
                    </span>
                  )}
                </div>
              </div>
              {s.state === "signed" && isValidSignature(s) ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/15 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Firmado · {s.signedAt ? new Date(s.signedAt).toLocaleDateString("es-ES") : ""}
                </div>
              ) : s.state === "signed" && isStaleSignature(s) ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  Firma obsoleta — coeficientes cambiaron
                </div>
              ) : s.state === "rejected" ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">
                    <XCircle className="w-3 h-3" />
                    Rechazado
                  </span>
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Reenviar solicitud">
                    <Send className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    Pendiente
                  </span>
                  <button
                    onClick={() => handleSimulateSign(s.id)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    title="Simular firma (solo desarrollo)"
                  >
                    <PenLine className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </button>
                  <button
                    disabled={!s.email}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={s.email ? "Enviar recordatorio" : "Sin email — no se puede enviar recordatorio"}
                  >
                    <Send className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
