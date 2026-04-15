"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText, Download, Eye, Clock, CheckCircle2, Loader2, Lock,
  Upload, Trash2, X, AlertCircle, Code2, FileCheck, FileSignature,
  AlertTriangle, FolderOpen,
} from "lucide-react";
import { type Community } from "@/lib/types/community";
import { generateAgreementHTML, downloadAgreementHTML } from "@/lib/agreement-generator";

interface DocumentosTabProps {
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

function downloadTXT(contenido: string, nombreFichero: string) {
  const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombreFichero; a.click();
  URL.revokeObjectURL(url);
}

export function DocumentosTab({ community, communityId, conjuntoId }: DocumentosTabProps) {
  // ── TXT state ────────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [txtResult, setTxtResult] = useState<GenerateResult | null>(null);
  const [showTxtPreview, setShowTxtPreview] = useState(false);
  const [txtError, setTxtError] = useState("");
  const [historial, setHistorial] = useState<HistorialEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Acuerdo state ────────────────────────────────────────────────────
  const [showAcuerdoPreview, setShowAcuerdoPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // ── Docs state ───────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("OTRO");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Derived ──────────────────────────────────────────────────────────
  const activeParticipants = community.participants.filter(p => p.status !== "exited");
  const totalBeta = activeParticipants.reduce((s, p) => s + p.beta, 0);
  const txtValid = Math.abs(totalBeta - 1) < 0.001 && !!conjuntoId;
  const allSigned = activeParticipants.length > 0 && activeParticipants.every(p => p.signatureState === "signed");
  const pendingSigs = activeParticipants.filter(p => p.signatureState === "pending").length;

  // ── Load data ────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/installations/${communityId}/historial`);
      if (res.ok) setHistorial(await res.json());
    } finally { setLoadingHistory(false); }
  }, [communityId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    fetch(`/api/communities/${communityId}/documents`)
      .then(r => r.json())
      .then(data => { setDocuments(Array.isArray(data) ? data : []); setLoadingDocs(false); })
      .catch(() => setLoadingDocs(false));
  }, [communityId]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleGenerateTxt = async () => {
    if (!conjuntoId) return;
    setGenerating(true); setTxtError("");
    try {
      const res = await fetch(`/api/installations/${communityId}/coefficients/${conjuntoId}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setTxtError(data.message ?? "Error al generar el fichero"); return; }
      setTxtResult(data); setShowTxtPreview(true);
      loadHistory();
    } catch { setTxtError("Error de conexión"); }
    finally { setGenerating(false); }
  };

  const handlePreviewAcuerdo = () => {
    setPreviewHtml(generateAgreementHTML(community));
    setShowAcuerdoPreview(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadError(""); setUploadProgress(10);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipo", selectedTipo);
      const interval = setInterval(() => setUploadProgress(p => Math.min(p + 15, 85)), 200);
      const res = await fetch(`/api/communities/${communityId}/documents`, { method: "POST", body: formData });
      clearInterval(interval); setUploadProgress(100);
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Error al subir"); }
      const docsRes = await fetch(`/api/communities/${communityId}/documents`);
      const docs = await docsRes.json();
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (e: any) { setUploadError(e.message ?? "Error al subir el archivo"); }
    finally { setUploading(false); setTimeout(() => setUploadProgress(0), 500); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      await fetch(`/api/communities/${communityId}/documents?docId=${docId}`, { method: "DELETE" });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ══ ZONA 1: Generación de documentos ══════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-heading font-semibold text-sm text-foreground">Generación de documentos</h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* 1 — Acuerdo de reparto */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
              <FileSignature className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Acuerdo de reparto</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Documento informativo con participantes, coeficientes β y datos de la comunidad. Solo para consulta del gestor — no tiene validez oficial sin firmas.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handlePreviewAcuerdo}
                disabled={activeParticipants.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver
              </button>
              <button
                onClick={() => downloadAgreementHTML(community)}
                disabled={activeParticipants.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar
              </button>
            </div>
          </div>

          {showAcuerdoPreview && previewHtml && (
            <div className="mt-4 rounded-xl overflow-hidden border border-border animate-scale-in">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <span className="text-xs font-medium text-foreground">Vista previa</span>
                <button onClick={() => setShowAcuerdoPreview(false)} className="p-1 rounded hover:bg-secondary">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <div className="bg-white">
                <iframe srcDoc={previewHtml} className="w-full h-[420px] border-0" title="Acuerdo preview" />
              </div>
            </div>
          )}
        </div>

        {/* 2 — Coeficiente de reparto oficial */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              allSigned ? "bg-primary/15" : "bg-muted"
            }`}>
              {allSigned
                ? <FileCheck className="w-5 h-5 text-primary" />
                : <Lock className="w-5 h-5 text-muted-foreground" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Coeficiente de reparto oficial</p>
                {allSigned
                  ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Listo</span>
                  : <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" />Bloqueado</span>
                }
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {allSigned
                  ? "Todos los participantes han firmado. El acuerdo de reparto es oficial y puede descargarse."
                  : pendingSigs > 0
                  ? `Faltan ${pendingSigs} firma${pendingSigs !== 1 ? "s" : ""} para desbloquear este documento.`
                  : "Disponible cuando todos los participantes hayan firmado el acuerdo de reparto."
                }
              </p>
            </div>
            <button
              onClick={() => downloadAgreementHTML(community)}
              disabled={!allSigned}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar
            </button>
          </div>
        </div>

        {/* 3 — Fichero TXT */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              txtValid ? "bg-primary/15" : "bg-muted"
            }`}>
              {txtValid
                ? <FileCheck className="w-5 h-5 text-primary" />
                : <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Fichero TXT para distribuidora</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Archivo de coeficientes β requerido por la distribuidora según el <span className="font-medium">Real Decreto 244/2019 (Anexo I)</span>.
                Formato: separadores <code className="text-[10px] bg-muted px-1 rounded">;</code>, decimales con coma, codificación UTF-8 sin BOM.
              </p>
              {!txtValid && (
                <p className="text-xs text-muted-foreground mt-1">
                  {!conjuntoId
                    ? "Guarda los coeficientes en la pestaña Coeficientes primero."
                    : `Suma actual: ${(totalBeta * 100).toFixed(2)}% — debe ser exactamente 100%.`
                  }
                </p>
              )}
              {txtError && <p className="text-xs text-destructive mt-1">{txtError}</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {txtResult && (
                <button
                  onClick={() => setShowTxtPreview(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  {showTxtPreview ? "Ocultar" : "Ver"}
                </button>
              )}
              <button
                onClick={handleGenerateTxt}
                disabled={!txtValid || generating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {generating ? "Generando..." : "Generar y descargar"}
              </button>
            </div>
          </div>

          {showTxtPreview && txtResult && (
            <div className="rounded-xl overflow-hidden border border-border animate-scale-in">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground">{txtResult.nombreFichero}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">{txtResult.totalLineas} líneas</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadTXT(txtResult.contenido, txtResult.nombreFichero)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Descargar .txt
                  </button>
                  <button onClick={() => setShowTxtPreview(false)} className="p-1 rounded hover:bg-secondary">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-background/50 overflow-auto max-h-72">
                <pre className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre">{txtResult.contenido}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ ZONA 2: Archivo ════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-heading font-semibold text-sm text-foreground">Archivo</h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Historial TXT */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historial de ficheros TXT generados</h3>
          {loadingHistory && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Cargando...
            </div>
          )}
          {!loadingHistory && historial.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">Aún no se han generado ficheros TXT.</p>
          )}
          <div className="space-y-1.5">
            {historial.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
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
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary flex-shrink-0">Válido</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Documentación comunidad */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documentación de la comunidad</h3>
            <p className="text-xs text-muted-foreground mt-1">Guarda aquí facturas, certificados, documentos antiguos y cualquier archivo relacionado con esta comunidad.</p>
          </div>

          {/* Upload */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              {TIPOS_UPLOAD.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Subiendo..." : "Subir archivo"}
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx,.jpg,.png" className="hidden" onChange={handleFileSelect} />
          </div>

          {uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {uploadError}
              <button onClick={() => setUploadError("")} className="ml-auto"><X className="w-3 h-3" /></button>
            </div>
          )}

          {/* Doc list */}
          {loadingDocs ? (
            <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-muted/40 animate-pulse" />)}</div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No hay documentos subidos aún</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {documents.map((doc, i) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors group animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{doc.nombre}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {TIPO_LABELS[doc.tipo] ?? doc.tipo} · {formatBytes(doc.tamano)} · {new Date(doc.creadoEn).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-secondary" title="Descargar">
                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deletingId === doc.id
                        ? <Loader2 className="w-3.5 h-3.5 text-destructive animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
