/**
 * Seed script — inserta las comunidades de ejemplo en Supabase.
 * Uso: npm run db:seed
 *
 * Busca la primera organización existente y crea las comunidades bajo ella.
 * Idempotente: si el CAU ya existe, lo salta.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PARTICIPANTS_BASE = [
  { nombre: "María García López",   cups: "ES0021000000000001AA", email: "maria@email.com",   unidad: "1ºA", beta: 0.15 },
  { nombre: "Juan López Martín",    cups: "ES0021000000000002BB", email: "juan@email.com",    unidad: "1ºB", beta: 0.12 },
  { nombre: "Ana Martínez Ruiz",    cups: "ES0021000000000003CC", email: "ana@email.com",     unidad: "2ºA", beta: 0.10 },
  { nombre: "Carlos Ruiz Sánchez",  cups: "ES0021000000000004DD", email: "carlos@email.com",  unidad: "2ºB", beta: 0.18 },
  { nombre: "Laura Sánchez Díaz",   cups: "ES0021000000000005EE", email: "laura@email.com",   unidad: "3ºA", beta: 0.08 },
  { nombre: "Pedro Fernández Gil",  cups: "ES0021000000000006FF", email: "pedro@email.com",   unidad: "3ºB", beta: 0.14 },
  { nombre: "Isabel Moreno Vega",   cups: "ES0021000000000007GG", email: "isabel@email.com",  unidad: "4ºA", beta: 0.11 },
  { nombre: "David Jiménez Roca",   cups: "ES0021000000000008HH", email: "david@email.com",   unidad: "4ºB", beta: 0.12 },
];

// Ajustar betas para que sumen exactamente 1 en los subsets
function normalizeBetas(participants: typeof PARTICIPANTS_BASE) {
  const total = participants.reduce((s, p) => s + p.beta, 0);
  return participants.map((p, i) => ({
    ...p,
    beta: i === participants.length - 1
      ? Math.round((1 - participants.slice(0, -1).reduce((s, p2) => s + p2.beta / total, 0)) * 1e6) / 1e6
      : Math.round((p.beta / total) * 1e6) / 1e6,
  }));
}

const COMMUNITIES = [
  {
    nombre: "Residencial Aurora",
    cau: "ES2021000001290802ZA",
    anio: 2024,
    direccion: "Av. del Sol 42",
    municipio: "Madrid",
    codigoPostal: "28001",
    cif: "H12345678",
    administrador: "María García López",
    distribuidoraCode: "0021",
    modalidad: "COLECTIVO_CON_EXCEDENTES" as const,
    tipoRed: "INTERIOR" as const,
    tipoProximidad: "mismo_edificio",
    potenciaKw: 45,
    numPaneles: 120,
    fase: "ACTIVO" as const,
    gestorHabilitado: false,
    participantIndexes: [0, 1, 2, 3, 4, 5, 6, 7],
    signatureStates: ["FIRMADO", "FIRMADO", "FIRMADO", "FIRMADO", "FIRMADO", "FIRMADO", "FIRMADO", "FIRMADO"] as const,
  },
  {
    nombre: "Edificio Lumina",
    cau: "ES2021000002290802ZB",
    anio: 2024,
    direccion: "C/ Luna 15",
    municipio: "Barcelona",
    codigoPostal: "08001",
    cif: "H87654321",
    administrador: "Pedro Fernández Gil",
    distribuidoraCode: "0021",
    modalidad: "COLECTIVO_CON_EXCEDENTES" as const,
    tipoRed: "INTERIOR" as const,
    tipoProximidad: "mismo_edificio",
    potenciaKw: 30,
    numPaneles: 80,
    fase: "FIRMAS" as const,
    gestorHabilitado: true,
    gestorNombre: "SolarGest S.L.",
    gestorNif: "B12345678",
    participantIndexes: [0, 1, 2, 3, 4],
    signatureStates: ["FIRMADO", "FIRMADO", "PENDIENTE", "PENDIENTE", "PENDIENTE"] as const,
  },
  {
    nombre: "Torres del Parque",
    cau: "ES2021000003290802ZC",
    anio: 2024,
    direccion: "Pl. Verde 3",
    municipio: "Valencia",
    codigoPostal: "46001",
    cif: "H11223344",
    distribuidoraCode: "0026",
    modalidad: "COLECTIVO_SIN_EXCEDENTES" as const,
    tipoRed: "EXTERIOR_RED_DISTRIBUCION" as const,
    tipoProximidad: "baja_tension_500m",
    potenciaKw: 80,
    numPaneles: 200,
    fase: "REPARTO" as const,
    gestorHabilitado: false,
    participantIndexes: [0, 1, 2],
    signatureStates: ["PENDIENTE", "PENDIENTE", "PENDIENTE"] as const,
  },
  {
    nombre: "Polígono Solar Norte",
    cau: "ES2021000004290802ZD",
    anio: 2024,
    direccion: "C/ Industria 8",
    municipio: "Sevilla",
    codigoPostal: "41001",
    cif: "H99887766",
    distribuidoraCode: "0021",
    modalidad: "COLECTIVO_CON_EXCEDENTES" as const,
    tipoRed: "EXTERIOR_RED_DISTRIBUCION" as const,
    tipoProximidad: "baja_tension_2000m",
    potenciaKw: 150,
    numPaneles: 400,
    fase: "VECINOS" as const,
    gestorHabilitado: false,
    participantIndexes: [0, 1],
    signatureStates: ["PENDIENTE", "PENDIENTE"] as const,
  },
  {
    nombre: "Urbanización Las Encinas",
    cau: "ES2021000005290802ZE",
    anio: 2024,
    direccion: "Av. Encinas 12",
    municipio: "Málaga",
    codigoPostal: "29001",
    distribuidoraCode: "0021",
    modalidad: "COLECTIVO_CON_EXCEDENTES" as const,
    tipoRed: "INTERIOR" as const,
    tipoProximidad: "misma_referencia_catastral",
    potenciaKw: 60,
    numPaneles: 160,
    fase: "LISTO" as const,
    gestorHabilitado: false,
    participantIndexes: [0, 1, 2, 3, 4, 5],
    signatureStates: ["FIRMADO", "FIRMADO", "FIRMADO", "FIRMADO", "FIRMADO", "FIRMADO"] as const,
  },
];

async function main() {
  // Buscar la primera organización
  const org = await prisma.organizacion.findFirst();
  if (!org) {
    console.error("❌ No hay ninguna organización. Regístrate primero en la app.");
    process.exit(1);
  }

  const usuario = await prisma.usuario.findFirst({ where: { organizacionId: org.id } });
  if (!usuario) {
    console.error("❌ No hay ningún usuario en la organización.");
    process.exit(1);
  }

  console.log(`✓ Organización: ${org.nombre}`);
  console.log(`✓ Usuario: ${usuario.nombre}\n`);

  for (const c of COMMUNITIES) {
    // Idempotente: saltar si ya existe
    const exists = await prisma.instalacion.findFirst({
      where: { cau: c.cau, organizacionId: org.id },
    });
    if (exists) {
      console.log(`⏭  ${c.nombre} — ya existe, saltando`);
      continue;
    }

    const rawParticipants = c.participantIndexes.map(i => PARTICIPANTS_BASE[i]);
    const normalized = normalizeBetas(rawParticipants);

    const instalacion = await prisma.instalacion.create({
      data: {
        nombre: c.nombre,
        cau: c.cau,
        anio: c.anio,
        direccion: c.direccion,
        municipio: c.municipio,
        codigoPostal: c.codigoPostal,
        cif: c.cif ?? null,
        administrador: c.administrador ?? null,
        distribuidoraCode: c.distribuidoraCode,
        modalidad: c.modalidad,
        tipoRed: c.tipoRed,
        tipoProximidad: c.tipoProximidad,
        potenciaKw: c.potenciaKw,
        numPaneles: c.numPaneles,
        fase: c.fase,
        gestorHabilitado: c.gestorHabilitado,
        gestorNombre: (c as any).gestorNombre ?? null,
        gestorNif: (c as any).gestorNif ?? null,
        organizacionId: org.id,
        participantes: {
          create: normalized.map((p, idx) => ({
            nombre: p.nombre,
            cups: p.cups,
            email: p.email,
            unidad: p.unidad,
            orden: idx,
            estadoFirma: c.signatureStates[idx] as any,
            estadoParticipante: "ACTIVO" as const,
          })),
        },
      },
      include: { participantes: true },
    });

    // Crear conjunto de coeficientes PUBLICADO
    const conjunto = await prisma.conjuntoCoeficientes.create({
      data: {
        instalacionId: instalacion.id,
        creadoPorId: usuario.id,
        estado: "PUBLICADO",
        sumaValidada: true,
        nombre: "Reparto inicial",
      },
    });

    await prisma.entradaCoeficiente.createMany({
      data: instalacion.participantes.map((p, idx) => ({
        conjuntoId: conjunto.id,
        participanteId: p.id,
        valor: normalized[idx].beta,
      })),
    });

    console.log(`✅ ${c.nombre} — ${normalized.length} participantes`);
  }

  console.log("\n✓ Seed completado.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
