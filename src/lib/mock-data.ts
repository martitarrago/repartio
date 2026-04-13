import { Community, Participant, BetaHistoryEntry } from "./types/community";

const mkParticipants = (subset?: number[]): Participant[] => {
  const all: Participant[] = [
    { id: "p1", name: "María García López", cups: "ES0021000000000001AAFP", email: "maria@email.com", unit: "1ºA", beta: 0.15, potenciaContratada: 4.6, consumoAnual: 3200, status: "active", signatureState: "signed", entryDate: "2025-01-15" },
    { id: "p2", name: "Juan López Martín", cups: "ES0021000000000002BBFP", email: "juan@email.com", unit: "1ºB", beta: 0.12, potenciaContratada: 3.45, consumoAnual: 2800, status: "active", signatureState: "signed", entryDate: "2025-01-15" },
    { id: "p3", name: "Ana Martínez Ruiz", cups: "ES0021000000000003CCFP", email: "ana@email.com", unit: "2ºA", beta: 0.10, potenciaContratada: 3.45, consumoAnual: 2100, status: "active", signatureState: "signed", entryDate: "2025-01-15" },
    { id: "p4", name: "Carlos Ruiz Sánchez", cups: "ES0021000000000004DDFP", email: "carlos@email.com", unit: "2ºB", beta: 0.18, potenciaContratada: 5.75, consumoAnual: 4500, status: "active", signatureState: "pending", entryDate: "2025-02-01" },
    { id: "p5", name: "Laura Sánchez Díaz", cups: "ES0021000000000005EEFP", email: "laura@email.com", unit: "3ºA", beta: 0.08, potenciaContratada: 3.45, consumoAnual: 1900, status: "pending", signatureState: "pending", entryDate: "2026-03-01" },
    { id: "p6", name: "Pedro Fernández Gil", cups: "ES0021000000000006FFFP", email: "pedro@email.com", unit: "3ºB", beta: 0.14, potenciaContratada: 4.6, consumoAnual: 3100, status: "active", signatureState: "signed", entryDate: "2025-01-15" },
    { id: "p7", name: "Isabel Moreno Vega", cups: "ES0021000000000007GGFP", email: "isabel@email.com", unit: "4ºA", beta: 0.11, potenciaContratada: 3.45, consumoAnual: 2400, status: "active", signatureState: "rejected", entryDate: "2025-01-15" },
    { id: "p8", name: "David Jiménez Roca", cups: "ES0021000000000008HHFP", email: "david@email.com", unit: "4ºB", beta: 0.12, potenciaContratada: 4.6, consumoAnual: 2900, status: "active", signatureState: "signed", entryDate: "2025-01-15" },
  ];
  return subset ? subset.map(i => all[i]) : all;
};

export const mockCommunities: Community[] = [
  {
    id: "1", name: "Residencial Aurora", address: "Av. del Sol 42", city: "Madrid",
    postalCode: "28001", cif: "H12345678", admin: "María García López",
    cau: "CAU-2024-001-MADRID", distribuidora: "endesa",
    modality: "con_excedentes_con_compensacion", connectionType: "red_interior", proximity: "mismo_edificio",
    potenciaInstalada: 45, numPaneles: 120,
    participants: mkParticipants(),
    coeficientMode: "fixed", gestorEnabled: false,
    phase: "activo", createdAt: "2025-01-15",
    documents: { acuerdo: true, txt: true, cie: true, gestor: false, cau: true },
  },
  {
    id: "2", name: "Edificio Lumina", address: "C/ Luna 15", city: "Barcelona",
    postalCode: "08001", cif: "H87654321", admin: "Pedro Fernández Gil",
    cau: "CAU-2024-002-BCN", distribuidora: "endesa",
    modality: "con_excedentes_con_compensacion", connectionType: "red_interior", proximity: "mismo_edificio",
    potenciaInstalada: 30, numPaneles: 80,
    participants: mkParticipants([0, 1, 2, 3, 4]),
    coeficientMode: "fixed", gestorEnabled: true, gestorName: "SolarGest S.L.", gestorNif: "B12345678",
    phase: "firmas", createdAt: "2025-03-01",
    documents: { acuerdo: true, txt: true, cie: false, gestor: true, cau: true },
  },
  {
    id: "3", name: "Torres del Parque", address: "Pl. Verde 3", city: "Valencia",
    postalCode: "46001", cif: "H11223344",
    cau: "CAU-2024-003-VLC", distribuidora: "ufd",
    modality: "sin_excedentes", connectionType: "red_distribucion", proximity: "baja_tension_500m",
    potenciaInstalada: 80, numPaneles: 200,
    participants: mkParticipants([0, 1, 2]),
    coeficientMode: "variable", gestorEnabled: false,
    phase: "reparto", createdAt: "2026-01-10",
    documents: { acuerdo: false, txt: false, cie: false, gestor: false, cau: true },
  },
  {
    id: "4", name: "Polígono Solar Norte", address: "C/ Industria 8", city: "Sevilla",
    postalCode: "41001", cif: "H99887766",
    cau: "CAU-2024-004-SVQ", distribuidora: "endesa",
    modality: "con_excedentes_sin_compensacion", connectionType: "red_distribucion", proximity: "baja_tension_2000m",
    potenciaInstalada: 150, numPaneles: 400,
    participants: mkParticipants([0, 1]),
    coeficientMode: "fixed", gestorEnabled: false,
    phase: "vecinos", createdAt: "2026-02-20",
    documents: { acuerdo: false, txt: false, cie: false, gestor: false, cau: false },
  },
  {
    id: "5", name: "Urbanización Las Encinas", address: "Av. Encinas 12", city: "Málaga",
    postalCode: "29001",
    cau: "CAU-2024-005-AGP", distribuidora: "endesa",
    modality: "con_excedentes_con_compensacion", connectionType: "red_interior", proximity: "misma_referencia_catastral",
    potenciaInstalada: 60, numPaneles: 160,
    participants: mkParticipants([0, 1, 2, 3, 4, 5]),
    coeficientMode: "fixed", gestorEnabled: false,
    phase: "listo", createdAt: "2025-06-01",
    documents: { acuerdo: true, txt: true, cie: true, gestor: false, cau: true },
  },
];

export const mockBetaHistory: BetaHistoryEntry[] = [
  {
    id: "h1", date: "2026-03-15", author: "María García López", description: "Reparto actualizado — Carlos Ruiz aumenta cuota",
    participants: mkParticipants().map(p => ({ name: p.name, cups: p.cups, beta: p.beta })),
  },
  {
    id: "h2", date: "2025-06-01", author: "Sistema", description: "Reparto inicial tras alta de la instalación",
    participants: mkParticipants().map(p => ({ name: p.name, cups: p.cups, beta: p.beta * 0.95 })),
  },
];
