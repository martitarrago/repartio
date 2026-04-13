"use client";

import { useState } from "react";
import { Send, CheckCircle2, Clock, PenLine, XCircle, Mail } from "lucide-react";
import { type Community } from "@/lib/types/community";

interface SignaturesTabProps {
  community?: Community;
}

export function SignaturesTab({ community }: SignaturesTabProps) {
  const participants = community?.participants.filter(p => p.status !== "exited") || [];

  const [signers, setSigners] = useState(
    participants.map(p => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      email: p.email,
      cups: p.cups,
      state: p.signatureState,
      signedAt: p.signatureState === "signed" ? "2026-03-10" : undefined,
    }))
  );

  const signed = signers.filter(s => s.state === "signed").length;
  const pending = signers.filter(s => s.state === "pending").length;
  const rejected = signers.filter(s => s.state === "rejected").length;
  const total = signers.length;
  const progress = total > 0 ? (signed / total) * 100 : 0;

  const handleSimulateSign = (id: string) => {
    setSigners(prev => prev.map(s =>
      s.id === id ? { ...s, state: "signed" as const, signedAt: new Date().toISOString().slice(0, 10) } : s
    ));
  };

  const handleSendReminder = () => {
    // Mock — no-op in frontend-only mode
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress hero */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-semibold text-foreground">Firmas del acuerdo</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Acuerdo de reparto de energía — {community?.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Solicitar firmas
            </button>
            <button
              onClick={handleSendReminder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <Send className="w-4 h-4" />
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
          <div className="bg-amber-100 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-amber-700">{pending}</p>
            <p className="text-[10px] text-muted-foreground">Pendientes</p>
          </div>
          <div className="bg-red-100 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-600">{rejected}</p>
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
            const initials = s.name.split(" ").map(n => n[0]).join("");
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
          const initials = s.name.split(" ").map(n => n[0]).join("");
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
                <p className="text-xs text-muted-foreground">{s.unit} · {s.email}</p>
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
                    title="Simular firma"
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
