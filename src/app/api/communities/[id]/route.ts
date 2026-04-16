import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ── helpers (duplicados del route padre para no crear un shared file aún) ────

function detectDistribuidoraCode(cups: string): string | null {
  if (!cups || cups.length < 6) return null;
  return cups.substring(2, 6);
}

function mapFase(fase: string): string { return fase.toLowerCase(); }

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

// ── GET /api/communities/[id] ─────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id } = await params;

  const i = await prisma.instalacion.findFirst({
    where: { id, organizacionId },
    include: {
      participantes: { where: { activo: true }, orderBy: { orden: "asc" } },
      documentos: true,
      conjuntos: {
        where: { estado: { in: ["PUBLICADO", "VALIDADO", "BORRADOR"] } },
        orderBy: { version: "desc" },
        take: 1,
        include: { entradas: { where: { hora: null, tipoDia: null } } },
      },
    },
  });

  if (!i) {
    return NextResponse.json({ message: "Comunidad no encontrada" }, { status: 404 });
  }

  // Construir betaMap desde el conjunto activo
  const betaMap: Record<string, number> = {};
  const activeConjuntoId = i.conjuntos[0]?.id ?? null;
  if (i.conjuntos[0]) {
    for (const e of i.conjuntos[0].entradas) {
      betaMap[e.participanteId] = Number(e.valor);
    }
  }

  // Lazy backfill: participantes FIRMADO con conjuntoFirmadoId=null → asignar conjunto activo
  if (activeConjuntoId) {
    const needsBackfill = i.participantes.filter(
      p => p.estadoFirma === "FIRMADO" && !p.conjuntoFirmadoId
    );
    if (needsBackfill.length > 0) {
      await prisma.participante.updateMany({
        where: { id: { in: needsBackfill.map(p => p.id) } },
        data: { conjuntoFirmadoId: activeConjuntoId },
      });
      // Update in-memory so the response is correct
      for (const p of needsBackfill) {
        p.conjuntoFirmadoId = activeConjuntoId;
      }
    }
  }

  const distribuidoraCode = i.distribuidoraCode ??
    (i.participantes[0]?.cups ? detectDistribuidoraCode(i.participantes[0].cups) : null);

  const distribuidoraMap: Record<string, string> = {
    "0021": "endesa", "0022": "endesa", "0024": "endesa",
    "0023": "iberdrola", "0031": "iberdrola",
    "0026": "ufd", "0029": "ufd",
  };

  const coefMode = i.conjuntos[0]?.modo === "VARIABLE" ? "variable" : "fixed";

  const community = {
    id: i.id,
    conjuntoId: i.conjuntos[0]?.id ?? null,
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
    coeficientMode: coefMode,
    gestorEnabled: i.gestorHabilitado,
    gestorName: i.gestorNombre ?? undefined,
    gestorNif: i.gestorNif ?? undefined,
    phase: mapFase(i.fase),
    createdAt: i.creadaEn.toISOString(),
    documents: buildDocuments(i.documentos),
    participants: i.participantes.map((p) => ({
      id: p.id,
      name: p.nombre,
      cups: p.cups,
      email: p.email ?? "",
      unit: p.unidad ?? p.descripcion ?? "",
      beta: betaMap[p.id] ?? 0,
      status: mapEstadoParticipante(p.estadoParticipante),
      signatureState: mapEstadoFirma(p.estadoFirma),
      conjuntoFirmadoId: p.conjuntoFirmadoId ?? undefined,
      entryDate: p.fechaAlta.toISOString().slice(0, 10),
      exitDate: p.fechaBaja?.toISOString().slice(0, 10),
    })),
  };

  return NextResponse.json(community);
}

// ── PATCH /api/communities/[id] ───────────────────────────────────────────────

const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().regex(/^\d{5}$/).optional(),
  cif: z.string().optional(),
  admin: z.string().optional(),
  cau: z.string().min(10).max(30).optional(),
  power: z.number().positive().optional(),
  modality: z.enum(["sin_excedentes", "con_excedentes_sin_compensacion", "con_excedentes_con_compensacion", "compensacion"]).optional(),
  connectionType: z.enum(["red_interior", "red_distribucion"]).optional(),
  proximity: z.string().optional(),
  numPaneles: z.number().int().positive().optional(),
  fase: z.enum(["configuracion", "vecinos", "reparto", "firmas", "listo", "enviado", "activo"]).optional(),
  gestorEnabled: z.boolean().optional(),
  gestorName: z.string().optional(),
  gestorNif: z.string().optional(),
});

const modalidadMap: Record<string, any> = {
  sin_excedentes: "COLECTIVO_SIN_EXCEDENTES",
  con_excedentes_sin_compensacion: "COLECTIVO_CON_EXCEDENTES",
  con_excedentes_con_compensacion: "COLECTIVO_CON_EXCEDENTES",
  compensacion: "COLECTIVO_CON_EXCEDENTES",
};

const tipoRedMap: Record<string, any> = {
  red_interior: "INTERIOR",
  red_distribucion: "EXTERIOR_RED_DISTRIBUCION",
};

const faseMap: Record<string, any> = {
  configuracion: "CONFIGURACION", vecinos: "VECINOS", reparto: "REPARTO",
  firmas: "FIRMAS", listo: "LISTO", enviado: "ENVIADO", activo: "ACTIVO",
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id } = await params;

  const existente = await prisma.instalacion.findFirst({ where: { id, organizacionId } });
  if (!existente) {
    return NextResponse.json({ message: "Comunidad no encontrada" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Cuerpo inválido" }, { status: 400 });

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const data: Record<string, any> = {};

  if (d.name !== undefined) data.nombre = d.name;
  if (d.address !== undefined) data.direccion = d.address;
  if (d.city !== undefined) data.municipio = d.city;
  if (d.postalCode !== undefined) data.codigoPostal = d.postalCode;
  if (d.cif !== undefined) data.cif = d.cif || null;
  if (d.admin !== undefined) data.administrador = d.admin || null;
  if (d.cau !== undefined) data.cau = d.cau.toUpperCase();
  if (d.power !== undefined) data.potenciaKw = d.power;
  if (d.modality !== undefined) data.modalidad = modalidadMap[d.modality];
  if (d.connectionType !== undefined) data.tipoRed = tipoRedMap[d.connectionType];
  if (d.proximity !== undefined) data.tipoProximidad = d.proximity;
  if (d.numPaneles !== undefined) data.numPaneles = d.numPaneles;
  if (d.fase !== undefined) data.fase = faseMap[d.fase];
  if (d.gestorEnabled !== undefined) data.gestorHabilitado = d.gestorEnabled;
  if (d.gestorName !== undefined) data.gestorNombre = d.gestorName || null;
  if (d.gestorNif !== undefined) data.gestorNif = d.gestorNif || null;

  try {
    await prisma.instalacion.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

// ── DELETE /api/communities/[id] ──────────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id } = await params;

  const existente = await prisma.instalacion.findFirst({ where: { id, organizacionId } });
  if (!existente) {
    return NextResponse.json({ message: "Comunidad no encontrada" }, { status: 404 });
  }

  await prisma.instalacion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
