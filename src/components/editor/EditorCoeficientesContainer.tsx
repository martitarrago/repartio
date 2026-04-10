"use client";

import { EditorCoeficientes } from "./EditorCoeficientes";
import type { Participante } from "@/types/editor";
import {
  inicializarEntradasConstantes,
  inicializarEntradasVariables,
} from "@/types/editor";

interface EditorCoeficientesContainerProps {
  instalacionId: string;
  anio: number;
  participantes?: Participante[];
  conjuntoId?: string;
}

/**
 * Client wrapper que monta EditorCoeficientes con participantes de la instalación.
 * Recibe los datos como props desde el Server Component padre.
 */
export function EditorCoeficientesContainer({
  instalacionId,
  anio,
  participantes = [],
  conjuntoId,
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
      anio={anio}
      participantes={participantes}
      entradasConstantesIniciales={inicializarEntradasConstantes(participantes)}
      entradasVariablesIniciales={inicializarEntradasVariables(participantes)}
      modoInicial="CONSTANTE"
    />
  );
}
