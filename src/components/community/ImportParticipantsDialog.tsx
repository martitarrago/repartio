"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, Check, Loader2, Download, X } from "lucide-react";
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
  errors: string[];
}

// Flexible column name matching
const COL_MATCHERS: Record<string, RegExp> = {
  nombre: /^(nombre|name|participante|titular|propietario)/i,
  cups:   /^(cups|código.?suministro|codigo.?suministro|punto.?suministro)/i,
  email:  /^(email|e-mail|correo|mail)/i,
  unidad: /^(unidad|piso|puerta|vivienda|unit|dirección|direccion|portal)/i,
};

function matchColumn(header: string): string | null {
  const clean = header.trim();
  for (const [field, re] of Object.entries(COL_MATCHERS)) {
    if (re.test(clean)) return field;
  }
  return null;
}

function parseFile(data: ArrayBuffer, fileName: string): { headers: string[]; rows: Record<string, string>[] } {
  const wb = XLSX.read(data, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });
  const headers = json.length > 0 ? Object.keys(json[0]) : [];
  return { headers, rows: json };
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Nombre", "CUPS", "Email", "Unidad"],
    ["María García López", "ES0021000000000001AA1P", "maria@ejemplo.com", "1ºA"],
    ["Juan Rodríguez Sanz", "ES0021000000000002BB2Q", "juan@ejemplo.com", "2ºB"],
  ]);
  ws["!cols"] = [{ wch: 25 }, { wch: 26 }, { wch: 28 }, { wch: 12 }];
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
  const [step, setStep] = useState<"upload" | "preview" | "importing">("upload");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setParsed([]);
    setColumnMap({});
    setImportProgress(0);
  }, []);

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { headers, rows } = parseFile(e.target!.result as ArrayBuffer, file.name);

        // Auto-map columns
        const map: Record<string, string> = {};
        for (const h of headers) {
          const match = matchColumn(h);
          if (match && !Object.values(map).includes(h)) {
            map[match] = h;
          }
        }

        setColumnMap(map);

        // Parse and validate rows
        const existingSet = new Set(existingCups.map(c => c.toUpperCase()));
        const seenCups = new Set<string>();
        const parsedRows: ParsedRow[] = [];

        for (const row of rows) {
          const nombre = (row[map.nombre] ?? "").trim();
          const cups = (row[map.cups] ?? "").trim().toUpperCase().replace(/\s/g, "");
          const email = (row[map.email] ?? "").trim();
          const unidad = (row[map.unidad] ?? "").trim();
          const errors: string[] = [];

          if (!nombre) errors.push("Nombre obligatorio");
          if (!cups) {
            errors.push("CUPS obligatorio");
          } else {
            const v = validateCUPS(cups);
            if (!v.valid) errors.push(v.error!);
            if (existingSet.has(cups)) errors.push("CUPS ya existe en la comunidad");
            if (seenCups.has(cups)) errors.push("CUPS duplicado en el archivo");
            seenCups.add(cups);
          }

          parsedRows.push({ nombre, cups, email, unidad, errors });
        }

        setParsed(parsedRows);
        setStep("preview");
      } catch {
        setParsed([]);
        setStep("upload");
      }
    };
    reader.readAsArrayBuffer(file);
  }, [existingCups]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const validRows = parsed.filter(r => r.errors.length === 0);
  const errorRows = parsed.filter(r => r.errors.length > 0);

  const handleImport = async () => {
    setStep("importing");
    const imported: Participant[] = [];
    let done = 0;

    for (const row of validRows) {
      try {
        const res = await fetch(`/api/communities/${communityId}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.nombre,
            cups: row.cups,
            email: row.email || undefined,
            unit: row.unidad || undefined,
          }),
        });

        if (res.ok) {
          const { id } = await res.json();
          imported.push({
            id,
            name: row.nombre,
            cups: row.cups,
            email: row.email,
            unit: row.unidad,
            beta: 0,
            status: "pending",
            signatureState: "pending",
            entryDate: new Date().toISOString().slice(0, 10),
          });
        }
      } catch {
        // skip failed row
      }

      done++;
      setImportProgress(Math.round((done / validRows.length) * 100));
    }

    onImported(imported);
    handleClose(false);
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

        {/* ── Upload step ────────────────────────────────────────── */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors ${
                dragOver
                  ? "border-foreground/30 bg-muted"
                  : "border-border hover:border-foreground/20 hover:bg-muted/50"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Arrastra tu archivo aquí
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  o haz clic para seleccionar · .xlsx, .csv
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-3 w-3" />
              Descargar plantilla Excel
            </button>
          </div>
        )}

        {/* ── Preview step ───────────────────────────────────────── */}
        {step === "preview" && (
          <div className="space-y-4 min-h-0 flex flex-col">
            {/* File info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-foreground font-medium">{fileName}</span>
                <span className="text-xs text-muted-foreground">
                  · {parsed.length} filas
                </span>
              </div>
              <button
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cambiar archivo
              </button>
            </div>

            {/* Summary */}
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
                <Check className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">{validRows.length} válidos</span>
              </div>
              {errorRows.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5">
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <span className="text-xs font-medium text-destructive">{errorRows.length} con errores</span>
                </div>
              )}
            </div>

            {/* Preview table */}
            <div className="overflow-auto rounded-lg border border-border flex-1 min-h-0 max-h-[340px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr className="border-b border-border">
                    <th className="text-left font-semibold text-muted-foreground px-3 py-2">Nombre</th>
                    <th className="text-left font-semibold text-muted-foreground px-3 py-2">CUPS</th>
                    <th className="text-left font-semibold text-muted-foreground px-3 py-2">Email</th>
                    <th className="text-left font-semibold text-muted-foreground px-3 py-2">Unidad</th>
                    <th className="text-center font-semibold text-muted-foreground px-3 py-2 w-16">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.map((row, i) => (
                    <tr
                      key={i}
                      className={row.errors.length > 0 ? "bg-destructive/5" : ""}
                    >
                      <td className="px-3 py-2 text-foreground">{row.nombre || "—"}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground text-[10px]">{row.cups || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.email || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.unidad || "—"}</td>
                      <td className="px-3 py-2 text-center">
                        {row.errors.length > 0 ? (
                          <span className="group relative">
                            <AlertCircle className="h-3.5 w-3.5 text-destructive mx-auto" />
                            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[200px] rounded-md bg-foreground px-2 py-1 text-[10px] text-background opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {row.errors.join(". ")}
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

            {/* Actions */}
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

        {/* ── Importing step ─────────────────────────────────────── */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Importando participantes...
              </p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {importProgress}%
              </p>
            </div>
            <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
