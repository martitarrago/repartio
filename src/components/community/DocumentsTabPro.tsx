"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText, Download, Eye, Clock, CheckCircle2, Loader2, Sparkles, Printer,
  Upload, Trash2, X, AlertCircle,
} from "lucide-react";
import { type Community } from "@/lib/types/community";
import { generateAgreementHTML, downloadAgreementHTML, printAgreement } from "@/lib/agreement-generator";

interface ApiDocument {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  mimeType: string;
  url: string | null;
  creadoEn: string;
  autor: string;
}

const TIPO_LABELS: Record<string, string> = {
  ACUERDO_REPARTO: "Acuerdo de reparto",
  TXT_DISTRIBUIDOR: "Fichero TXT distribuidora",
  CIE: "CIE",
  AUTORIZACION_GESTOR: "Autorización gestor",
  CERTIFICADO_CAU: "Certificado CAU",
  OTRO: "Otro",
};

const TIPOS_UPLOAD = Object.entries(TIPO_LABELS).map(([id, label]) => ({ id, label }));

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentsTabProProps {
  community?: Community;
  communityId?: string;
}

export function DocumentsTabPro({ community, communityId }: DocumentsTabProProps) {
  const [generating, setGenerating] = useState(false);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("OTRO");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const instalId = communityId ?? community?.id;

  // Load documents from API
  useEffect(() => {
    if (!instalId) return;
    fetch(`/api/communities/${instalId}/documents`)
      .then(r => r.json())
      .then(data => { setDocuments(Array.isArray(data) ? data : []); setLoadingDocs(false); })
      .catch(() => setLoadingDocs(false));
  }, [instalId]);

  const handleGenerateAgreement = () => {
    if (!community) return;
    setGenerating(true);
    setTimeout(() => {
      downloadAgreementHTML(community);
      setGenerating(false);
    }, 1200);
  };

  const handlePreview = () => {
    if (!community) return;
    setPreviewHtml(generateAgreementHTML(community));
  };

  const handlePrint = () => {
    if (!community) return;
    printAgreement(community);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !instalId) return;

    setUploading(true);
    setUploadError("");
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipo", selectedTipo);

      // Simulate progress (XHR would give real progress, but fetch doesn't)
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 15, 85));
      }, 200);

      const res = await fetch(`/api/communities/${instalId}/documents`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al subir");
      }

      // Reload documents list
      const docsRes = await fetch(`/api/communities/${instalId}/documents`);
      const docs = await docsRes.json();
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (e: any) {
      setUploadError(e.message ?? "Error al subir el archivo");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
    if (!instalId) return;
    setDeletingId(docId);
    try {
      await fetch(`/api/communities/${instalId}/documents?docId=${docId}`, { method: "DELETE" });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } finally {
      setDeletingId(null);
    }
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
            <iframe srcDoc={previewHtml} className="w-full h-[460px] border-0" title="Acuerdo preview" />
          </div>
        </div>
      )}

      {/* Upload section */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="font-heading font-semibold text-sm">Subir documento</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedTipo}
            onChange={e => setSelectedTipo(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          >
            {TIPOS_UPLOAD.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Subiendo..." : "Seleccionar archivo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Progress bar */}
        {uploadProgress > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full mint-gradient transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-right">{uploadProgress}%</p>
          </div>
        )}

        {/* Error */}
        {uploadError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {uploadError}
            <button onClick={() => setUploadError("")} className="ml-auto">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Document list */}
      <div className="space-y-2">
        <h3 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Documentos guardados ({documents.length})
        </h3>

        {loadingDocs ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No hay documentos subidos aún
          </div>
        ) : (
          documents.map((doc, i) => (
            <div
              key={doc.id}
              className="glass-card rounded-xl px-4 py-3 flex items-center gap-4 hover-lift group animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {TIPO_LABELS[doc.tipo] ?? doc.tipo} · {formatBytes(doc.tamano)} · {new Date(doc.creadoEn).toLocaleDateString("es-ES")} · {doc.autor}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="w-3 h-3" />
                Guardado
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-secondary"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="w-4 h-4 text-destructive animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-destructive" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
