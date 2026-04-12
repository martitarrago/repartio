"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Loader2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { descargarFicheroTxt } from "@/lib/generators/txtGenerator";
import type { RegistroHistorial } from "@/components/installations/HistorialTab";

// ─── Utilidades ──────────────────────────────────────────────────────────────

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Línea con resaltado de sintaxis ─────────────────────────────────────────

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

// ─── Componente principal ────────────────────────────────────────────────────

interface DocumentoTabProps {
  instalacionId: string;
  conjuntoId?: string;
  nombre: string;
  cau: string;
  anio: number;
  totalParticipantes: number;
  historial: RegistroHistorial[];
  tieneConjuntoValidado: boolean;
}

export function DocumentoTab({
  instalacionId,
  conjuntoId,
  nombre,
  cau,
  anio,
  totalParticipantes,
  historial,
  tieneConjuntoValidado,
}: DocumentoTabProps) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    contenido: string;
    nombreFichero: string;
    totalLineas: number;
    modo: "CONSTANTE" | "VARIABLE";
  } | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function handleGenerar() {
    if (!conjuntoId) return;
    setGenerando(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/installations/${instalacionId}/coefficients/${conjuntoId}/generate`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "Error al generar el fichero");
        return;
      }
      const { contenido, nombreFichero, totalLineas, modo } = await res.json();
      descargarFicheroTxt(contenido, nombreFichero);
      setPreview({ contenido, nombreFichero, totalLineas, modo: modo ?? "CONSTANTE" });
    } catch {
      setError("Error de conexión al generar el fichero");
    } finally {
      setGenerando(false);
    }
  }

  async function handleVistaPrevia() {
    if (!conjuntoId) return;
    setGenerando(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/installations/${instalacionId}/coefficients/${conjuntoId}/generate`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "Error al generar vista previa");
        return;
      }
      const { contenido, nombreFichero, totalLineas, modo } = await res.json();
      setPreview({ contenido, nombreFichero, totalLineas, modo: modo ?? "CONSTANTE" });
    } catch {
      setError("Error de conexión");
    } finally {
      setGenerando(false);
    }
  }

  async function copiarPortapapeles() {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview.contenido);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = preview.contenido;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const lineas = preview
    ? preview.contenido.split("\n").filter((l) => l.trim().length > 0)
    : [];
  const MAX_LINEAS = 50;
  const lineasMostradas = lineas.slice(0, MAX_LINEAS);
  const lineasOcultas = lineas.length - lineasMostradas.length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cabecera */}
      <div>
        <h3 className="font-medium">Documento .txt</h3>
        <p className="text-sm text-muted-foreground">
          Genera y descarga el fichero de coeficientes en formato Anejo I — RD 244/2019
        </p>
      </div>

      <Separator />

      {/* Info de la instalación + botones */}
      <div className="rounded-lg border bg-card p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{nombre}</p>
            <p className="text-sm text-muted-foreground">
              Formato Anejo I — RD 244/2019
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">CAU</p>
            <p className="font-mono text-xs">{cau}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Año</p>
            <p className="font-medium">{anio}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Participantes</p>
            <p className="font-medium">{totalParticipantes}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ficheros generados</p>
            <p className="font-medium">{historial.length}</p>
          </div>
        </div>

        {/* Badges de formato */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs font-normal">UTF-8 sin BOM</Badge>
          <Badge variant="outline" className="text-xs font-normal">Separador: ;</Badge>
          <Badge variant="outline" className="text-xs font-normal">Decimal: ,</Badge>
          <Badge variant="outline" className="text-xs font-normal">6 decimales</Badge>
        </div>

        {/* Acciones */}
        {!conjuntoId ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">Sin coeficientes configurados</p>
            <p className="mt-1 text-amber-700">
              Configura los coeficientes en la pestaña{" "}
              <strong>Coeficientes</strong> antes de generar el fichero.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerar}
              disabled={generando}
            >
              {generando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {generando ? "Generando..." : "Generar y descargar .txt"}
            </Button>
            <Button
              variant="outline"
              onClick={handleVistaPrevia}
              disabled={generando}
            >
              <Eye className="mr-2 h-4 w-4" />
              Vista previa
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Vista previa inline */}
      {preview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Vista previa del fichero</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={copiarPortapapeles}
                className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-accent"
              >
                {copiado ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <div
            className="rounded-lg overflow-hidden border"
            style={{ backgroundColor: "#1e1e2e" }}
          >
            <div
              className="flex items-center justify-between px-4 py-2 border-b"
              style={{ borderColor: "#313244", backgroundColor: "#181825" }}
            >
              <span className="text-xs font-mono" style={{ color: "#cdd6f4" }}>
                {preview.nombreFichero}
              </span>
              <span className="text-xs font-mono" style={{ color: "#6c7086" }}>
                {preview.totalLineas.toLocaleString("es-ES")} líneas
              </span>
            </div>

            <ScrollArea className="h-72">
              <div className="p-4 space-y-0.5">
                {lineasMostradas.map((linea, i) => (
                  <LineaPrevia
                    key={i}
                    linea={linea}
                    numero={i + 1}
                    modo={preview.modo}
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

          <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Fichero conforme al{" "}
              <strong>Real Decreto 244/2019, Anejo I</strong> y la{" "}
              <strong>Orden TED/1247/2021</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Historial de ficheros */}
      {historial.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <div>
            <h4 className="text-sm font-medium">Historial de generaciones</h4>
            <p className="text-xs text-muted-foreground">
              {historial.length} fichero{historial.length !== 1 ? "s" : ""} generado{historial.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichero</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead className="text-right">Líneas</TableHead>
                  <TableHead>Generado</TableHead>
                  <TableHead>Por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <code className="text-xs truncate max-w-[200px]">
                          {r.nombreFichero}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {r.modo === "CONSTANTE" ? "Constante" : "Variable"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {r.totalLineas.toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatearFecha(r.generadoEn)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.generadoPor ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
