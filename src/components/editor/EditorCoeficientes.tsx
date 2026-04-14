"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TablaConstante } from "./TablaConstante";
import { EditorHorario } from "./EditorHorario";
import { BarraValidacion } from "./BarraValidacion";
import { VistaPrevia } from "./VistaPrevia";
import { useEditorCoeficientes } from "@/hooks/useEditorCoeficientes";
import {
  validarEntradasConstantes,
  validarEntradasVariables,
} from "@/lib/validators/coeficientes";
import { generarFicheroTxt } from "@/lib/generators/txtGenerator";
import type {
  EditorCoeficientesProps,
  EntradaConstante,
  EntradaVariable,
  ModoCoeficiente,
  ResultadoGeneracion,
} from "@/types/editor";
import {
  inicializarEntradasConstantes,
  inicializarEntradasVariables,
} from "@/types/editor";

export function EditorCoeficientes({
  instalacionId,
  conjuntoId: conjuntoIdInicial,
  cau,
  anio,
  participantes,
  entradasConstantesIniciales,
  entradasVariablesIniciales,
  modoInicial = "CONSTANTE",
  soloLectura = false,
  onGuardado,
}: EditorCoeficientesProps) {
  // ─── Estado ────────────────────────────────────────────────────────────────
  const [modo, setModo] = useState<ModoCoeficiente>(modoInicial);
  const [entradasConstantes, setEntradasConstantes] = useState<EntradaConstante[]>(
    entradasConstantesIniciales ?? inicializarEntradasConstantes(participantes)
  );
  const [entradasVariables, setEntradasVariables] = useState<EntradaVariable[]>(
    entradasVariablesIniciales ?? inicializarEntradasVariables(participantes)
  );
  const [conjuntoId, setConjuntoId] = useState<string | undefined>(
    conjuntoIdInicial
  );
  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const [resultadoGeneracion, setResultadoGeneracion] =
    useState<ResultadoGeneracion | null>(null);
  const [tieneCambiosSinGuardar, setTieneCambiosSinGuardar] = useState(false);
  const [confirmarCambioModo, setConfirmarCambioModo] = useState(false);
  const [modoSolicitado, setModoSolicitado] = useState<ModoCoeficiente | null>(null);
  const [estadoGuardado, setEstadoGuardado] = useState<"idle" | "guardando" | "guardado">("idle");

  const { guardar, error: errorGuardado } = useEditorCoeficientes();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Auto-save con debounce ────────────────────────────────────────────────
  const doAutoSave = useCallback(async () => {
    if (soloLectura) return;
    setEstadoGuardado("guardando");
    const id = await guardar({
      instalacionId,
      conjuntoId,
      modo,
      entradasConstantes,
      entradasVariables,
    });
    if (id) {
      setConjuntoId(id);
      setTieneCambiosSinGuardar(false);
      setEstadoGuardado("guardado");
      onGuardado?.(id);
      setTimeout(() => setEstadoGuardado("idle"), 2000);
    } else {
      setEstadoGuardado("idle");
    }
  }, [instalacionId, conjuntoId, modo, entradasConstantes, entradasVariables, soloLectura, guardar, onGuardado]);

  useEffect(() => {
    if (!tieneCambiosSinGuardar || soloLectura) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      doAutoSave();
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [tieneCambiosSinGuardar, entradasConstantes, entradasVariables, modo, doAutoSave, soloLectura]);

  // ─── Validación reactiva ───────────────────────────────────────────────────
  const estadoValidacion = useMemo(() => {
    if (modo === "CONSTANTE") {
      return validarEntradasConstantes(entradasConstantes);
    }
    return validarEntradasVariables(entradasVariables);
  }, [modo, entradasConstantes, entradasVariables]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function solicitarCambioModo(nuevoModo: ModoCoeficiente) {
    if (nuevoModo === modo) return;
    if (tieneCambiosSinGuardar) {
      setModoSolicitado(nuevoModo);
      setConfirmarCambioModo(true);
    } else {
      aplicarCambioModo(nuevoModo);
    }
  }

  function aplicarCambioModo(nuevoModo: ModoCoeficiente) {
    setModo(nuevoModo);
    setTieneCambiosSinGuardar(false);
    setResultadoGeneracion(null);
    setConfirmarCambioModo(false);
    setModoSolicitado(null);
  }

  function handleActualizarConstantes(nuevasEntradas: EntradaConstante[]) {
    setEntradasConstantes(nuevasEntradas);
    setTieneCambiosSinGuardar(true);
    setResultadoGeneracion(null);
  }

  function handleActualizarVariables(nuevasEntradas: EntradaVariable[]) {
    setEntradasVariables(nuevasEntradas);
    setTieneCambiosSinGuardar(true);
    setResultadoGeneracion(null);
  }

  function handleVistaPrevia() {
    const resultado = generarFicheroTxt({ modo, entradasConstantes, entradasVariables, anio, cau });
    setResultadoGeneracion(resultado);
    if (resultado.exito) setMostrarPrevia(true);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  const puedeGenerar = estadoValidacion.global;

  return (
    <div className="space-y-6">
      {/* Barra superior: modo + estado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Toggle de modo */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-1">
          <button
            onClick={() => solicitarCambioModo("CONSTANTE")}
            disabled={soloLectura}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              modo === "CONSTANTE"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ToggleLeft className="h-4 w-4" />
            Constante
          </button>
          <button
            onClick={() => solicitarCambioModo("VARIABLE")}
            disabled={soloLectura}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              modo === "VARIABLE"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ToggleRight className="h-4 w-4" />
            Variable (8760h)
          </button>
        </div>

        {/* Estado de guardado + Vista previa */}
        <div className="flex items-center gap-3">
          {/* Indicador de estado */}
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            {estadoGuardado === "guardando" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Guardando...
              </>
            )}
            {estadoGuardado === "guardado" && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-yellow-600" />
                <span className="text-yellow-600">Guardado</span>
              </>
            )}
            {estadoGuardado === "idle" && tieneCambiosSinGuardar && (
              <span className="text-amber-600">Cambios sin guardar</span>
            )}
          </span>

          {!soloLectura && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleVistaPrevia}
              disabled={!puedeGenerar}
            >
              <Eye className="mr-2 h-4 w-4" />
              Vista previa
            </Button>
          )}
        </div>
      </div>

      {/* Descripción del modo */}
      <div className="rounded-md bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {modo === "CONSTANTE" ? (
          <p>
            <strong className="text-foreground">Modo constante:</strong> Un único
            coeficiente por participante, igual para todas las horas del año. La suma
            total debe ser exactamente 1,000000.
          </p>
        ) : (
          <p>
            <strong className="text-foreground">Modo variable:</strong> 24 coeficientes
            por tipo de día (Laborable, Sábado, Festivo). El sistema los expande
            automáticamente a las 8.760 horas del año usando el calendario oficial
            español con el algoritmo de Gauss para la Pascua.
          </p>
        )}
      </div>

      <Separator />

      {/* Error de guardado */}
      {errorGuardado && (
        <Alert variant="destructive">
          <AlertDescription>{errorGuardado}</AlertDescription>
        </Alert>
      )}

      {/* Layout: editor + validación lateral */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Editor principal */}
        <div>
          {modo === "CONSTANTE" ? (
            <TablaConstante
              entradas={entradasConstantes}
              onCambio={handleActualizarConstantes}
              errores={estadoValidacion.errores}
              soloLectura={soloLectura}
            />
          ) : (
            <EditorHorario
              entradas={entradasVariables}
              onCambio={handleActualizarVariables}
              errores={estadoValidacion.errores}
              soloLectura={soloLectura}
            />
          )}
        </div>

        {/* Panel de validación */}
        <div className="lg:border-l lg:pl-6">
          <BarraValidacion
            estado={estadoValidacion}
            modo={modo}
          />
        </div>
      </div>

      {/* Error de generación */}
      {resultadoGeneracion && !resultadoGeneracion.exito && (
        <Alert variant="destructive">
          <AlertDescription>
            Error al generar el fichero: {resultadoGeneracion.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Vista previa */}
      {mostrarPrevia &&
        resultadoGeneracion?.exito &&
        resultadoGeneracion.contenido && (
          <VistaPrevia
            abierta={mostrarPrevia}
            onCerrar={() => setMostrarPrevia(false)}
            contenido={resultadoGeneracion.contenido}
            nombreFichero={resultadoGeneracion.nombreFichero ?? "coeficientes.txt"}
            totalLineas={resultadoGeneracion.totalLineas ?? 0}
            tamanoBytes={resultadoGeneracion.tamanoBytes ?? 0}
            modo={modo}
            anio={anio}
          />
        )}

      {/* Diálogo de confirmación de cambio de modo */}
      <AlertDialog
        open={confirmarCambioModo}
        onOpenChange={(open) => !open && setConfirmarCambioModo(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar de modo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar en el modo{" "}
              <strong>{modo === "CONSTANTE" ? "Constante" : "Variable"}</strong>
              . Al cambiar de modo se mantendrán los datos actuales pero el
              contexto de validación cambiará. ¿Continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => modoSolicitado && aplicarCambioModo(modoSolicitado)}
            >
              Cambiar de modo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
