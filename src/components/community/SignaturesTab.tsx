"use client";

import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle2, Clock, PenLine, XCircle, Mail, Loader2, Wifi } from "lucide-react";
import { type Community } from "@/lib/types/community";
import { supabase } from "@/lib/supabase";

interface SignaturesTabProps {
  community?: Community;
  communityId?: string;
}

interface Signer {
  id: string;
  name: string;
  unit: string;
  email: string;
  cups: string;
  state: "signed" | "pending" | "rejected";
  signedAt?: string;
}

function stateFromDb(estado: string): "signed" | "pending" | "rejected" {
  if (estado === "FIRMADO") return "signed";
  if (estado === "RECHAZADO") return "rejected";
  return "pending";
}

export function SignaturesTab({ community, communityId }: SignaturesTabProps) {
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
    }))
  );

  const [sendingSignatures, setSendingSignatures] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  const signed = signers.filter(s => s.state === "signed").length;
  const pending = signers.filter(s => s.state === "pending").length;
  const rejected = signers.filter(s => s.state === "rejected").length;
  const total = signers.length;
  const progress = total > 0 ? (signed / total) * 100 : 0;

  const handleRequestSignatures = async () => {
    const instalId = communityId ?? community?.id;
    if (!instalId) return;

    setSendingSignatures(true);
    try {
      const res = await fetch(`/api/communities/${instalId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentUrl: null }), // documentUrl se pasará cuando haya Storage
      });
      const data = await res.json();
      if (!res.ok && res.status !== 503) {
        console.error("Error solicitando firmas:", data);
      }
    } finally {
      setSendingSignatures(false);
    }
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
              onClick={handleRequestSignatures}
              disabled={sendingSignatures}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {sendingSignatures ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Solicitar firmas
            </button>
            <button
              onClick={() => setSendingReminder(true)}
              disabled={sendingReminder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              {sendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar recordatorio
            </button>
          </div>
        </div>

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
              className="h-full rounded-full mint-gradient transition-all duration-700 ease-out"
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
                <p className="text-xs text-muted-foreground">{s.unit} · {s.email || "Sin email"}</p>
              </div>
              {s.state === "signed" ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/15 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Firmado · {s.signedAt ? new Date(s.signedAt).toLocaleDateString("es-ES") : ""}
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
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Enviar recordatorio">
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
