"use client";

import { useState, useMemo, useCallback } from "react";
import { Sparkles, RotateCcw, Check, ChevronDown, Info, Calculator, Save, Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Participant, type SuggestionMethod, SUGGESTION_METHODS, type CoeficientMode } from "@/lib/types/community";

interface BetaCoefficientsProps {
  participants: Participant[];
  mode: CoeficientMode;
  onModeChange: (mode: CoeficientMode) => void;
  onParticipantsChange: (participants: Participant[]) => void;
  communityId: string;
  conjuntoId?: string;
  onSaved?: (conjuntoId: string) => void;
}

const COLORS = [
  "hsl(160, 84%, 45%)", "hsl(43, 96%, 61%)", "hsl(200, 80%, 70%)",
  "hsl(280, 60%, 65%)", "hsl(340, 70%, 60%)", "hsl(20, 90%, 60%)",
  "hsl(100, 50%, 50%)", "hsl(220, 70%, 60%)", "hsl(50, 80%, 55%)",
  "hsl(170, 60%, 50%)", "hsl(0, 70%, 60%)", "hsl(130, 50%, 55%)",
];

export function BetaCoefficients({ participants, mode, onModeChange, onParticipantsChange, communityId, conjuntoId, onSaved }: BetaCoefficientsProps) {
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<SuggestionMethod>("equal");
  const [showVariableMsg, setShowVariableMsg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [showInvalidateDialog, setShowInvalidateDialog] = useState(false);

  const activeParticipants = useMemo(() => participants.filter(p => p.status !== "exited"), [participants]);

  // Firmas vinculadas al conjunto actual — se invalidarán si se guardan nuevos coeficientes
  const firmasVinculadas = useMemo(() =>
    activeParticipants.filter(p =>
      p.signatureState === "signed" && p.conjuntoFirmadoId === conjuntoId
    ),
    [activeParticipants, conjuntoId]
  );
  const hayFirmasVinculadas = firmasVinculadas.length > 0;
  const totalBeta = useMemo(() => activeParticipants.reduce((s, p) => s + p.beta, 0), [activeParticipants]);
  const totalPercent = +(totalBeta * 100).toFixed(2);
  const isComplete = Math.abs(totalPercent - 100) < 0.01;
  const isOver = totalPercent > 100.01;

  const updateBeta = useCallback((id: string, percent: number) => {
    const value = Math.max(0, Math.min(100, percent));
    onParticipantsChange(
      participants.map(p => p.id === id ? { ...p, beta: value / 100 } : p)
    );
  }, [participants, onParticipantsChange]);

  const applySuggestion = (method: SuggestionMethod) => {
    const active = participants.filter(p => p.status !== "exited");
    let betas: number[] = [];

    switch (method) {
      case "equal": {
        // Integer arithmetic to guarantee sum = exactly 1.000000
        const n = active.length;
        const base = Math.floor(1_000_000 / n);
        const remainder = 1_000_000 - base * n;
        betas = active.map((_, i) =>
          (i < n - remainder ? base : base + 1) / 1_000_000
        );
        break;
      }
    }

    const updated = participants.map(p => {
      const idx = active.findIndex(a => a.id === p.id);
      if (idx === -1) return p;
      return { ...p, beta: betas[idx] };
    });
    onParticipantsChange(updated);
    setShowSuggestionPanel(false);
  };

  const resetBetas = () => {
    const n = participants.length;
    const base = Math.floor(1_000_000 / n);
    const remainder = 1_000_000 - base * n;
    onParticipantsChange(participants.map((p, i) => ({
      ...p,
      beta: (i < n - remainder ? base : base + 1) / 1_000_000,
    })));
  };

  const doSave = useCallback(async (forceNewConjunto = false) => {
    if (!isComplete) return;
    setSaving(true);
    setSavedOk(false);
    try {
      const entradas = activeParticipants.map(p => ({
        participanteId: p.id,
        valor: p.beta.toFixed(6),
      }));

      // Si hay firmas vinculadas → forzar POST (nuevo conjunto) para que
      // conjuntoFirmadoId de los participantes ya no coincida con el activo
      const usePost = !conjuntoId || forceNewConjunto;

      let res: Response;
      if (usePost) {
        res = await fetch(`/api/installations/${communityId}/coefficients`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modo: "CONSTANTE", entradas }),
        });
      } else {
        res = await fetch(`/api/installations/${communityId}/coefficients/${conjuntoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modo: "CONSTANTE", entradas }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        setSavedOk(true);
        onSaved?.(data.id ?? conjuntoId ?? "");
        setTimeout(() => setSavedOk(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }, [activeParticipants, communityId, conjuntoId, isComplete, onSaved]);

  const handleSave = useCallback(() => {
    if (hayFirmasVinculadas) {
      setShowInvalidateDialog(true);
    } else {
      doSave(false);
    }
  }, [hayFirmasVinculadas, doSave]);

  const handleConfirmInvalidate = useCallback(() => {
    setShowInvalidateDialog(false);
    doSave(true); // fuerza nuevo conjunto → firmas quedan huérfanas
  }, [doSave]);

  // Donut chart
  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Banner de advertencia — firmas vinculadas al conjunto actual */}
      {hayFirmasVinculadas && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">
              Acuerdo firmado por {firmasVinculadas.length} participante{firmasVinculadas.length !== 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-amber-700">
              {firmasVinculadas.map(p => p.name).join(", ")} firmaron estos coeficientes.
              Si guardas valores nuevos, las firmas dejarán de ser válidas y tendrás que solicitar una nueva ronda.
            </p>
          </div>
        </div>
      )}

      {/* Mode selector + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-xl bg-secondary p-1 text-xs font-medium">
          <button
            onClick={() => onModeChange("fixed")}
            className={`px-3 py-1.5 rounded-lg transition-all ${mode === "fixed" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            β Fijos
          </button>
          <button
            onClick={() => setShowVariableMsg(v => !v)}
            className="px-3 py-1.5 rounded-lg transition-all text-muted-foreground hover:text-foreground"
          >
            β Variables (h)
          </button>
        </div>

        {showVariableMsg && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-xs text-accent-foreground">
            <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span>Próximamente: beta basado en datos de consumo de cada vecino para maximizar ahorro global.</span>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={() => applySuggestion("equal")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <Calculator className="w-4 h-4" />
          Partes iguales
        </button>

        <button
          onClick={resetBetas}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleSave}
          disabled={!isComplete || saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedOk ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Guardando..." : savedOk ? "Guardado" : "Guardar coeficientes"}
        </button>
      </div>

      {/* Validation bar */}
      <div className="glass-card rounded-xl px-4 py-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Suma de coeficientes β</span>
            {!isComplete && (
              <div className="flex items-center gap-1 text-xs text-accent">
                <Info className="w-3 h-3" />
                La suma debe ser exactamente 100%
              </div>
            )}
          </div>
          <span className={`font-mono font-bold text-base ${
            isComplete ? "text-primary" : isOver ? "text-destructive" : "text-accent"
          }`}>
            {totalPercent.toFixed(2)}%
          </span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isComplete ? "bg-primary" : isOver ? "bg-destructive" : "bg-accent/70"
            }`}
            style={{ width: `${Math.min(totalPercent, 100)}%` }}
          />
        </div>
        {isComplete && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium">
            <Check className="w-3.5 h-3.5" />
            Coeficientes válidos — listo para generar fichero TXT
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Donut */}
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(220, 9%, 91%)" strokeWidth={strokeWidth} />
            {activeParticipants.map((p, i) => {
              const pct = p.beta * 100;
              const segmentLength = (pct / 100) * circumference;
              const offset = circumference - (cumulative / 100) * circumference;
              cumulative += pct;
              return (
                <circle
                  key={p.id}
                  cx={size/2} cy={size/2} r={radius}
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                  strokeDashoffset={offset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-heading font-bold ${isComplete ? "text-primary" : isOver ? "text-destructive" : "text-foreground"}`}>
              {totalPercent.toFixed(1)}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              {isComplete ? "Válido" : isOver ? "Excedido" : "Incompleto"}
            </span>
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 w-full">
            {activeParticipants.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1.5 text-[11px]">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{p.unit}</span>
                <span className="font-mono font-medium text-foreground ml-auto">{(p.beta * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table editor */}
        <div className="lg:col-span-2 space-y-2">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3">Participante</div>
            <div className="col-span-4">CUPS</div>
            <div className="col-span-2 text-right">β (%)</div>
            <div className="col-span-3">Reparto</div>
          </div>

          {activeParticipants.map((p, i) => {
            const pct = +(p.beta * 100).toFixed(2);
            return (
              <div
                key={p.id}
                className="glass-card rounded-xl px-4 py-2.5 grid grid-cols-12 gap-2 items-center hover-lift animate-fade-in group"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  >
                    {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.unit}</p>
                  </div>
                </div>

                <div className="col-span-4">
                  <span className="text-[10px] font-mono text-muted-foreground tracking-tight">{p.cups}</span>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={pct}
                    onChange={(e) => updateBeta(p.id, parseFloat(e.target.value) || 0)}
                    className="w-16 text-right text-xs font-mono font-semibold bg-secondary/50 border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>

                <div className="col-span-3 relative h-5 flex items-center">
                  <div className="absolute inset-x-0 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={pct}
                    onChange={(e) => updateBeta(p.id, parseFloat(e.target.value))}
                    className="absolute inset-x-0 w-full h-5 opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute w-4 h-4 rounded-full border-2 border-card shadow-sm transition-all duration-200 pointer-events-none"
                    style={{ left: `calc(${pct}% - 8px)`, background: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diálogo de confirmación — invalidar firmas */}
      <AlertDialog open={showInvalidateDialog} onOpenChange={(open) => !open && setShowInvalidateDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Esto invalidará las firmas
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{firmasVinculadas.length} participante{firmasVinculadas.length !== 1 ? "s" : ""}</strong>{" "}
                  {firmasVinculadas.length !== 1 ? "han" : "ha"} firmado el acuerdo de reparto actual.
                </p>
                <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                  <li>Las firmas dejarán de ser válidas para los nuevos coeficientes.</li>
                  <li>Tendrás que solicitar una nueva ronda de firmas.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmInvalidate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Entiendo, guardar igualmente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
