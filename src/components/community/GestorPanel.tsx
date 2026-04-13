"use client";

import { Shield, ShieldCheck, AlertTriangle } from "lucide-react";

interface GestorPanelProps {
  enabled: boolean;
  gestorName?: string;
  gestorNif?: string;
  onToggle: (enabled: boolean) => void;
  onUpdate: (name: string, nif: string) => void;
}

export function GestorPanel({ enabled, gestorName, gestorNif, onToggle, onUpdate }: GestorPanelProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          enabled ? "bg-primary/10" : "bg-muted"
        }`}>
          {enabled ? <ShieldCheck className="w-5 h-5 text-primary" /> : <Shield className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-sm text-foreground">Gestor de Autoconsumo</h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full badge-info">
              RDL 7/2026
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Activa la figura del Gestor para representar al grupo y modificar coeficientes sin recabar firma de todos los participantes.
          </p>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            enabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`} />
        </button>
      </div>

      {enabled && (
        <div className="pt-3 border-t border-border space-y-3 animate-fade-in">
          <div className="flex items-start gap-2 p-3 rounded-lg badge-warning">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-[11px]">
              Al activar el modo Gestor, esta persona/empresa podrá modificar coeficientes β y generar ficheros TXT en nombre del grupo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">
                Nombre / Razón social
              </label>
              <input
                type="text"
                placeholder="Ej. SolarGest S.L."
                value={gestorName || ""}
                onChange={(e) => onUpdate(e.target.value, gestorNif || "")}
                className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">
                NIF / CIF
              </label>
              <input
                type="text"
                placeholder="Ej. B12345678"
                value={gestorNif || ""}
                onChange={(e) => onUpdate(gestorName || "", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-primary font-medium">
            <ShieldCheck className="w-4 h-4" />
            El Gestor puede firmar en nombre del grupo según el RDL 7/2026
          </div>
        </div>
      )}
    </div>
  );
}
