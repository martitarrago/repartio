"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, Check, Loader2, Download, ChevronRight, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { validateCUPS, type Participant } from "@/lib/types/community";
import * as XLSX from "xlsx";

interface ImportParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  existingCups: string[];
  onImported: (participants: Participant[]) => void;
}

interface ParsedRow {
  nombre: string;
  cups: string;
  email: string;
  unidad: string;
  beta: number | null;
  errors: string[];
  warnings: string[];
  willUpdate: boolean;
}

const COL_MATCHERS: Record<string, RegExp> = {
  nombre: /^(nombre|name|participante|titular|propietario)/i,
  cups:   /^(cups|c[oó]digo.?suministro|punto.?suministro)/i,
  email:  /^(email|e-mail|correo|mail)/i,
  unidad: /^(unidad|piso|puerta|vivienda|unit|direcci[oó]n|portal)/i,
  beta:   /^(beta|β|coeficiente|coef\.?|reparto|porcentaje|%|factor|proporci[oó]n|participaci[oó]n)/i,
};

const FIELD_LABELS: Record<string, { label: string; required: boolean }> = {
  nombre: { label: "Nombre", required: true },
  cups:   { label: "CUPS", required: true },
  email:  { label: "Email", required: false },
  unidad: { label: "Unidad / Piso", required: false },
  beta:   { label: "Coeficiente β", required: false },
};

function autoMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const h of headers) {
    const clean = h.trim();
    for (const [field, re] of Object.entries(COL_MATCHERS)) {
      if (re.test(clean) && !map[field]) { map[field] = h; break; }
    }
  }
  return map;
}

function parseBeta(raw: string): number | null {
  if (!raw || raw.trim() === "") return null;
  const clean = raw.trim().replace(",", ".").replace("%", "");
  const n = parseFloat(clean);
  if (isNaN(n) || n < 0) return null;
  // If value looks like a percentage (e.g. 25 meaning 25%)
  if (raw.includes("%") || n > 1) return n / 100;
  return n;
}

function buildRows(
  rows: Record<string, string>[],
  map: Record<string, string>,
  existingCups: string[],
  overwrite: boolean,
): ParsedRow[] {
  const existingSet = new Set(existingCups.map(c => c.toUpperCase()));
  const seenCups = new Set<string>();

  return rows.map(row => {
    const nombre = (row[map.nombre] ?? "").trim();
    const cups   = (row[map.cups]   ?? "").trim().toUpperCase().replace(/\s/g, "");
    const email  = (row[map.email]  ?? "").trim();
    const unidad = (row[map.unidad] ?? "").trim();
    const beta   = map.beta ? parseBeta(row[map.beta] ?? "") : null;
    const errors: string[] = [];
    const warnings: string[] = [];
    let willUpdate = false;

    if (!nombre) errors.push("Nombre obligatorio");
    if (!cups) {
      errors.push("CUPS obligatorio");
    } else {
      const v = validateCUPS(cups);
      if (!v.valid) {
        errors.push(v.error!);
      } else if (existingSet.has(cups)) {
        if (overwrite) {
          willUpdate = true; // mark as update, not error
        } else {
          errors.push("CUPS ya existe — activa «Actualizar si ya existe» para sobreescribir");
        }
      }
      if (seenCups.has(cups)) errors.push("CUPS duplicado en el archivo");
      seenCups.add(cups);
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email con formato inválido");
    if (!email) warnings.push("Sin email — no se podrán enviar firmas");
    if (!unidad) warnings.push("Sin piso/unidad — difícil identificar al participante");

    return { nombre, cups, email, unidad, beta, errors, warnings, willUpdate };
  });
}

function parseFile(data: ArrayBuffer): { headers: string[]; rows: Record<string, string>[] } {
  const wb = XLSX.read(data, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });
  const headers = json.length > 0 ? Object.keys(json[0]) : [];
  return { headers, rows: json };
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Nombre", "CUPS", "Email", "Unidad", "Beta"],
    ["María García López", "ES0021000000000001AA1P", "maria@ejemplo.com", "1ºA", 0.5],
    ["Juan Rodríguez Sanz", "ES0021000000000002BB2Q", "juan@ejemplo.com", "2ºB", 0.5],
  ]);
  ws["!cols"] = [{ wch: 25 }, { wch: 26 }, { wch: 28 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, "Participantes");
  XLSX.writeFile(wb, "plantilla_participantes.xlsx");
}

