"use client";

import { useCallback, useState } from "react";
import { AlertCircle, Copy, FileUp, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  EntradaVariable,
  ErrorValidacion,
  TipoDia,
} from "@/types/editor";
import {
  calcularSuma,
  parsearValor,
  TOLERANCIA_SUMA,
} from "@/lib/validators/coeficientes";
import { parsearCSVHorario } from "@/lib/generators/txtGenerator";
import { cn } from "@/lib/utils/cn";

// ─── Celda de coeficiente ─────────────────────────────────────────────────────

function CeldaCoeficiente({
  valor,
  tieneError,
  onChange,
  soloLectura,
}: {
  valor: string;
  tieneError: boolean;
  onChange: (v: string) => void;
  soloLectura?: boolean;
}) {
  const [valorLocal, setValorLocal] = useState(valor);

  const commitCambio = () => {
    if (valorLocal !== valor) onChange(valorLocal);
  };

  return (
    <input
      type="text"
      value={valorLocal}
      onChange={(e) => setValorLocal(e.target.value)}
      onBlur={commitCambio}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Tab") commitCambio();
      }}
      readOnly={soloLectura}
      inputMode="decimal"
      placeholder="0"
      className={cn(
        "h-7 w-20 rounded-sm border px-1.5 text-center font-mono text-xs transition-colors",
        "focus:outline-none focus:ring-1 focus:ring-primary",
        tieneError
          ? "border-destructive bg-destructive/5 text-destructive"
          : "border-transparent hover:border-input focus:border-input",
        soloLectura && "cursor-default"
      )}
    />
  );
}

// ─── Tabla de tipo de día ─────────────────────────────────────────────────────

