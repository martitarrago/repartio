"use client";

import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { EstadoValidacion, TipoDia } from "@/types/editor";
import { cn } from "@/lib/utils/cn";

// ─── Indicador de suma ────────────────────────────────────────────────────────

function IndicadorSuma({
  suma,
  valido,
  label,
}: {
  suma: number;
  valido: boolean;
  label: string;
}) {
  const porcentaje = Math.min(100, Math.round(suma * 100));
  const diferencia = suma - 1;
  const tieneValor = suma > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-mono font-medium tabular-nums",
            !tieneValor
              ? "text-muted-foreground"
              : valido
              ? "text-yellow-600"
              : "text-destructive"
          )}
        >
          {tieneValor ? suma.toFixed(6).replace(".", ",") : "—"}
        </span>
      </div>
      <Progress
        value={porcentaje}
        className={cn(
          "h-1.5",
          valido ? "[&>div]:bg-yellow-500" : "[&>div]:bg-destructive"
        )}
      />
      {tieneValor && !valido && (
        <p className="text-xs text-destructive">
          {diferencia > 0
            ? `Exceso: +${diferencia.toFixed(6).replace(".", ",")}`
            : `Déficit: ${diferencia.toFixed(6).replace(".", ",")}`}
        </p>
      )}
    </div>
  );
}

// ─── Tarjeta de tipo de día ───────────────────────────────────────────────────

const TIPO_DIA_LABEL: Record<TipoDia, string> = {
  LABORABLE: "Laborable",
  SABADO: "Sábado",
  FESTIVO: "Festivo",
};

function TarjetasTipoDia({
  estado,
}: {
  estado: EstadoValidacion;
}) {
  const tiposDia: TipoDia[] = ["LABORABLE", "SABADO", "FESTIVO"];

  return (
    <div className="grid grid-cols-3 gap-3">
      {tiposDia.map((tipoDia) => {
        const sumas = estado.sumasPorHora.filter((s) => s.tipoDia === tipoDia);
        const horasConError = sumas.filter((s) => !s.valido).length;
        const todasValidas = horasConError === 0 && sumas.length > 0;

        return (
          <div
            key={tipoDia}
            className={cn(
              "rounded-md border p-3 text-center",
              sumas.length === 0
                ? "border-border bg-muted/30"
                : todasValidas
                ? "border-yellow-200 bg-yellow-50"
                : "border-destructive/30 bg-destructive/5"
            )}
          >
            <p className="text-xs font-medium">{TIPO_DIA_LABEL[tipoDia]}</p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {sumas.length > 0 ? `${24 - horasConError}/24` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">horas OK</p>
            {horasConError > 0 && (
              <Badge variant="destructive" className="mt-1 text-[10px]">
                {horasConError} error{horasConError !== 1 ? "es" : ""}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface BarraValidacionProps {
  estado: EstadoValidacion;
  modo: "CONSTANTE" | "VARIABLE";
  className?: string;
}

export function BarraValidacion({ estado, modo, className }: BarraValidacionProps) {
  const maxErroresMostrados = 5;
  const erroresMostrados = estado.errores.slice(0, maxErroresMostrados);
  const erroresOcultos = estado.errores.length - maxErroresMostrados;

  // Modo CONSTANTE: mostrar indicador único
  if (modo === "CONSTANTE") {
    const sumaConstante = estado.sumasPorHora.find(
      (s) => s.tipoDia === "CONSTANTE"
    );

    return (
      <div className={cn("space-y-4", className)}>
        {sumaConstante && (
          <IndicadorSuma
            suma={sumaConstante.suma}
            valido={sumaConstante.valido}
            label="Suma total de coeficientes"
          />
        )}

        {estado.global ? (
          <Alert className="border-yellow-200 bg-yellow-50">
            <CheckCircle2 className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Reparto válido</AlertTitle>
            <AlertDescription className="text-yellow-700 text-xs">
              La suma de coeficientes es exactamente 1,000000. El fichero puede
              generarse.
            </AlertDescription>
          </Alert>
        ) : estado.errores.length > 0 ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {estado.errores.length} error{estado.errores.length !== 1 ? "es" : ""}
            </AlertTitle>
            <AlertDescription>
              <ul className="mt-1 space-y-0.5 text-xs">
                {erroresMostrados.map((err, i) => (
                  <li key={i}>• {err.mensaje}</li>
                ))}
                {erroresOcultos > 0 && (
                  <li className="text-muted-foreground">
                    ...y {erroresOcultos} más
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Introduce los coeficientes de cada participante
            </AlertDescription>
          </Alert>
        )}

        {estado.advertencias.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-800">Advertencias</p>
            <ul className="mt-1 space-y-0.5 text-xs text-amber-700">
              {estado.advertencias.map((adv, i) => (
                <li key={i}>• {adv}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Modo VARIABLE: mostrar tarjetas por tipo de día
  return (
    <div className={cn("space-y-4", className)}>
      <TarjetasTipoDia estado={estado} />

      {estado.global ? (
        <Alert className="border-yellow-200 bg-yellow-50">
          <CheckCircle2 className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Reparto válido</AlertTitle>
          <AlertDescription className="text-yellow-700 text-xs">
            Las 72 horas (3 tipos × 24h) suman exactamente 1,000000. El fichero
            puede generarse.
          </AlertDescription>
        </Alert>
      ) : estado.errores.length > 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {estado.errores.length} error{estado.errores.length !== 1 ? "es" : ""}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-0.5 text-xs">
              {erroresMostrados.map((err, i) => (
                <li key={i}>• {err.mensaje}</li>
              ))}
              {erroresOcultos > 0 && (
                <li>...y {erroresOcultos} más</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Introduce los coeficientes para cada tipo de día y hora
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
