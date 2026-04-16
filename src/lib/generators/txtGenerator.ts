// ─────────────────────────────────────────────────────────────────────────────
// Generador de fichero .txt según Anejo I RD 244/2019 + Orden TED/1247/2021
// Formato: UTF-8 sin BOM, separador punto y coma, decimal coma, 6 decimales
// ─────────────────────────────────────────────────────────────────────────────

import type {
  EntradaConstante,
  EntradaVariable,
  ModoCoeficiente,
  ResultadoGeneracion,
  TipoDia,
} from "@/types/editor";
import { parsearValor } from "@/lib/validators/coeficientes";

// ─── Formato oficial ──────────────────────────────────────────────────────────

/** Formatea β: 6 decimales, coma decimal (nunca punto) */
export function formatearBeta(valor: number): string {
  return valor.toFixed(6).replace(".", ",");
}

/** Formatea β desde millonésimas (entero) → "0,333333" sin pasar por float */
function formatearBetaDesdeMillonesimas(millionths: number): string {
  const intPart = Math.floor(millionths / 1_000_000);
  const decPart = millionths % 1_000_000;
  return `${intPart},${Math.abs(decPart).toString().padStart(6, "0")}`;
}

/**
 * Formatea hora absoluta del año como 4 dígitos, 1-indexed (0001–8760).
 * horaAbs es 0-indexed (0–8759) → salida "0001"–"8760"
 */
export function formatearHora(horaAbs: number): string {
  return (horaAbs + 1).toString().padStart(4, "0");
}

/** Nombre del fichero según spec 2026: {CAU}_{AÑO}.txt */
export function getNombreFichero(anio: number, cau: string): string {
  return `${cau}_${anio}.txt`;
}

// ─── Algoritmo calendario español ────────────────────────────────────────────

/**
 * Algoritmo de Gauss para calcular el Domingo de Pascua
 * Devuelve un Date en UTC
 */
function calcularDomingoPascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anio, mes, dia));
}

/**
 * Genera el mapa de tipo de día para cada hora del año (0-8759).
 * Usa el calendario español oficial:
 * - Festivos fijos nacionales
 * - Viernes Santo (único festivo móvil según TED/1247/2021)
 * - Sábados
 * - Laborables (resto)
 */
function construirCalendario(anio: number): TipoDia[] {
  const calendar: TipoDia[] = new Array(8760).fill("LABORABLE");

  // Festivos fijos nacionales
  const festivosFijos: [number, number][] = [
    [0, 1],   // 1 enero — Año Nuevo
    [0, 6],   // 6 enero — Reyes
    [4, 1],   // 1 mayo — Trabajo
    [7, 15],  // 15 agosto — Asunción
    [9, 12],  // 12 octubre — Hispanidad
    [10, 1],  // 1 noviembre — Todos los Santos
    [10, 6],  // 6 noviembre — Constitución (día 6 dic puede caer distinto año)
    [11, 6],  // 6 diciembre — Constitución
    [11, 8],  // 8 diciembre — Inmaculada
    [11, 25], // 25 diciembre — Navidad
  ];

  // Viernes Santo
  const pascua = calcularDomingoPascua(anio);
  const viernesSanto = new Date(pascua);
  viernesSanto.setUTCDate(pascua.getUTCDate() - 2);

  const festivosSet = new Set<string>();

  // Añadir festivos fijos
  for (const [mes, dia] of festivosFijos) {
    festivosSet.add(`${mes}-${dia}`);
  }

  // Añadir Viernes Santo
  festivosSet.add(
    `${viernesSanto.getUTCMonth()}-${viernesSanto.getUTCDate()}`
  );

  // Recorrer las 8760 horas del año
  let horaAbsoluta = 0;
  for (let mes = 0; mes < 12; mes++) {
    const diasEnMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(Date.UTC(anio, mes, dia));
      const diaSemana = fecha.getUTCDay(); // 0=Dom, 6=Sab

      let tipo: TipoDia;
      if (festivosSet.has(`${mes}-${dia}`) || diaSemana === 0) {
        tipo = "FESTIVO";
      } else if (diaSemana === 6) {
        tipo = "SABADO";
      } else {
        tipo = "LABORABLE";
      }

      for (let h = 0; h < 24; h++) {
        if (horaAbsoluta < 8760) {
          calendar[horaAbsoluta] = tipo;
        }
        horaAbsoluta++;
      }
    }
  }

  return calendar;
}

