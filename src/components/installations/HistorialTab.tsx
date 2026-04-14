"use client";

import { Download, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface RegistroHistorial {
  id: string;
  nombreFichero: string;
  modo: "CONSTANTE" | "VARIABLE";
  totalLineas: number;
  totalParticipantes: number;
  verificacionSuma: boolean;
  generadoEn: string;
  generadoPor?: string;
  storageUrl?: string;
}

interface HistorialTabProps {
  registros: RegistroHistorial[];
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearTamano(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function HistorialTab({ registros }: HistorialTabProps) {
  if (registros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">Sin ficheros generados</p>
        <p className="text-xs text-muted-foreground mt-1">
          Los ficheros .txt que generes aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">Historial de ficheros</h3>
        <p className="text-sm text-muted-foreground">
          {registros.length} fichero{registros.length !== 1 ? "s" : ""} generado{registros.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fichero</TableHead>
              <TableHead>Modo</TableHead>
              <TableHead className="text-right">Líneas</TableHead>
              <TableHead>Σβ = 1</TableHead>
              <TableHead>Generado</TableHead>
              <TableHead>Por</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map((r) => (
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
                <TableCell>
                  {r.verificacionSuma ? (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">OK</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs">Error</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatearFecha(r.generadoEn)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.generadoPor ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {r.storageUrl ? (
                    <Button asChild size="sm" variant="ghost" className="h-7 gap-1.5 text-xs">
                      <a href={r.storageUrl} download={r.nombreFichero}>
                        <Download className="h-3.5 w-3.5" />
                        Descargar
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">No disponible</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
