"use client";

import { EditorCoeficientes } from "./EditorCoeficientes";
import type {
  Participante,
  EntradaConstante,
  EntradaVariable,
  ModoCoeficiente,
} from "@/types/editor";
import {
  inicializarEntradasConstantes,
  inicializarEntradasVariables,
} from "@/types/editor";

interface EditorCoeficientesContainerProps {
  instalacionId: string;
  cau: string;
  anio: number;
  participantes?: Participante[];
  conjuntoId?: string;
  modoInicial?: ModoCoeficiente;
  entradasConstantesIniciales?: EntradaConstante[];
  entradasVariablesIniciales?: EntradaVariable[];
}

/**
 * Client wrapper que monta EditorCoeficientes con participantes de la instalación.
 * Si hay entradas guardadas en DB, las recibe como props para pre-rellenar el editor.
 */
export function EditorCoeficientesContainer({
  instalacionId,
  cau,
  anio,
  participantes = [],
  conjuntoId,
  modoInicial = "CONSTANTE",
  entradasConstantesIniciales,
  entradasVariablesIniciales,
}: EditorCoeficientesContainerProps) {
  if (participantes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
        <p>No hay participantes para mostrar el editor.</p>
      </div>
    );
  }

  return (
    <EditorCoeficientes
      instalacionId={instalacionId}
      conjuntoId={conjuntoId}
      cau={cau}
      anio={anio}
      participantes={participantes}
      entradasConstantesIniciales={
        entradasConstantesIniciales?.length
          ? entradasConstantesIniciales
          : inicializarEntradasConstantes(participantes)
      }
      entradasVariablesIniciales={
        entradasVariablesIniciales?.length
          ? entradasVariablesIniciales
          : inicializarEntradasVariables(participantes)
      }
      modoInicial={modoInicial}
    />
  );
}
