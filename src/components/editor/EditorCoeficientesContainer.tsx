"use client";

import { EditorCoeficientes } from "./EditorCoeficientes";
import { FadeIn } from "@/components/ui/motion";
import { FileX2 } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white/40 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileX2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="font-heading text-base font-semibold text-foreground">
          Sin participantes
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Añade participantes a la instalación para mostrar el editor de coeficientes.
        </p>
      </div>
    );
  }

  return (
    <FadeIn>
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
    </FadeIn>
  );
}
