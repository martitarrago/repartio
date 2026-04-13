import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ── helpers ──────────────────────────────────────────────────────────────────

function detectDistribuidoraCode(cups: string): string | null {
  if (!cups || cups.length < 6) return null;
  return cups.substring(2, 6);
}

function mapFase(fase: string): string {
  return fase.toLowerCase();
}

function mapModality(modalidad: string): string {
  const map: Record<string, string> = {
    COLECTIVO_SIN_EXCEDENTES: "sin_excedentes",
    COLECTIVO_CON_EXCEDENTES: "con_excedentes_con_compensacion",
    INDIVIDUAL_SIN_EXCEDENTES: "sin_excedentes",
    INDIVIDUAL_CON_EXCEDENTES: "con_excedentes_sin_compensacion",
    SERVICIOS_AUXILIARES: "sin_excedentes",
  };
  return map[modalidad] ?? "con_excedentes_con_compensacion";
}

function mapTipoRed(tipoRed: string): string {
  return tipoRed === "INTERIOR" ? "red_interior" : "red_distribucion";
}

function mapEstadoFirma(estado: string): "signed" | "pending" | "rejected" {
  if (estado === "FIRMADO") return "signed";
  if (estado === "RECHAZADO") return "rejected";
  return "pending";
}

function mapEstadoParticipante(estado: string): "active" | "pending" | "exited" {
  if (estado === "BAJA") return "exited";
  if (estado === "PENDIENTE_ALTA") return "pending";
  return "active";
}

function buildDocuments(docs: { tipo: string }[]) {
  const tipos = new Set(docs.map(d => d.tipo));
  return {
    acuerdo: tipos.has("ACUERDO_REPARTO"),
    txt: tipos.has("TXT_DISTRIBUIDOR"),
    cie: tipos.has("CIE"),
    gestor: tipos.has("AUTORIZACION_GESTOR"),
    cau: tipos.has("CERTIFICADO_CAU"),
  };
}

function toApiCommunity(i: any, betaMap: Record<string, number>) {
  const distribuidoraCode = i.distribuidoraCode ??
    (i.participantes[0]?.cups ? detectDistribuidoraCode(i.participantes[0].cups) : null);

  const distribuidoraMap: Record<string, string> = {
    "0021": "endesa", "0022": "endesa", "0024": "endesa",
    "0023": "iberdrola", "0031": "iberdrola",
    "0026": "ufd", "0029": "ufd",
  };

  return {
    id: i.id,
    conjuntoId: null as string | null,
    name: i.nombre,
    address: i.direccion ?? "",
    city: i.municipio ?? "",
    postalCode: i.codigoPostal ?? "",
    cif: i.cif ?? undefined,
    admin: i.administrador ?? undefined,
    cau: i.cau,
    distribuidora: distribuidoraMap[distribuidoraCode ?? ""] ?? "otra",
    modality: mapModality(i.modalidad),
    connectionType: mapTipoRed(i.tipoRed),
    proximity: i.tipoProximidad ?? "mismo_edificio",
    potenciaInstalada: Number(i.potenciaKw ?? 0),
    numPaneles: i.numPaneles ?? 0,
    coeficientMode: "fixed" as "fixed" | "variable",
    gestorEnabled: i.gestorHabilitado,
    gestorName: i.gestorNombre ?? undefined,
    gestorNif: i.gestorNif ?? undefined,
    phase: mapFase(i.fase),
    createdAt: i.creadaEn.toISOString(),
    documents: buildDocuments(i.documentos ?? []),
    participants: (i.participantes ?? []).map((p: any) => ({
      id: p.id,
      name: p.nombre,
      cups: p.cups,
      email: p.email ?? "",
      unit: p.unidad ?? p.descripcion ?? "",
      beta: betaMap[p.id] ?? 0,
      status: mapEstadoParticipante(p.estadoParticipante),
      signatureState: mapEstadoFirma(p.estadoFirma),
      entryDate: p.fechaAlta.toISOString().slice(0, 10),
      exitDate: p.fechaBaja?.toISOString().slice(0, 10),
    })),
  };
}