// ─── Generación modo CONSTANTE ────────────────────────────────────────────────

export function generarContenidoConstante(
  entradas: EntradaConstante[]
): ResultadoGeneracion {
  try {
    // Convert to integer millionths for exact arithmetic
    const items: { cups: string; millionths: number }[] = [];
    for (const entrada of entradas) {
      const n = parsearValor(entrada.valor);
      if (n === null) {
        return {
          exito: false,
          error: `Valor inválido para ${entrada.cups}: "${entrada.valor}"`,
        };
      }
      items.push({ cups: entrada.cups, millionths: Math.round(n * 1_000_000) });
    }

    // Closure correction: adjust last participant so sum = exactly 1,000,000
    const sum = items.reduce((s, it) => s + it.millionths, 0);
    if (sum !== 1_000_000 && items.length > 0) {
      items[items.length - 1].millionths += 1_000_000 - sum;
    }

    const lineas = items.map(it =>
      `${it.cups};${formatearBetaDesdeMillonesimas(it.millionths)}`
    );

    const contenido = lineas.join("\n") + "\n";
    const encoder = new TextEncoder();
    const bytes = encoder.encode(contenido);

    return {
      exito: true,
      contenido,
      totalLineas: lineas.length,
      tamanoBytes: bytes.length,
    };
  } catch (err) {
    return {
      exito: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ─── Generación modo VARIABLE ─────────────────────────────────────────────────

export function generarContenidoVariable(
  entradas: EntradaVariable[],
  anio: number
): ResultadoGeneracion {
  try {
    const calendar = construirCalendario(anio);
    const lineas: string[] = new Array(8760 * entradas.length);
    let idx = 0;

    for (let horaAbs = 0; horaAbs < 8760; horaAbs++) {
      const tipoDia = calendar[horaAbs];
      const horaDia = horaAbs % 24;
      const horaStr = formatearHora(horaAbs);

      // Convert all participants for this hour to integer millionths
      const items: { cups: string; millionths: number }[] = [];
      for (const entrada of entradas) {
        const raw = entrada.matriz[tipoDia][horaDia];
        const n = parsearValor(raw);
        if (n === null) {
          return {
            exito: false,
            error: `Valor inválido para ${entrada.cups} — ${tipoDia} hora ${horaDia}: "${raw}"`,
          };
        }
        items.push({ cups: entrada.cups, millionths: Math.round(n * 1_000_000) });
      }

      // Closure correction per hour: adjust last participant so sum = 1,000,000
      const sum = items.reduce((s, it) => s + it.millionths, 0);
      if (sum !== 1_000_000 && items.length > 0) {
        items[items.length - 1].millionths += 1_000_000 - sum;
      }

      for (const it of items) {
        lineas[idx++] = `${it.cups};${horaStr};${formatearBetaDesdeMillonesimas(it.millionths)}`;
      }
    }

    const contenido = lineas.slice(0, idx).join("\n") + "\n";
    const encoder = new TextEncoder();
    const bytes = encoder.encode(contenido);

    return {
      exito: true,
      contenido,
      totalLineas: idx,
      tamanoBytes: bytes.length,
    };
  } catch (err) {
    return {
      exito: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

// ─── Función principal ────────────────────────────────────────────────────────

export function generarFicheroTxt(params: {
  modo: ModoCoeficiente;
  entradasConstantes?: EntradaConstante[];
  entradasVariables?: EntradaVariable[];
  anio: number;
  cau: string;
}): ResultadoGeneracion {
  const { modo, entradasConstantes, entradasVariables, anio, cau } = params;

  let resultado: ResultadoGeneracion;

  if (modo === "CONSTANTE") {
    if (!entradasConstantes || entradasConstantes.length === 0) {
      return { exito: false, error: "No hay entradas constantes" };
    }
    resultado = generarContenidoConstante(entradasConstantes);
  } else {
    if (!entradasVariables || entradasVariables.length === 0) {
      return { exito: false, error: "No hay entradas variables" };
    }
    resultado = generarContenidoVariable(entradasVariables, anio);
  }

  if (resultado.exito) {
    resultado.nombreFichero = getNombreFichero(anio, cau);
  }

  return resultado;
}

// ─── Descarga en navegador ────────────────────────────────────────────────────

/**
 * Descarga el fichero .txt en el navegador.
 * UTF-8 SIN BOM — requisito explícito del formato oficial.
 */
export function descargarFicheroTxt(
  contenido: string,
  nombreFichero: string
): void {
  // NO añadir BOM ('\uFEFF')
  const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreFichero;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Verificación de formato ──────────────────────────────────────────────────

export function verificarFormatoFichero(contenido: string): {
  valido: boolean;
  modo: ModoCoeficiente | null;
  totalLineas: number;
  errores: string[];
} {
  const errores: string[] = [];
  const lineas = contenido
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lineas.length === 0) {
    return { valido: false, modo: null, totalLineas: 0, errores: ["Fichero vacío"] };
  }

  const primeraLinea = lineas[0].split(";");
  let modo: ModoCoeficiente | null = null;

  if (primeraLinea.length === 2) {
    modo = "CONSTANTE";
  } else if (primeraLinea.length === 3) {
    modo = "VARIABLE";
  } else {
    errores.push(`Formato de primera línea incorrecto: "${lineas[0]}"`);
    return { valido: false, modo: null, totalLineas: lineas.length, errores };
  }

  // Verificar muestra de líneas
  const muestra = lineas.slice(0, Math.min(10, lineas.length));
  for (const [i, linea] of muestra.entries()) {
    const partes = linea.split(";");
    if (partes.length !== (modo === "CONSTANTE" ? 2 : 3)) {
      errores.push(`Línea ${i + 1}: número de columnas incorrecto`);
    }
  }

  return {
    valido: errores.length === 0,
    modo,
    totalLineas: lineas.length,
    errores,
  };
}

// ─── Parser de CSV horario ────────────────────────────────────────────────────

export function parsearCSVHorario(
  contenido: string,
  cupsEsperados: string[]
): import("@/types/editor").ResultadoImportCSV {
  const lineas = contenido
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const errores: Array<{ linea: number; mensaje: string }> = [];
  const datos: import("@/types/editor").FilaCSVParseada[] = [];

  const tiposDiaValidos = new Set(["LABORABLE", "SABADO", "FESTIVO"]);

  for (const [i, linea] of lineas.entries()) {
    const lineaNum = i + 1;
    const partes = linea.split(";");

    if (partes.length < 4) {
      errores.push({ linea: lineaNum, mensaje: "Formato incorrecto (esperado: CUPS;TIPO_DIA;HORA;VALOR)" });
      continue;
    }

    const [cups, tipoDiaRaw, horaRaw, valorRaw] = partes;

    if (!cupsEsperados.includes(cups.trim())) {
      errores.push({ linea: lineaNum, mensaje: `CUPS "${cups}" no pertenece a la instalación` });
      continue;
    }

    const tipoDia = tipoDiaRaw.trim().toUpperCase();
    if (!tiposDiaValidos.has(tipoDia)) {
      errores.push({ linea: lineaNum, mensaje: `Tipo de día "${tipoDiaRaw}" inválido` });
      continue;
    }

    const hora = parseInt(horaRaw.trim(), 10);
    if (isNaN(hora) || hora < 0 || hora > 23) {
      errores.push({ linea: lineaNum, mensaje: `Hora "${horaRaw}" inválida (0-23)` });
      continue;
    }

    const valor = parseFloat(valorRaw.trim().replace(",", "."));
    if (isNaN(valor) || valor < 0 || valor > 1) {
      errores.push({ linea: lineaNum, mensaje: `Valor "${valorRaw}" inválido` });
      continue;
    }

    datos.push({
      cups: cups.trim(),
      tipoDia: tipoDia as import("@/types/editor").TipoDia,
      hora,
      valor,
      lineaOriginal: lineaNum,
    });
  }

  return {
    exito: errores.length === 0,
    filasTotales: lineas.length,
    filasValidas: datos.length,
    filasError: errores.length,
    errores,
    datos,
  };
}
