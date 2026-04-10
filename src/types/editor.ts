// ─────────────────────────────────────────────────────────────────────────────
// Tipos del editor de coeficientes β
// Real Decreto 244/2019, Anejo I — Orden TED/1247/2021
// ─────────────────────────────────────────────────────────────────────────────

export type ModoCoeficiente = "CONSTANTE" | "VARIABLE";

export type TipoDia = "LABORABLE" | "SABADO" | "FESTIVO";

export const TIPOS_DIA: TipoDia[] = ["LABORABLE", "SABADO", "FESTIVO"];

// ─── Participante ─────────────────────────────────────────────────────────────

export interface Participante {
  id: string;
  cups: string;       // 22 caracteres
  nombre: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
}

// ─── Modo CONSTANTE ───────────────────────────────────────────────────────────

export interface EntradaConstante {
  participanteId: string;
  cups: string;
  nombre: string;
  valor: string;      // string para permitir edición libre, se parsea al validar
  orden: number;
}

// ─── Modo VARIABLE ────────────────────────────────────────────────────────────

/** Mapa: tipoDia → hora (0-23) → valor string */
export type MatrizTipoDia = Record<TipoDia, string[]>;

export interface EntradaVariable {
  participanteId: string;
  cups: string;
  nombre: string;
  orden: number;
  /** 24 valores por tipo de día */
  matriz: MatrizTipoDia;
}

// ─── Validación ───────────────────────────────────────────────────────────────

export interface ResultadoSuma {
  tipoDia: TipoDia | "CONSTANTE";
  hora: number | null;
  suma: number;
  valido: boolean;
  diferencia: number;
}

export interface ErrorValidacion {
  campo: string;
  mensaje: string;
  participanteId?: string;
  tipoDia?: TipoDia;
  hora?: number;
}

export interface EstadoValidacion {
  global: boolean;
  errores: ErrorValidacion[];
  advertencias: string[];
  sumasPorHora: ResultadoSuma[];
  totalParticipantes: number;
}

// ─── Generación ───────────────────────────────────────────────────────────────

export interface ResultadoGeneracion {
  exito: boolean;
  contenido?: string;
  nombreFichero?: string;
  totalLineas?: number;
  tamanoBytes?: number;
  error?: string;
}

// ─── Importación CSV ─────────────────────────────────────────────────────────

export interface FilaCSVParseada {
  cups: string;
  tipoDia: TipoDia;
  hora: number;
  valor: number;
  lineaOriginal: number;
  error?: string;
}

export interface ResultadoImportCSV {
  exito: boolean;
  filasTotales: number;
  filasValidas: number;
  filasError: number;
  errores: Array<{ linea: number; mensaje: string }>;
  datos?: FilaCSVParseada[];
}

// ─── Props del editor ─────────────────────────────────────────────────────────

export interface EditorCoeficientesProps {
  instalacionId: string;
  conjuntoId?: string;
  anio: number;
  participantes: Participante[];
  entradasConstantesIniciales?: EntradaConstante[];
  entradasVariablesIniciales?: EntradaVariable[];
  modoInicial?: ModoCoeficiente;
  soloLectura?: boolean;
  onGuardado?: (conjuntoId: string) => void;
}

// ─── Helpers de inicialización ────────────────────────────────────────────────

export function crearMatrizVacia(): MatrizTipoDia {
  return {
    LABORABLE: Array(24).fill(""),
    SABADO: Array(24).fill(""),
    FESTIVO: Array(24).fill(""),
  };
}

export function inicializarEntradasConstantes(
  participantes: Participante[]
): EntradaConstante[] {
  return participantes
    .filter((p) => p.activo)
    .sort((a, b) => a.orden - b.orden)
    .map((p) => ({
      participanteId: p.id,
      cups: p.cups,
      nombre: p.nombre,
      valor: "",
      orden: p.orden,
    }));
}

export function inicializarEntradasVariables(
  participantes: Participante[]
): EntradaVariable[] {
  return participantes
    .filter((p) => p.activo)
    .sort((a, b) => a.orden - b.orden)
    .map((p) => ({
      participanteId: p.id,
      cups: p.cups,
      nombre: p.nombre,
      orden: p.orden,
      matriz: crearMatrizVacia(),
    }));
}

// ─── Tipos de instalación (para formularios) ─────────────────────────────────

export type ModalidadAutoconsumo =
  | "INDIVIDUAL_SIN_EXCEDENTES"
  | "INDIVIDUAL_CON_EXCEDENTES"
  | "COLECTIVO_SIN_EXCEDENTES"
  | "COLECTIVO_CON_EXCEDENTES"
  | "SERVICIOS_AUXILIARES";

export type TecnologiaGeneracion =
  | "FOTOVOLTAICA"
  | "EOLICA"
  | "HIDRAULICA"
  | "COGENERACION"
  | "BIOMASA"
  | "OTRAS";

export type EstadoInstalacion =
  | "BORRADOR"
  | "ACTIVA"
  | "SUSPENDIDA"
  | "BAJA";

export interface InstalacionResumen {
  id: string;
  nombre: string;
  cau: string;
  anio: number;
  modalidad: ModalidadAutoconsumo;
  tecnologia: TecnologiaGeneracion;
  estado: EstadoInstalacion;
  municipio?: string;
  provincia?: string;
  potenciaKw?: number;
  totalParticipantes: number;
  tieneConjuntoValidado: boolean;
  creadaEn: string;
  actualizadaEn: string;
}