function TablaTipoDia({
  tipoDia,
  entradas,
  errores,
  onCambio,
  soloLectura,
}: {
  tipoDia: TipoDia;
  entradas: EntradaVariable[];
  errores: ErrorValidacion[];
  onCambio: (entradas: EntradaVariable[]) => void;
  soloLectura?: boolean;
}) {
  const erroresSet = new Set(
    errores
      .filter((e) => e.tipoDia === tipoDia)
      .map((e) => `${e.participanteId}-${e.hora}`)
  );

  const horasConError = new Set(
    errores
      .filter((e) => e.tipoDia === tipoDia && e.hora !== undefined)
      .map((e) => e.hora!)
  );

  const handleCambio = (participanteId: string, hora: number, valor: string) => {
    onCambio(
      entradas.map((e) =>
        e.participanteId === participanteId
          ? {
              ...e,
              matriz: {
                ...e.matriz,
                [tipoDia]: e.matriz[tipoDia].map((v, h) =>
                  h === hora ? valor : v
                ),
              },
            }
          : e
      )
    );
  };

  const HORAS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <ScrollArea className="w-full">
      <div className="min-w-max">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[160px] bg-background border-b border-r border-border px-3 py-2 text-left font-medium text-muted-foreground">
                Participante
              </th>
              {HORAS.map((h) => (
                <th
                  key={h}
                  className={cn(
                    "min-w-[88px] border-b border-border px-1 py-2 text-center font-mono font-medium",
                    horasConError.has(h)
                      ? "text-destructive bg-destructive/5"
                      : "text-muted-foreground"
                  )}
                >
                  {h.toString().padStart(2, "0")}h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entradas.map((entrada) => (
              <tr key={entrada.participanteId} className="group">
                <td className="sticky left-0 z-10 bg-background border-b border-r border-border px-3 py-1.5">
                  <div>
                    <p className="font-medium truncate max-w-[150px]">
                      {entrada.nombre}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground truncate">
                      {entrada.cups}
                    </p>
                  </div>
                </td>
                {HORAS.map((hora) => {
                  const tieneError = erroresSet.has(
                    `${entrada.participanteId}-${hora}`
                  );
                  return (
                    <td key={hora} className="border-b border-border px-1 py-1">
                      <CeldaCoeficiente
                        valor={entrada.matriz[tipoDia][hora]}
                        tieneError={tieneError}
                        onChange={(v) =>
                          handleCambio(entrada.participanteId, hora, v)
                        }
                        soloLectura={soloLectura}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {/* Footer: suma por hora */}
          <tfoot>
            <tr>
              <td className="sticky left-0 z-10 bg-muted/50 border-t border-r border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                Σβ por hora
              </td>
              {HORAS.map((hora) => {
                const valores = entradas.map((e) => e.matriz[tipoDia][hora]);
                const suma = calcularSuma(valores);
                const tieneValores = valores.some((v) => v && v.trim() !== "");
                const valido = tieneValores && Math.abs(suma - 1) <= TOLERANCIA_SUMA;

                return (
                  <td
                    key={hora}
                    className={cn(
                      "border-t border-border px-1 py-1.5 text-center font-mono",
                      tieneValores
                        ? valido
                          ? "text-green-600 font-medium"
                          : "text-destructive font-medium bg-destructive/5"
                        : "text-muted-foreground/40"
                    )}
                  >
                    {tieneValores ? suma.toFixed(3).replace(".", ",") : "—"}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

// ─── Importador CSV ───────────────────────────────────────────────────────────

function ImportadorCSV({
  cupsEsperados,
  onImportar,
}: {
  cupsEsperados: string[];
  onImportar: (entradas: EntradaVariable[]) => void;
}) {
  const [arrastrando, setArrastrando] = useState(false);
  const [resultado, setResultado] = useState<ReturnType<
    typeof parsearCSVHorario
  > | null>(null);
  const [confirmarAbierto, setConfirmarAbierto] = useState(false);

  async function procesarArchivo(archivo: File) {
    const texto = await archivo.text();
    const res = parsearCSVHorario(texto, cupsEsperados);
    setResultado(res);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastrando(false);
    const archivo = e.dataTransfer.files[0];
    if (archivo) procesarArchivo(archivo);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (archivo) procesarArchivo(archivo);
  }

  function descargarPlantilla() {
    const lineas: string[] = [];
    const tipos: TipoDia[] = ["LABORABLE", "SABADO", "FESTIVO"];
    for (const cups of cupsEsperados) {
      for (const tipo of tipos) {
        for (let h = 0; h < 24; h++) {
          lineas.push(`${cups};${tipo};${h};0`);
        }
      }
    }
    const contenido = lineas.join("\n");
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_horario.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Importar desde CSV</h4>
          <p className="text-xs text-muted-foreground">
            Formato: CUPS;TIPO_DIA;HORA;VALOR (72 filas por participante)
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={descargarPlantilla}>
          Descargar plantilla
        </Button>
      </div>

      {/* Zona de drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors",
          arrastrando
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        )}
      >
        <FileUp className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Arrastra tu fichero CSV aquí</p>
        <p className="text-xs text-muted-foreground mt-1">o</p>
        <label className="mt-3 cursor-pointer">
          <span className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
            Seleccionar archivo
          </span>
          <input
            type="file"
            accept=".csv,.txt"
            className="sr-only"
            onChange={handleFileInput}
          />
        </label>
      </div>

      {/* Resultado del análisis */}
      {resultado && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">
                {resultado.filasTotales}
              </p>
              <p className="text-xs text-muted-foreground">Líneas totales</p>
            </div>
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-green-700">
                {resultado.filasValidas}
              </p>
              <p className="text-xs text-green-600">Válidas</p>
            </div>
            <div
              className={cn(
                "rounded-md border p-3 text-center",
                resultado.filasError > 0
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border"
              )}
            >
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  resultado.filasError > 0 ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {resultado.filasError}
              </p>
              <p className="text-xs text-muted-foreground">Errores</p>
            </div>
          </div>

          {resultado.errores.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive mb-1">
                Primeros errores:
              </p>
              <ul className="space-y-0.5 text-xs text-destructive">
                {resultado.errores.slice(0, 5).map((e, i) => (
                  <li key={i}>
                    Línea {e.linea}: {e.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultado.filasValidas > 0 && (
            <Button
              className="w-full"
              onClick={() => setConfirmarAbierto(true)}
              disabled={resultado.filasError > 0 && resultado.filasValidas === 0}
            >
              Importar {resultado.filasValidas} filas válidas
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={confirmarAbierto} onOpenChange={setConfirmarAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Importar datos del CSV?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto sobreescribirá los coeficientes actuales del modo variable con
              los datos del fichero. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // La importación real requeriría reconstruir las EntradaVariable
                // desde los datos del CSV, lo cual se haría en el padre
                setConfirmarAbierto(false);
              }}
            >
              Importar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface EditorHorarioProps {
  entradas: EntradaVariable[];
  onCambio: (entradas: EntradaVariable[]) => void;
  errores?: ErrorValidacion[];
  soloLectura?: boolean;
}

const TIPO_DIA_LABEL: Record<TipoDia, string> = {
  LABORABLE: "L-V (Laborable)",
  SABADO: "Sábado",
  FESTIVO: "Festivo / Domingo",
};

export function EditorHorario({
  entradas,
  onCambio,
  errores = [],
  soloLectura = false,
}: EditorHorarioProps) {
  const [confirmarCopiaAbierto, setConfirmarCopiaAbierto] = useState(false);

  function copiarLaborableATodos() {
    onCambio(
      entradas.map((entrada) => ({
        ...entrada,
        matriz: {
          LABORABLE: [...entrada.matriz.LABORABLE],
          SABADO: [...entrada.matriz.LABORABLE],
          FESTIVO: [...entrada.matriz.LABORABLE],
        },
      }))
    );
  }

  const cupsEsperados = entradas.map((e) => e.cups);

  return (
    <div className="space-y-4">
      {/* Acciones globales */}
      {!soloLectura && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Define los coeficientes por tipo de día (24h cada uno)
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmarCopiaAbierto(true)}
            className="gap-2"
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar L-V a Sáb/Fest
          </Button>
        </div>
      )}

      {/* Tabs por tipo de día + CSV */}
      <Tabs defaultValue="LABORABLE">
        <TabsList>
          {(["LABORABLE", "SABADO", "FESTIVO"] as TipoDia[]).map((tipo) => {
            const erroresTipo = errores.filter((e) => e.tipoDia === tipo).length;
            return (
              <TabsTrigger key={tipo} value={tipo} className="gap-2">
                {TIPO_DIA_LABEL[tipo]}
                {erroresTipo > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1">
                    {erroresTipo}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
          {!soloLectura && (
            <TabsTrigger value="CSV">
              <FileUp className="h-3.5 w-3.5 mr-1.5" />
              CSV
            </TabsTrigger>
          )}
        </TabsList>

        {(["LABORABLE", "SABADO", "FESTIVO"] as TipoDia[]).map((tipo) => (
          <TabsContent key={tipo} value={tipo} className="mt-4">
            <TablaTipoDia
              tipoDia={tipo}
              entradas={entradas}
              errores={errores}
              onCambio={onCambio}
              soloLectura={soloLectura}
            />
          </TabsContent>
        ))}

        {!soloLectura && (
          <TabsContent value="CSV" className="mt-4">
            <ImportadorCSV
              cupsEsperados={cupsEsperados}
              onImportar={onCambio}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Diálogo confirmar copia */}
      <AlertDialog
        open={confirmarCopiaAbierto}
        onOpenChange={setConfirmarCopiaAbierto}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Copiar Laborable a Sábado y Festivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Los valores de la columna Laborable (L-V) se copiarán a Sábado y
              Festivo/Domingo. Los datos actuales de esos días se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                copiarLaborableATodos();
                setConfirmarCopiaAbierto(false);
              }}
            >
              Sí, copiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
