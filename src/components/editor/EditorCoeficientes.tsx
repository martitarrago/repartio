"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Eye,
  Loader2,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { descargarFicheroTxt } from "@/lib/generators/txtGenerator";
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
  const [generando, setGenerando] = useState(false);

  const { guardar, guardando, error: errorGuardado } = useEditorCoeficientes();

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

  async function handleGuardar() {
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
      onGuardado?.(id);
    }
  }

  function handleVistaPrevia() {
    const resultado = generarFicheroTxt({ modo, entradasConstantes, entradasVariables, anio, cau });
    setResultadoGeneracion(resultado);
    if (resultado.exito) setMostrarPrevia(true);
  }

  async function handleGenerarYDescargar() {
    setGenerando(true);
    setResultadoGeneracion(null);
    try {
      // 1. Auto-guardar si hay cambios o no existe el conjunto
      let idConjunto: string | undefined = conjuntoId;
      if (!idConjunto || tieneCambiosSinGuardar) {
        const nuevoId = await guardar({ instalacionId, conjuntoId, modo, entradasConstantes, entradasVariables });
        if (!nuevoId) return; // guardar ya pone el error
        idConjunto = nuevoId;
        setConjuntoId(nuevoId);
        setTieneCambiosSinGuardar(false);
        onGuardado?.(nuevoId);
      }

      // 2. Generar desde DB (guarda en HistorialFichero)
      const res = await fetch(
        `/api/installations/${instalacionId}/coefficients/${idConjunto}/generate`,
        { method: "POST" }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setResultadoGeneracion({ exito: false, error: body.message ?? "Error al generar" });
        return;
      }

      const { contenido, nombreFichero, totalLineas } = await res.json();

      // 3. Descargar en el navegador
      descargarFicheroTxt(contenido, nombreFichero);
      setResultadoGeneracion({ exito: true, contenido, nombreFichero, totalLineas });
    } finally {
      setGenerando(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  const puedeGenerar = estadoValidacion.global;

  return (
    <div className="space-y-6">
      {/* Barra superior: modo + acciones */}
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

        {/* Acciones */}
        {!soloLectura && (
          <div className="flex items-center gap-2">
            {tieneCambiosSinGuardar && (
              <span className="text-xs text-amber-600">Cambios sin guardar</span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleGuardar}
              disabled={guardando || generando}
            >
              {guardando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {guardando ? "Guardando..." : "Guardar"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleVistaPrevia}
              disabled={!puedeGenerar || guardando || generando}
            >
              <Eye className="mr-2 h-4 w-4" />
              Vista previa
            </Button>

            <Button
              size="sm"
              onClick={handleGenerarYDescargar}
              disabled={!puedeGenerar || guardando || generando}
            >
              {generando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {generando ? "Generando..." : "Descargar .txt"}
            </Button>
          </div>
        )}
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
