"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Download, CheckCircle2, AlertTriangle, Loader2, X, Code2, FileCheck, Clock, FileSignature } from "lucide-react";
import { type Community } from "@/lib/types/community";
import { generateAgreementHTML } from "@/lib/agreement-generator";

interface TxtGeneratorTabProProps {
  community: Community;
  communityId: string;
  conjuntoId?: string;
}

interface GenerateResult {
  contenido: string;
  nombreFichero: string;
  totalLineas: number;
}

interface HistorialEntry {
  id: string;
  nombreFichero: string;
  generadoEn: string;
  totalLineas: number;
  totalParticipantes: number;
  modo: string;
  verificacionSuma: boolean;
}

function downloadTXT(contenido: string, nombreFichero: string) {
  const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreFichero;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadHTML(html: string, nombreFichero: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreFichero;
  a.click();
  URL.revokeObjectURL(url);
}

export function TxtGeneratorTabPro({ community, communityId, conjuntoId }: TxtGeneratorTabProProps) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [historial, setHistorial] = useState<HistorialEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const activeParticipants = community.participants.filter(p => p.status !== "exited");
  const totalBeta = activeParticipants.reduce((s, p) => s + p.beta, 0);
  const isValid = Math.abs(totalBeta - 1) < 0.001 && !!conjuntoId;
  const noConjunto = !conjuntoId;

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/installations/${communityId}/historial`);
      if (res.ok) setHistorial(await res.json());
    } finally {
      setLoadingHistory(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleGenerate = async () => {
    if (!conjuntoId) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/installations/${communityId}/coefficients/${conjuntoId}/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Error al generar el fichero");
        return;
      }
      setResult(data);
      setShowPreview(true);
      loadHistory();
    } catch {
      setError("Error de conexión");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Status card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isValid ? "bg-primary/15" : "bg-destructive/15"
          }`}>
            {isValid ? (
              <FileCheck className="w-6 h-6 text-primary" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-destructive" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-foreground">
              {isValid
                ? "Fichero listo para generar"
                : noConjunto
                ? "Guarda los coeficientes primero"
                : "Coeficientes no válidos"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isValid
                ? `${activeParticipants.length} participantes · Distribuidora: ${community.distribuidora.toUpperCase()} · Coeficientes β = ${(totalBeta * 100).toFixed(2)}%`
                : noConjunto
                ? "Ve a la pestaña \"Coeficientes\", ajusta los valores y pulsa \"Guardar coeficientes\"."
                : `La suma de coeficientes β es ${(totalBeta * 100).toFixed(2)}% — debe ser exactamente 100%.`
              }
            </p>
            {isValid && (
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="text-[10px] font-mono bg-secondary px-2 py-1 rounded-md text-muted-foreground">
                  CAU: {community.cau}
                </div>
                <div className="text-[10px] font-mono bg-secondary px-2 py-1 rounded-md text-muted-foreground">
                  Modo: Fijo (β constante)
                </div>
                <div className="text-[10px] font-mono bg-secondary px-2 py-1 rounded-md text-muted-foreground">
                  Potencia: {community.potenciaInstalada} kWp
                </div>
              </div>
            )}
            {error && (
              <p className="mt-2 text-xs text-destructive">{error}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => downloadHTML(
                generateAgreementHTML(community),
                `acuerdo_${community.cau}_${new Date().toISOString().slice(0,10)}.html`
              )}
              disabled={activeParticipants.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSignature className="w-4 h-4" />
              Acuerdo de reparto
            </button>
            <button
              onClick={handleGenerate}
              disabled={!isValid || generating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl mint-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {generating ? "Generando..." : "Generar TXT"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {showPreview && result && (
        <div className="glass-card rounded-2xl overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-heading font-semibold text-foreground">Vista previa</span>
              <span className="text-[10px] font-mono text-muted-foreground">{result.nombreFichero}</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {result.totalLineas} líneas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadTXT(result.contenido, result.nombreFichero)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar .txt
              </button>
              <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="p-5 bg-background/50 overflow-auto max-h-96">
            <pre className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre">
              {result.contenido}
            </pre>
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-2">
        <h3 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Historial de ficheros generados
        </h3>
        {loadingHistory && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Cargando historial...
          </div>
        )}
        {!loadingHistory && historial.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">Aún no se han generado ficheros.</p>
        )}
        {historial.map((item) => (
          <div key={item.id} className="glass-card rounded-xl px-4 py-3 flex items-center gap-4 hover-lift">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground font-mono truncate">{item.nombreFichero}</p>
              <p className="text-[10px] text-muted-foreground">
                {item.totalParticipantes} participantes · {item.totalLineas} líneas · {item.modo === "CONSTANTE" ? "β fijo" : "β variable"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-shrink-0">
              <Clock className="w-3 h-3" />
              {new Date(item.generadoEn).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
            {item.verificacionSuma && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary flex-shrink-0">
                Válido
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
