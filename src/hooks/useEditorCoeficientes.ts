"use client";

import { useTransition, useState } from "react";
import type {
  EntradaConstante,
  EntradaVariable,
  ModoCoeficiente,
} from "@/types/editor";

interface GuardarParams {
  instalacionId: string;
  conjuntoId?: string;
  modo: ModoCoeficiente;
  entradasConstantes?: EntradaConstante[];
  entradasVariables?: EntradaVariable[];
  invalidarFirmas?: boolean;
}

interface UseEditorCoeficientesResult {
  guardar: (params: GuardarParams) => Promise<string | null>;
  guardando: boolean;
  error: string | null;
  exito: boolean;
}

/**
 * Hook para persistir coeficientes en la base de datos via API.
 * Devuelve el conjuntoId creado/actualizado o null si hay error.
 */
export function useEditorCoeficientes(): UseEditorCoeficientesResult {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  async function guardar(params: GuardarParams): Promise<string | null> {
    setError(null);
    setExito(false);

    const { instalacionId, conjuntoId, modo, entradasConstantes, entradasVariables, invalidarFirmas } =
      params;

    const url = conjuntoId
      ? `/api/installations/${instalacionId}/coefficients/${conjuntoId}`
      : `/api/installations/${instalacionId}/coefficients`;

    const method = conjuntoId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo,
          entradas: modo === "CONSTANTE" ? entradasConstantes : entradasVariables,
          ...(invalidarFirmas ? { invalidarFirmas: true } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.message ?? `Error ${res.status} al guardar`;
        setError(msg);
        return null;
      }

      const body = await res.json();
      setExito(true);

      // Reset exito after 3s
      setTimeout(() => setExito(false), 3000);

      return body.id as string;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      setError(msg);
      return null;
    }
  }

  return {
    guardar,
    guardando: isPending,
    error,
    exito,
  };
}
