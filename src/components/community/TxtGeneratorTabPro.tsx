"use client";

import { useState } from "react";
import { FileText, Download, CheckCircle2, AlertTriangle, Loader2, X, Code2, FileCheck } from "lucide-react";
import { type Community } from "@/lib/types/community";
import { generateDistributorTXT, downloadTXT } from "@/lib/mock-txt-generator";

interface TxtGeneratorTabProProps {
  community: Community;
}

export function TxtGeneratorTabPro({ community }: TxtGeneratorTabProProps) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof generateDistributorTXT> | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const r = generateDistributorTXT(community);
      setResult(r);
      setGenerating(false);
      setShowPreview(true);
    }, 1200);
  };

  const handleDownload = () => {
    if (!result) return;
    const filename = `reparto_${community.cau.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.txt`;
    downloadTXT(result.content, filename);
  };

  const totalBeta = community.participants
    .filter(p => p.status !== "exited")
    .reduce((s, p) => s + p.beta, 0);
  const isValid = Math.abs(totalBeta - 1) < 0.001;

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
              {isValid ? "Fichero listo para generar" : "Coeficientes no válidos"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isValid
                ? `${community.participants.filter(p => p.status !== "exited").length} participantes · Distribuidora: ${community.distribuidora.toUpperCase()} · Coeficientes β = ${(totalBeta * 100).toFixed(2)}%`
                : `La suma de coeficientes β es ${(totalBeta * 100).toFixed(2)}% — ajusta en la pestaña "Coeficientes β" antes de generar.`
              }
            </p>
            {isValid && (
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="text-[10px] font-mono bg-secondary px-2 py-1 rounded-md text-muted-foreground">
                  CAU: {community.cau}
                </div>
                <div className="text-[10px] font-mono bg-secondary px-2 py-1 rounded-md text-muted-foreground">
                  Modo: {community.coeficientMode === "fixed" ? "Fijo" : "Variable por hora"}
                </div>
                <div className="text-[10px] font-mono bg-secondary px-2 py-1 rounded-md text-muted-foreground">
                  Potencia: {community.potenciaInstalada} kWp
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!isValid || generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl mint-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
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

      {/* Preview */}
      {showPreview && result && (
        <div className="glass-card rounded-2xl overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-heading font-semibold text-foreground">Vista previa del fichero</span>
              {result.isValid ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Válido
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/15 text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {result.errors.length} error(es)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
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

          {result.errors.length > 0 && (
            <div className="px-5 py-3 bg-destructive/5 border-b border-destructive/10">
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  {err}
                </div>
              ))}
            </div>
          )}

          <div className="p-5 bg-background/50 overflow-auto max-h-96">
            <pre className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre">
              {result.content}
            </pre>
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-2">
        <h3 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Historial de ficheros generados
        </h3>
        {[
          { date: "2026-03-15", distribuidora: "i-DE", status: "enviado" },
          { date: "2026-02-01", distribuidora: "i-DE", status: "generado" },
        ].map((item, i) => (
          <div key={i} className="glass-card rounded-xl px-4 py-3 flex items-center gap-4 hover-lift">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Fichero reparto — {item.date}</p>
              <p className="text-[10px] text-muted-foreground">{item.distribuidora} · TXT</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              item.status === "enviado" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
            }`}>
              {item.status === "enviado" ? "Enviado" : "Generado"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
