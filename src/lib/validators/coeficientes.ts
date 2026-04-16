import { z } from "zod";
import type {
  EntradaConstante,
  EntradaVariable,
  ErrorValidacion,
  EstadoValidacion,
  ResultadoSuma,
  TipoDia,
} from "@/types/editor";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

export const TOLERANCIA_SUMA = 1e-6; // IEEE 754 safe tolerance
export const CUPS_LENGTH = 22;
export const VALOR_MIN = 0;
export const VALOR_MAX = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Esquemas Zod
// ─────────────────────────────────────────────────────────────────────────────

export const esquemaCUPS = z
  .string()
  .length(CUPS_LENGTH, `El CUPS debe tener exactamente ${CUPS_LENGTH} caracteres`)
  .regex(/^ES\d{16}[A-Z0-9]{4}$/i, "Formato CUPS inválido (ej: ES0000000000000000AA)");

export const esquemaValorCoeficiente = z
  .string()
  .min(1, "El valor es obligatorio")
  .refine((v) => {
    const n = parsearValor(v);
    return n !== null;
  }, "El valor debe ser un número válido (use coma o punto decimal)")
  .refine((v) => {
    const n = parsearValor(v);
    return n !== null && n >= VALOR_MIN && n <= VALOR_MAX;
  }, "El coeficiente debe estar entre 0 y 1");

export const esquemaEntradaConstante = z.object({
  participanteId: z.string().min(1),
  cups: esquemaCUPS,
  nombre: z.string().min(1, "El nombre es obligatorio"),
  valor: esquemaValorCoeficiente,
  orden: z.number().int().min(0),
});

export const esquemaFormConstante = z.object({
  entradas: z.array(esquemaEntradaConstante),
});

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de parseo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parsea un valor de coeficiente permitiendo tanto coma como punto decimal.
 * Retorna null si el valor no es un número válido.
 */
export function parsearValor(raw: string): number | null {
  if (!raw || raw.trim() === "") return null;
  const normalizado = raw.trim().replace(",", ".");
  const n = parseFloat(normalizado);
  if (isNaN(n)) return null;
  return n;
}

/**
 * Formatea un coeficiente β según el formato oficial:
 * 8 caracteres, 6 decimales, coma como separador decimal.
 * Ej: 0.333333 → "0,333333"
 */
export function formatearBeta(valor: number): string {
  return valor.toFixed(6).replace(".", ",");
}

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo de sumas
// ─────────────────────────────────────────────────────────────────────────────

export function calcularSuma(valores: string[]): number {
  // Sum in integer millionths to avoid IEEE 754 float accumulation errors
  let sumMillionths = 0;
  for (const v of valores) {
    const n = parsearValor(v);
    if (n !== null) {
      sumMillionths += Math.round(n * 1_000_000);
    }
  }
  return sumMillionths / 1_000_000;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validación modo CONSTANTE
// ─────────────────────────────────────────────────────────────────────────────

export function validarEntradasConstantes(
  entradas: EntradaConstante[]
): EstadoValidacion {
  const errores: ErrorValidacion[] = [];
  const advertencias: string[] = [];

  if (entradas.length === 0) {
    return {
      global: false,
      errores: [{ campo: "entradas", mensaje: "Debe haber al menos un participante" }],
      advertencias: [],
      sumasPorHora: [],
      totalParticipantes: 0,
    };
  }

  // Validar cada entrada individualmente
  for (const entrada of entradas) {
    const n = parsearValor(entrada.valor);

    if (n === null) {
      errores.push({
        campo: `valor-${entrada.participanteId}`,
        participanteId: entrada.participanteId,
        mensaje: `${entrada.nombre}: valor inválido "${entrada.valor}"`,
      });
      continue;
    }

    if (n < 0 || n > 1) {
      errores.push({
        campo: `valor-${entrada.participanteId}`,
        participanteId: entrada.participanteId,
        mensaje: `${entrada.nombre}: el coeficiente debe estar entre 0 y 1 (valor: ${n})`,
      });
    }

    if (n === 0) {
      advertencias.push(`${entrada.nombre}: coeficiente igual a 0`);
    }
  }

  // Calcular suma total
  const suma = calcularSuma(entradas.map((e) => e.valor));
  const diferencia = Math.abs(suma - 1);
  const sumaValida = diferencia <= TOLERANCIA_SUMA;

  const resultadoSuma: ResultadoSuma = {
    tipoDia: "CONSTANTE",
    hora: null,
    suma,
    valido: sumaValida,
    diferencia,
  };

  if (!sumaValida) {
    errores.push({
      campo: "suma",
      mensaje: `La suma de coeficientes es ${suma.toFixed(6)} (debe ser exactamente 1,000000). Diferencia: ${diferencia.toFixed(6)}`,
    });
  }

  const global = errores.length === 0;

  return {
    global,
    errores,
    advertencias,
    sumasPorHora: [resultadoSuma],
    totalParticipantes: entradas.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validación modo VARIABLE
// ─────────────────────────────────────────────────────────────────────────────

const TIPOS_DIA: TipoDia[] = ["LABORABLE", "SABADO", "FESTIVO"];

export function validarEntradasVariables(
  entradas: EntradaVariable[]
): EstadoValidacion {
  const errores: ErrorValidacion[] = [];
  const advertencias: string[] = [];
  const sumasPorHora: ResultadoSuma[] = [];

  if (entradas.length === 0) {
    return {
      global: false,
      errores: [{ campo: "entradas", mensaje: "Debe haber al menos un participante" }],
      advertencias: [],
      sumasPorHora: [],
      totalParticipantes: 0,
    };
  }

  for (const tipoDia of TIPOS_DIA) {
    for (let hora = 0; hora < 24; hora++) {
      const valores = entradas.map((e) => e.matriz[tipoDia][hora]);
      const todosVacios = valores.every((v) => !v || v.trim() === "");

      if (todosVacios) {
        errores.push({
          campo: `${tipoDia}-${hora}`,
          tipoDia,
          hora,
          mensaje: `${tipoDia} hora ${hora.toString().padStart(2, "0")}:00 — todos los valores están vacíos`,
        });
        sumasPorHora.push({
          tipoDia,
          hora,
          suma: 0,
          valido: false,
          diferencia: 1,
        });
        continue;
      }

      // Validar valores individuales
      for (const entrada of entradas) {
        const raw = entrada.matriz[tipoDia][hora];
        const n = parsearValor(raw);
        if (n === null && raw && raw.trim() !== "") {
          errores.push({
            campo: `${entrada.participanteId}-${tipoDia}-${hora}`,
            participanteId: entrada.participanteId,
            tipoDia,
            hora,
            mensaje: `${entrada.nombre} — ${tipoDia} hora ${hora}: valor inválido "${raw}"`,
          });
        }
      }

      const suma = calcularSuma(valores);
      const diferencia = Math.abs(suma - 1);
      const valido = diferencia <= TOLERANCIA_SUMA;

      sumasPorHora.push({ tipoDia, hora, suma, valido, diferencia });

      if (!valido) {
        errores.push({
          campo: `suma-${tipoDia}-${hora}`,
          tipoDia,
          hora,
          mensaje: `${tipoDia} hora ${hora.toString().padStart(2, "0")}:00 — suma ${suma.toFixed(6)} ≠ 1,000000`,
        });
      }
    }
  }

  const global = errores.length === 0;

  return {
    global,
    errores,
    advertencias,
    sumasPorHora,
    totalParticipantes: entradas.length,
  };
}
