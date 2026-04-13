"use client";

import { useState } from "react";
import { FileText, Download, Eye, Clock, CheckCircle2, Loader2, Sparkles, Printer } from "lucide-react";
import { type Community } from "@/lib/types/community";
import { generateAgreementHTML, downloadAgreementHTML, printAgreement } from "@/lib/agreement-generator";

interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
  status: "generated" | "sent" | "pending";
}

const statusConfig = {
  generated: { label: "Generado", icon: CheckCircle2, className: "text-primary bg-primary/15" },
  sent: { label: "Enviado", icon: CheckCircle2, className: "text-accent bg-accent/15" },
  pending: { label: "Pendiente", icon: Clock, className: "text-accent bg-accent/15" },
};

interface DocumentsTabProProps {
  community?: Community;
}

export function DocumentsTabPro({ community }: DocumentsTabProProps) {
  const [generating, setGenerating] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([
    { id: "1", name: "Acuerdo de reparto Q1 2026", type: "HTML", date: "2026-03-15", status: "sent" },
    { id: "2", name: "Certificado de coeficientes", type: "PDF", date: "2026-02-20", status: "generated" },
  ]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const handleGenerateAgreement = () => {
    if (!community) return;
    setGenerating(true);
    setTimeout(() => {
      const newDoc: Document = {
        id: Date.now().toString(),
        name: `Acuerdo de reparto — ${new Date().toLocaleDateString("es-ES")}`,
        type: "HTML",
        date: new Date().toISOString().slice(0, 10),
        status: "generated",
      };
      setDocuments(prev => [newDoc, ...prev]);
      setGenerating(false);
      downloadAgreementHTML(community);
    }, 1500);
  };

  const handlePreview = () => {
    if (!community) return;
    setPreviewHtml(generateAgreementHTML(community));
  };

  const handlePrint = () => {
    if (!community) return;
    printAgreement(community);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Generate Acuerdo */}
      <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl mint-gradient flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          {generating ? (
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          ) : (
            <FileText className="w-7 h-7 text-white" />
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-heading font-semibold text-foreground">
            {generating ? "Generando acuerdo..." : "Acuerdo de Reparto"}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {generating
              ? "Preparando el documento con participantes y coeficientes β"
              : "Genera el acuerdo oficial imprimible con tabla de participantes, coeficientes y datos de la comunidad"
            }
          </p>
        </div>
        {!generating && community && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Vista previa
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={handleGenerateAgreement}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl mint-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              Descargar
            </button>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewHtml && (
        <div className="glass-card rounded-2xl overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
            <span className="text-sm font-heading font-semibold text-foreground">Vista previa del Acuerdo</span>
            <button onClick={() => setPreviewHtml(null)} className="text-xs text-muted-foreground hover:text-foreground">
              Cerrar
            </button>
          </div>
          <div className="p-4 bg-white max-h-[500px] overflow-auto">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[460px] border-0"
              title="Acuerdo preview"
            />
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="space-y-2">
        <h3 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Historial de documentos
        </h3>
        {documents.map((doc, i) => {
          const status = statusConfig[doc.status];
          const StatusIcon = status.icon;
          return (
            <div
              key={doc.id}
              className="glass-card rounded-xl px-4 py-3 flex items-center gap-4 hover-lift group animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.type} · {new Date(doc.date).toLocaleDateString("es-ES")}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.className}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 rounded-lg hover:bg-secondary">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-secondary">
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
