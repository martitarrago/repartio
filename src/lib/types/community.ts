// Core domain types for SolShare Pro communities (mock-data layer)

export type ProjectPhase = "configuracion" | "vecinos" | "reparto" | "firmas" | "listo" | "enviado" | "activo";

export const PROJECT_PHASES: { id: ProjectPhase; label: string; step: number; desc: string }[] = [
  { id: "configuracion", label: "Configuración", step: 1, desc: "Datos de la comunidad e instalación" },
  { id: "vecinos", label: "Vecinos", step: 2, desc: "Añade los participantes y sus CUPS" },
  { id: "reparto", label: "Reparto", step: 3, desc: "Asigna los coeficientes β de reparto" },
  { id: "firmas", label: "Firmas", step: 4, desc: "Recoge las firmas de los participantes" },
  { id: "listo", label: "Listo", step: 5, desc: "Documentación completa, lista para enviar" },
  { id: "enviado", label: "Enviado", step: 6, desc: "Enviado a la distribuidora, pendiente de activación" },
  { id: "activo", label: "Activo", step: 7, desc: "Comunidad activa y en funcionamiento" },
];

export type Modality = "sin_excedentes" | "con_excedentes_sin_compensacion" | "con_excedentes_con_compensacion" | "compensacion";

export const MODALITIES: { id: Modality; label: string; description: string }[] = [
  { id: "sin_excedentes", label: "Sin excedentes", description: "Sin vertido a red" },
  { id: "con_excedentes_sin_compensacion", label: "Con excedentes sin compensación", description: "Vertido sin compensación económica" },
  { id: "con_excedentes_con_compensacion", label: "Con excedentes con compensación", description: "Vertido con compensación simplificada" },
  { id: "compensacion", label: "Compensación", description: "Mecanismo de compensación" },
];

export type ConnectionType = "red_interior" | "red_distribucion";

export const CONNECTION_TYPES: { id: ConnectionType; label: string }[] = [
  { id: "red_interior", label: "Conexión a red interior" },
  { id: "red_distribucion", label: "Conexión a red de distribución" },
];

export type ProximityCriteria = "mismo_edificio" | "misma_referencia_catastral" | "baja_tension_500m" | "baja_tension_2000m";

export const PROXIMITY_CRITERIA: { id: ProximityCriteria; label: string }[] = [
  { id: "mismo_edificio", label: "Mismo edificio" },
  { id: "misma_referencia_catastral", label: "Misma referencia catastral" },
  { id: "baja_tension_500m", label: "Red de baja tensión (500m)" },
  { id: "baja_tension_2000m", label: "Red de baja tensión (2000m)" },
];

export type Distribuidora = "iberdrola" | "endesa" | "ufd" | "otra";

export const DISTRIBUIDORAS: { id: Distribuidora; label: string; codes: string[] }[] = [
  { id: "endesa", label: "e-distribución (Endesa)", codes: ["0021", "0022", "0024"] },
  { id: "iberdrola", label: "i-DE (Iberdrola)", codes: ["0023", "0031"] },
  { id: "ufd", label: "UFD (Naturgy)", codes: ["0026", "0029"] },
  { id: "otra", label: "Otra / Desconocida", codes: [] },
];

export type CoeficientMode = "fixed" | "variable";
export type SuggestionMethod = "equal" | "quota" | "consumption" | "power" | "investment";

export const SUGGESTION_METHODS: { id: SuggestionMethod; label: string; description: string }[] = [
  { id: "equal", label: "Partes iguales", description: "Mismo porcentaje para todos" },
  { id: "quota", label: "Por cuota de participación", description: "Según coeficiente de propiedad" },
  { id: "consumption", label: "Por consumo histórico", description: "Proporcional al consumo anual" },
  { id: "power", label: "Por potencia contratada", description: "Según kW contratados" },
  { id: "investment", label: "Por inversión", description: "Según aportación económica" },
];

export type SignatureState = "signed" | "pending" | "rejected";

export interface Participant {
  id: string;
  name: string;
  cups: string;
  email: string;
  unit: string;
  beta: number;
  potenciaContratada?: number;
  consumoAnual?: number;
  inversionAportada?: number;
  cuotaParticipacion?: number;
  status: "active" | "pending" | "exited";
  signatureState: SignatureState;
  entryDate: string;
  exitDate?: string;
}

