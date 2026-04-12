"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileText,
  Shield,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { descargarFicheroTxt } from "@/lib/generators/txtGenerator";

// ─── Utilidades ───────────────────────────────────────────────────────────────

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Preview con resaltado de sintaxis ───────────────────────────────────────

function LineaPrevia({
  linea,
  numero,
  modo,
}: {
  linea: string;
  numero: number;
  modo: "CONSTANTE" | "VARIABLE";
}) {
  const partes = linea.split(";");

  return (
    <div className="flex items-start gap-3 font-mono text-xs leading-relaxed">
      <span className="w-8 shrink-0 select-none text-right text-[#6c7086]">
        {numero}
      </span>
      <span>
        {modo === "CONSTANTE" ? (
          <>
            <span className="text-[#89dceb]">{partes[0]}</span>
            <span className="text-[#6c7086]">;</span>
            <span className="text-[#a6e3a1]">{partes[1]}</span>
          </>
        ) : (
          <>
            <span className="text-[#89dceb]">{partes[0]}</span>
            <span className="text-[#6c7086]">;</span>
            <span className="text-[#f9e2af]">{partes[1]}</span>
            <span className="text-[#6c7086]">;</span>
            <span className="text-[#a6e3a1]">{partes[2]}</span>
          </>
        )}
      </span>
    </div>
  );
}

// ─── Fila de metadatos ────────────────────────────────────────────────────────

function FilaMeta({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{valor}</p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface VistaPreviaProps {
  abierta: boolean;
  onCerrar: () => void;
  contenido: string;
  nombreFichero: string;
  totalLineas: number;
  tamanoBytes: number;
  modo: "CONSTANTE" | "VARIABLE";
  anio: number;
}

export function VistaPrevia({
  abierta,
  onCerrar,
  contenido,
  nombreFichero,
  totalLineas,
  tamanoBytes,
  modo,
  anio,
}: VistaPreviaProps) {
  const [copiado, setCopiado] = useState(false);
  const [descargado, setDescargado] = useState(false);

  // Mostrar las primeras 50 líneas en la previa
  const MAX_LINEAS_PREVIEW = 50;
  const lineas = contenido
    .split("\n")
    .filter((l) => l.trim().length > 0);
  const lineasMostradas = lineas.slice(0, MAX_LINEAS_PREVIEW);
  const lineasOcultas = lineas.length - lineasMostradas.length;

  async function copiarPortapapeles() {
    try {
      await navigator.clipboard.writeText(contenido);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = contenido;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function descargar() {
    descargarFicheroTxt(contenido, nombreFichero);
    setDescargado(true);
    setTimeout(() => setDescargado(false), 3000);
  }

  const ahora = new Date();

  return (
    <Dialog open={abierta} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Vista previa del fichero
          </DialogTitle>
          <DialogDescription className="break-all">
            Anejo I RD 244/2019
          </DialogDescription>
        </DialogHeader>

        {/* Nombre del fichero */}
        <div className="rounded-md bg-muted/30 px-4 py-2">
          <p className="text-xs text-muted-foreground">Nombre del fichero</p>
          <p className="font-mono text-sm font-medium break-all">{nombreFichero}</p>
        </div>

        {/* Metadatos con badges */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <FilaMeta label="Modo" valor={modo === "CONSTANTE" ? "Constante" : "Variable (8760h)"} />
            <FilaMeta label="Año" valor={anio} />
            <FilaMeta label="Total líneas" valor={totalLineas.toLocaleString("es-ES")} />
            <FilaMeta label="Tamaño" valor={formatearTamano(tamanoBytes)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs font-normal">UTF-8 sin BOM</Badge>
            <Badge variant="outline" className="text-xs font-normal">Separador: ;</Badge>
            <Badge variant="outline" className="text-xs font-normal">Decimal: ,</Badge>
            <Badge variant="outline" className="text-xs font-normal">6 decimales</Badge>
          </div>
        </div>

        {/* Código */}
        <div
          className="rounded-lg overflow-hidden border"
          style={{ backgroundColor: "#1e1e2e" }}
        >
          {/* Barra superior */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{ borderColor: "#313244", backgroundColor: "#181825" }}
          >
            <span className="text-xs font-mono" style={{ color: "#cdd6f4" }}>
              {nombreFichero}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={copiarPortapapeles}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors"
                style={{ color: "#cdd6f4" }}
                title="Copiar al portapapeles"
              >
                {copiado ? (
                  <Check className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <ScrollArea className="h-64">
            <div className="p-4 space-y-0.5">
              {lineasMostradas.map((linea, i) => (
                <LineaPrevia
                  key={i}
                  linea={linea}
                  numero={i + 1}
                  modo={modo}
                />
              ))}
              {lineasOcultas > 0 && (
                <p
                  className="mt-3 text-xs font-mono"
                  style={{ color: "#6c7086" }}
                >
                  ... y {lineasOcultas.toLocaleString("es-ES")} líneas más
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Nota de cumplimiento */}
        <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            Fichero generado conforme al{" "}
            <strong>Real Decreto 244/2019, Anejo I</strong> y la{" "}
            <strong>Orden TED/1247/2021</strong>. Coeficientes con 6 decimales,
            separador punto y coma, codificación UTF-8 sin BOM.
            <br />
            Generado: {ahora.toLocaleString("es-ES")}
          </span>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onCerrar}>
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
          <Button onClick={descargar}>
            {descargado ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {descargado ? "Descargado" : "Descargar .txt"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