export function ImportParticipantsDialog({
  open,
  onOpenChange,
  communityId,
  existingCups,
  onImported,
}: ImportParticipantsDialogProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "result">("upload");
  const [importResult, setImportResult] = useState<{ ok: number; updated: number; failed: number; betaOk: boolean | null; errors: string[] }>({ ok: 0, updated: 0, failed: 0, betaOk: null, errors: [] });
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setColumnMap({});
    setParsed([]);
    setOverwrite(false);
    setImportProgress(0);
    setImportResult({ ok: 0, updated: 0, failed: 0, betaOk: null, errors: [] });
  }, []);

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const rebuildRows = useCallback((rows: Record<string, string>[], map: Record<string, string>, ow: boolean) => {
    setParsed(buildRows(rows, map, existingCups, ow));
  }, [existingCups]);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { headers: h, rows } = parseFile(e.target!.result as ArrayBuffer);
        const map = autoMap(h);
        setHeaders(h);
        setRawRows(rows);
        setColumnMap(map);
        if (!map.nombre || !map.cups) {
          setStep("mapping");
        } else {
          setParsed(buildRows(rows, map, existingCups, overwrite));
          setStep("preview");
        }
      } catch { reset(); }
    };
    reader.readAsArrayBuffer(file);
  }, [existingCups, overwrite, reset]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }, [processFile]);

  const applyMapping = () => {
    setParsed(buildRows(rawRows, columnMap, existingCups, overwrite));
    setStep("preview");
  };

  const toggleOverwrite = (val: boolean) => {
    setOverwrite(val);
    rebuildRows(rawRows, columnMap, val);
  };

  const validRows   = parsed.filter(r => r.errors.length === 0);
  const updateRows  = parsed.filter(r => r.errors.length === 0 && r.willUpdate);
  const newRows     = parsed.filter(r => r.errors.length === 0 && !r.willUpdate);
  const errorRows   = parsed.filter(r => r.errors.length > 0);
  const warnRows    = parsed.filter(r => r.errors.length === 0 && r.warnings.length > 0);
  const hasBeta     = parsed.some(r => r.beta !== null);
  const betaSum     = hasBeta ? validRows.reduce((s, r) => s + (r.beta ?? 0), 0) : 0;
  const betaSumOk   = hasBeta && Math.abs(betaSum - 1) < 1e-6;

  const handleImport = async () => {
    setStep("importing");
    const imported: Participant[] = [];
    const updated: Participant[] = [];
    const apiErrors: string[] = [];
    let done = 0;
    const rows = validRows;

    for (const row of rows) {
      try {
        const res = await fetch(`/api/communities/${communityId}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.nombre,
            cups: row.cups,
            email: row.email || undefined,
            unit: row.unidad || undefined,
            overwrite: row.willUpdate,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const participant: Participant = {
            id: data.id,
            name: row.nombre,
            cups: row.cups,
            email: row.email,
            unit: row.unidad,
            beta: row.beta ?? 0,
            status: "active",
            signatureState: "pending",
            entryDate: new Date().toISOString().slice(0, 10),
          };
          if (row.willUpdate) updated.push(participant);
          else imported.push(participant);
        } else {
          const data = await res.json().catch(() => ({}));
          apiErrors.push(`${row.nombre}: ${data.message ?? `Error ${res.status}`}`);
        }
      } catch {
        apiErrors.push(`${row.nombre}: error de red`);
      }
      done++;
      setImportProgress(Math.round((done / rows.length) * 100));
    }

    if (imported.length + updated.length > 0) onImported([...imported, ...updated]);

    // ── Coeficientes β ───────────────────────────────────────────
    let betaOk: boolean | null = null;
    const cupToId = new Map([...imported, ...updated].map(p => [p.cups, p.id]));
    const betaEntradas = rows
      .filter(r => r.errors.length === 0 && r.beta !== null)
      .map(r => ({ participanteId: cupToId.get(r.cups), valor: r.beta!.toFixed(6) }))
      .filter(e => e.participanteId);

    if (betaEntradas.length > 0) {
      try {
        const res = await fetch(`/api/installations/${communityId}/coefficients`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modo: "CONSTANTE", entradas: betaEntradas }),
        });
        betaOk = res.ok;
      } catch { betaOk = false; }
    }

    setImportResult({ ok: imported.length, updated: updated.length, failed: apiErrors.length, betaOk, errors: apiErrors });
    setStep("result");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-semibold">
            Importar participantes
          </DialogTitle>
          <DialogDescription>
            Sube un archivo Excel (.xlsx) o CSV con los datos de los participantes.
          </DialogDescription>
        </DialogHeader>

        {/* ── Upload ─────────────────────────────────────────────── */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors ${
                dragOver ? "border-foreground/30 bg-muted" : "border-border hover:border-foreground/20 hover:bg-muted/50"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Arrastra tu archivo aquí</p>
                <p className="mt-1 text-xs text-muted-foreground">o haz clic para seleccionar · .xlsx, .csv</p>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Download className="h-3 w-3" />
                Descargar plantilla Excel
              </button>
              <span className="text-xs text-muted-foreground/60">
                — intenta que tu Excel sea lo más parecido posible a la plantilla para una mejor importación.
              </span>
            </div>
          </div>
        )}

        {/* ── Mapping ────────────────────────────────────────────── */}
        {step === "mapping" && (
          <div className="space-y-5">
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                No hemos podido detectar automáticamente las columnas de tu archivo. Asígnalas manualmente.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{fileName}</span>
              <span>· {rawRows.length} filas · {headers.length} columnas</span>
              <button onClick={reset} className="ml-auto hover:text-foreground transition-colors">Cambiar archivo</button>
            </div>
            <div className="space-y-3">
              {Object.entries(FIELD_LABELS).map(([field, { label, required }]) => (
                <div key={field} className="grid grid-cols-2 items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    {required
                      ? <span className="text-[10px] text-destructive font-medium">obligatorio</span>
                      : <span className="text-[10px] text-muted-foreground">opcional</span>
                    }
                  </div>
                  <select
                    value={columnMap[field] ?? ""}
                    onChange={e => setColumnMap(m => ({ ...m, [field]: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="">— No mapear —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {rawRows.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Vista previa — primera fila</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(FIELD_LABELS).map(([field, { label }]) => (
                    <div key={field} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground w-20 shrink-0">{label}:</span>
                      <span className="text-[10px] font-mono text-foreground truncate">
                        {columnMap[field] ? (rawRows[0][columnMap[field]] || "—") : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={applyMapping}
                disabled={!columnMap.nombre || !columnMap.cups}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Continuar <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* ── Preview ────────────────────────────────────────────── */}
        {step === "preview" && (
          <div className="space-y-4 min-h-0 flex flex-col">
            {/* File + overwrite toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-foreground font-medium">{fileName}</span>
                <span className="text-xs text-muted-foreground">· {parsed.length} filas</span>
              </div>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cambiar archivo
              </button>
            </div>

            {/* Overwrite toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => toggleOverwrite(!overwrite)}
                className={`relative h-4 w-7 rounded-full transition-colors ${overwrite ? "bg-primary" : "bg-border"}`}
              >
                <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${overwrite ? "translate-x-3" : "translate-x-0.5"}`} />
              </div>
              <span className="text-xs text-foreground">Actualizar datos si el participante ya existe</span>
            </label>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              {newRows.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
                  <Check className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">{newRows.length} nuevo{newRows.length !== 1 ? "s" : ""}</span>
                </div>
              )}
              {updateRows.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5">
                  <RefreshCw className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">{updateRows.length} se actualizará{updateRows.length !== 1 ? "n" : ""}</span>
                </div>
              )}
              {warnRows.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">{warnRows.length} con avisos</span>
                </div>
              )}
              {errorRows.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5">
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <span className="text-xs font-medium text-destructive">{errorRows.length} con errores</span>
                </div>
              )}
              {hasBeta && (
                <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border ${
                  betaSumOk
                    ? "bg-primary/10 border-primary/20"
                    : "bg-amber-50 border-amber-200"
                }`}>
                  {betaSumOk
                    ? <Check className="h-3 w-3 text-primary" />
                    : <AlertCircle className="h-3 w-3 text-amber-600" />
                  }
                  <span className={`text-xs font-medium tabular-nums ${betaSumOk ? "text-primary" : "text-amber-700"}`}>
                    Σβ = {betaSum.toFixed(6)}{!betaSumOk && " ≠ 1"}
                  </span>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-auto rounded-lg border border-border flex-1 min-h-0 max-h-[280px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr className="border-b border-border">
                    <th className="text-left font-semibold text-muted-foreground px-3 py-2">Nombre</th>
                    <th className="text-left font-semibold text-muted-foreground px-3 py-2">CUPS</th>
                    <th className="text-left font-semibold text-muted-foreground px-3 py-2">Email</th>
                    <th className="text-left font-semibold text-muted-foreground px-3 py-2">Unidad</th>
                    {hasBeta && <th className="text-right font-semibold text-muted-foreground px-3 py-2 w-20">β</th>}
                    <th className="text-center font-semibold text-muted-foreground px-3 py-2 w-16">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.map((row, i) => (
                    <tr key={i} className={
                      row.errors.length > 0 ? "bg-destructive/5" :
                      row.willUpdate ? "bg-blue-50/50" :
                      row.warnings.length > 0 ? "bg-amber-50/40" : ""
                    }>
                      <td className="px-3 py-2 text-foreground">{row.nombre || "—"}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground text-[10px]">{row.cups || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.email || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.unidad || "—"}</td>
                      {hasBeta && (
                        <td className="px-3 py-2 text-right font-mono text-xs text-foreground">
                          {row.beta !== null ? (row.beta * 100).toFixed(4) + "%" : "—"}
                        </td>
                      )}
                      <td className="px-3 py-2 text-center">
                        {row.errors.length > 0 ? (
                          <span className="group relative">
                            <AlertCircle className="h-3.5 w-3.5 text-destructive mx-auto" />
                            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[200px] rounded-md bg-foreground px-2 py-1 text-[10px] text-background opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {row.errors.join(". ")}
                            </span>
                          </span>
                        ) : row.willUpdate ? (
                          <span className="group relative">
                            <RefreshCw className="h-3.5 w-3.5 text-blue-500 mx-auto" />
                            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[180px] rounded-md bg-foreground px-2 py-1 text-[10px] text-background opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              Se actualizarán los datos existentes
                            </span>
                          </span>
                        ) : row.warnings.length > 0 ? (
                          <span className="group relative">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 mx-auto" />
                            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[200px] rounded-md bg-foreground px-2 py-1 text-[10px] text-background opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {row.warnings.join(". ")}
                            </span>
                          </span>
                        ) : (
                          <Check className="h-3.5 w-3.5 text-primary mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Email warning */}
            {(() => {
              const noEmail = validRows.filter(r => !r.email).length;
              return noEmail > 0 ? (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">{noEmail} participante{noEmail !== 1 ? "s" : ""} sin email.</span>{" "}
                    No podrán recibir el enlace de firma digital. Podrás añadir su email más tarde desde el detalle de la comunidad.
                  </p>
                </div>
              ) : null;
            })()}

            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-muted-foreground">
                Las filas con errores se omitirán automáticamente.
              </p>
              <button
                onClick={handleImport}
                disabled={validRows.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Upload className="h-3 w-3" />
                Importar {validRows.length} participante{validRows.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}

        {/* ── Importing ──────────────────────────────────────────── */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Importando participantes...</p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">{importProgress}%</p>
            </div>
            <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${importProgress}%` }} />
            </div>
          </div>
        )}

        {/* ── Result ─────────────────────────────────────────────── */}
        {step === "result" && (
          <div className="space-y-4">
            {importResult.ok + importResult.updated > 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-sm text-foreground">
                    {importResult.ok > 0 && (
                      <span className="font-semibold">{importResult.ok} participante{importResult.ok !== 1 ? "s" : ""} añadido{importResult.ok !== 1 ? "s" : ""}. </span>
                    )}
                    {importResult.updated > 0 && (
                      <span className="font-semibold">{importResult.updated} actualizado{importResult.updated !== 1 ? "s" : ""}.</span>
                    )}
                  </p>
                  {importResult.betaOk === true && (
                    <p className="text-xs text-primary">Coeficientes β guardados correctamente.</p>
                  )}
                  {importResult.betaOk === false && (
                    <p className="text-xs text-amber-700">Los participantes se importaron pero los coeficientes β no se pudieron guardar. Introdúcelos manualmente en el editor.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-foreground font-semibold">No se pudo importar ningún participante.</p>
              </div>
            )}
            {importResult.errors.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {importResult.failed} fila{importResult.failed !== 1 ? "s" : ""} fallidas
                </p>
                <ul className="space-y-1">
                  {importResult.errors.map((e, i) => <li key={i} className="text-xs text-destructive">{e}</li>)}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              {importResult.ok + importResult.updated === 0 && (
                <button onClick={reset} className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors">
                  Reintentar
                </button>
              )}
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                {importResult.ok + importResult.updated > 0 ? "Cerrar" : "Cancelar"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
