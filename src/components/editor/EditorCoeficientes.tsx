"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileEdit,
  Loader2,
  ShieldAlert,
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
  firmadosCount = 0,
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
  const [confirmarInvalidar, setConfirmarInvalidar] = useState(false);

  const hayFirmas = firmadosCount > 0;

  const { guardar, error: errorGuardado } = useEditorCoeficientes();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Auto-save con debounce (solo cuando no hay firmas) ───────────────────
  const doGuardar = useCallback(async (invalidarFirmas = false) => {
    if (soloLectura) return null;
    setEstadoGuardado("guardando");
    const id = await guardar({
      instalacionId,
      conjuntoId,
      modo,
      entradasConstantes,
      entradasVariables,
      invalidarFirmas,
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
    return id;
  }, [instalacionId, conjuntoId, modo, entradasConstantes, entradasVariables, soloLectura, guardar, onGuardado]);

  useEffect(() => {
    // Auto-save desactivado cuando hay participantes firmados
    if (!tieneCambiosSinGuardar || soloLectura || hayFirmas) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      doGuardar();
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [tieneCambiosSinGuardar, entradasConstantes, entradasVariables, modo, doGuardar, soloLectura, hayFirmas]);

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

  async function handleGuardarBorrador() {
    await doGuardar(false);
  }

  function handleGuardarAplicar() {
    if (hayFirmas) {
      setConfirmarInvalidar(true);
    } else {
      doGuardar(false);
    }
  }

  async function handleConfirmarInvalidar() {
    setConfirmarInvalidar(false);
    await doGuardar(true);
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
      {/* Banner de advertencia — solo cuando hay firmas */}
      {hayFirmas && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">
              Documento firmado por {firmadosCount} participante{firmadosCount !== 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-amber-700">
              Modificar los coeficientes invalidará el acuerdo de reparto firmado. Usa{" "}
              <strong>Guardar borrador</strong> para trabajar sin comprometerte, o{" "}
              <strong>Guardar y aplicar</strong> para publicar los nuevos valores (requiere
              nueva ronda de firmas).
            </p>
          </div>
        </div>
      )}

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

        {/* Estado de guardado + botones */}
        <div className="flex items-center gap-2">
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
            {estadoGuardado === "idle" && tieneCambiosSinGuardar && !hayFirmas && (
              <span className="text-amber-600">Cambios sin guardar</span>
            )}
          </span>

          {!soloLectura && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleVistaPrevia}
                disabled={!puedeGenerar}
              >
                <Eye className="mr-2 h-4 w-4" />
                Vista previa
              </Button>

              {/* Botones explícitos de guardado — siempre visibles cuando hay firmas */}
              {hayFirmas && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGuardarBorrador}
                    disabled={estadoGuardado === "guardando" || !tieneCambiosSinGuardar}
                  >
                    <FileEdit className="mr-2 h-3.5 w-3.5" />
                    Guardar borrador
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleGuardarAplicar}
                    disabled={estadoGuardado === "guardando"}
                    className="border border-amber-400 bg-amber-500 text-white hover:bg-amber-600"
                  >
                    <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                    Guardar y aplicar
                  </Button>
                </>
              )}
            </>
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

      {/* Diálogo de confirmación — invalidar firmas */}
      <AlertDialog
        open={confirmarInvalidar}
        onOpenChange={(open) => !open && setConfirmarInvalidar(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Esto invalidará los documentos firmados
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{firmadosCount} participante{firmadosCount !== 1 ? "s" : ""}</strong>{" "}
                  {firmadosCount !== 1 ? "han" : "ha"} firmado el documento de reparto
                  actual. Si guardas estos nuevos coeficientes:
                </p>
                <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                  <li>El acuerdo firmado quedará invalidado.</li>
                  <li>
                    Las firmas existentes se marcarán como <strong>pendientes</strong>.
                  </li>
                  <li>Tendrás que enviar una nueva solicitud de firmas.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarInvalidar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Entiendo, guardar y aplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