async function getConjuntoData(instalacionId: string): Promise<{ betaMap: Record<string, number>; conjuntoId: string | null; modo: string }> {
  const conjunto = await prisma.conjuntoCoeficientes.findFirst({
    where: { instalacionId, estado: { in: ["PUBLICADO", "VALIDADO", "BORRADOR"] } },
    orderBy: { version: "desc" },
    include: { entradas: { where: { hora: null, tipoDia: null } } },
  });
  if (!conjunto) return { betaMap: {}, conjuntoId: null, modo: "CONSTANTE" };
  const betaMap: Record<string, number> = {};
  for (const e of conjunto.entradas) {
    betaMap[e.participanteId] = Number(e.valor);
  }
  return { betaMap, conjuntoId: conjunto.id, modo: conjunto.modo };
}

// ── GET /api/communities ──────────────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;

  const instalaciones = await prisma.instalacion.findMany({
    where: { organizacionId },
    include: {
      participantes: { where: { activo: true }, orderBy: { orden: "asc" } },
      documentos: { select: { tipo: true } },
    },
    orderBy: { actualizadaEn: "desc" },
  });

  const communities = await Promise.all(
    instalaciones.map(async (i) => {
      const { betaMap, conjuntoId, modo } = await getConjuntoData(i.id);
      const c = toApiCommunity(i, betaMap);
      c.coeficientMode = modo === "VARIABLE" ? "variable" : "fixed";
      c.conjuntoId = conjuntoId;
      return c;
    })
  );

  return NextResponse.json(communities);
}

// ── POST /api/communities ─────────────────────────────────────────────────────

const crearSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(2).max(200),
  city: z.string().min(2).max(100),
  postalCode: z.string().regex(/^\d{5}$/),
  cif: z.string().optional(),
  admin: z.string().optional(),
  cau: z.string().min(10).max(30),
  power: z.number().positive(),
  modality: z.enum(["sin_excedentes", "con_excedentes_sin_compensacion", "con_excedentes_con_compensacion", "compensacion"]),
  participants: z.array(z.object({
    name: z.string().min(1),
    cups: z.string().length(22),
    email: z.string().email().optional().or(z.literal("")),
    unit: z.string().optional(),
    beta: z.number().min(0).max(1),
  })).optional(),
});

const modalidadMap: Record<string, any> = {
  sin_excedentes: "COLECTIVO_SIN_EXCEDENTES",
  con_excedentes_sin_compensacion: "COLECTIVO_CON_EXCEDENTES",
  con_excedentes_con_compensacion: "COLECTIVO_CON_EXCEDENTES",
  compensacion: "COLECTIVO_CON_EXCEDENTES",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Cuerpo inválido" }, { status: 400 });

  const parsed = crearSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const { name, address, city, postalCode, cif, admin, cau, power, modality, participants } = parsed.data;

  // Detectar distribuidora del primer CUPS
  const firstCups = participants?.[0]?.cups;
  const distribuidoraCode = firstCups ? detectDistribuidoraCode(firstCups) : null;

  try {
    const instalacion = await prisma.instalacion.create({
      data: {
        nombre: name,
        direccion: address,
        municipio: city,
        codigoPostal: postalCode,
        cif: cif || null,
        administrador: admin || null,
        cau: cau.toUpperCase(),
        anio: new Date().getFullYear(),
        potenciaKw: power,
        modalidad: modalidadMap[modality],
        distribuidoraCode,
        organizacionId,
        fase: "VECINOS",
        participantes: participants?.length ? {
          create: participants.map((p, idx) => ({
            nombre: p.name,
            cups: p.cups.toUpperCase(),
            email: p.email || null,
            unidad: p.unit || null,
            orden: idx,
          })),
        } : undefined,
      },
      include: { participantes: true },
    });

    // Si hay participantes con betas, crear conjunto de coeficientes
    if (participants?.length && participants.some(p => p.beta > 0)) {
      const conjunto = await prisma.conjuntoCoeficientes.create({
        data: {
          instalacionId: instalacion.id,
          creadoPorId: session.user!.id!,
          estado: "BORRADOR",
        },
      });
      await prisma.entradaCoeficiente.createMany({
        data: instalacion.participantes.map((p, idx) => ({
          conjuntoId: conjunto.id,
          participanteId: p.id,
          valor: participants[idx]?.beta ?? 0,
        })),
      });
    }

    return NextResponse.json({ id: instalacion.id }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ message: "Ya existe una comunidad con ese CAU" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