export interface Community {
  id: string;
  conjuntoId?: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  cif?: string;
  admin?: string;
  cau: string;
  distribuidora: Distribuidora;
  modality: Modality;
  connectionType: ConnectionType;
  proximity: ProximityCriteria;
  potenciaInstalada: number;
  numPaneles: number;
  participants: Participant[];
  coeficientMode: CoeficientMode;
  gestorEnabled: boolean;
  gestorName?: string;
  gestorNif?: string;
  phase: ProjectPhase;
  createdAt: string;
  documents: {
    acuerdo: boolean;
    txt: boolean;
    cie: boolean;
    gestor: boolean;
    cau: boolean;
  };
}

export interface ValidationIssue {
  type: "error" | "warning";
  message: string;
  action?: string;
  communityId?: string;
}

export interface BetaHistoryEntry {
  id: string;
  date: string;
  author: string;
  description: string;
  participants: { name: string; cups: string; beta: number }[];
}

export interface TxtGenerationResult {
  content: string;
  distribuidora: Distribuidora;
  cau: string;
  generatedAt: string;
  isValid: boolean;
  errors: string[];
}

export function validateCUPS(cups: string): { valid: boolean; error?: string } {
  if (!cups) return { valid: false, error: "CUPS obligatorio" };
  const clean = cups.replace(/\s/g, "").toUpperCase();
  if (clean.length !== 22) return { valid: false, error: `Debe tener 22 caracteres (tiene ${clean.length})` };
  if (!/^ES\d{16}[A-Z0-9]{2}[A-Z]{2}$/.test(clean)) return { valid: false, error: "Formato inválido. Ej: ES0021000000000001AA1P" };
  return { valid: true };
}

export function detectDistribuidora(cups: string): Distribuidora {
  if (!cups || cups.length < 6) return "otra";
  const code = cups.substring(2, 6);
  for (const d of DISTRIBUIDORAS) {
    if (d.codes.includes(code)) return d.id;
  }
  return "otra";
}

export function validateCAU(cau: string): { valid: boolean; error?: string } {
  if (!cau) return { valid: false, error: "CAU obligatorio" };
  const clean = cau.replace(/\s/g, "").toUpperCase();
  if (clean.length < 10) return { valid: false, error: "CAU demasiado corto" };
  return { valid: true };
}

export function validateAllocationSum(participants: Participant[]): { valid: boolean; sum: number; error?: string } {
  const active = participants.filter(p => p.status !== "exited");
  const sum = active.reduce((s, p) => s + p.beta, 0);
  const valid = Math.abs(sum - 1) < 0.000001;
  return { valid, sum, error: valid ? undefined : `La suma de coeficientes es ${sum.toFixed(6)}, debe ser 1.000000` };
}

export function validateProject(community: Community): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const active = community.participants.filter(p => p.status !== "exited");

  for (const p of active) {
    const v = validateCUPS(p.cups);
    if (!v.valid) issues.push({ type: "error", message: `CUPS inválido para ${p.name}: ${v.error}`, communityId: community.id });
  }

  const cupsList = active.map(p => p.cups);
  const dupes = cupsList.filter((c, i) => cupsList.indexOf(c) !== i);
  if (dupes.length > 0) issues.push({ type: "error", message: `CUPS duplicados: ${[...new Set(dupes)].join(", ")}`, communityId: community.id });

  const alloc = validateAllocationSum(community.participants);
  if (!alloc.valid) issues.push({ type: "error", message: alloc.error!, action: "Ajustar coeficientes", communityId: community.id });

  if (community.potenciaInstalada > 100 && community.modality === "sin_excedentes") {
    issues.push({ type: "warning", message: "Instalaciones >100kW suelen requerir modalidad con excedentes", communityId: community.id });
  }

  const pendingSigs = active.filter(p => p.signatureState === "pending").length;
  if (pendingSigs > 0) issues.push({ type: "warning", message: `${pendingSigs} firma(s) pendiente(s)`, action: "Solicitar firmas", communityId: community.id });

  const docs = community.documents;
  const missing = [];
  if (!docs.acuerdo) missing.push("Acuerdo de reparto");
  if (!docs.txt) missing.push("Fichero TXT");
  if (!docs.cie) missing.push("CIE");
  if (!docs.cau) missing.push("Certificado CAU");
  if (community.gestorEnabled && !docs.gestor) missing.push("Autorización gestor");
  if (missing.length > 0) issues.push({ type: "warning", message: `Documentos pendientes: ${missing.join(", ")}`, communityId: community.id });

  return issues;
}
