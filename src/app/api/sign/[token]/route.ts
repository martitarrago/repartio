import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — verifica el token y devuelve datos para mostrar el documento
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const firmaToken = await prisma.firmaToken.findUnique({
    where: { token },
    include: {
      participante: {
        include: {
          instalacion: {
            include: {
              participantes: {
                where: { activo: true },
                orderBy: { orden: "asc" },
                include: {
                  entradas: {
                    where: { hora: null, tipoDia: null },
                    orderBy: { conjuntoId: "desc" },
                    take: 1,
                  },
                },
              },
              conjuntos: {
                where: { estado: { in: ["PUBLICADO", "VALIDADO"] } },
                orderBy: { version: "desc" },
                take: 1,
                include: {
                  entradas: { where: { hora: null, tipoDia: null } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!firmaToken) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (firmaToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Este enlace ha caducado" }, { status: 410 });
  }

  if (firmaToken.usadoEn) {
    return NextResponse.json({ error: "Este enlace ya fue utilizado", alreadySigned: true }, { status: 409 });
  }

  const p = firmaToken.participante;
  const instalacion = p.instalacion;

  // Build beta map from active conjunto
  const betaMap: Record<string, number> = {};
  if (instalacion.conjuntos[0]) {
    for (const e of instalacion.conjuntos[0].entradas) {
      betaMap[e.participanteId] = Number(e.valor);
    }
  }

  return NextResponse.json({
    participante: {
      nombre: p.nombre,
      cups: p.cups,
      unidad: p.unidad,
      email: p.email,
      estadoFirma: p.estadoFirma,
    },
    instalacion: {
      nombre: instalacion.nombre,
      cau: instalacion.cau,
      direccion: instalacion.direccion,
      municipio: instalacion.municipio,
      potenciaKw: instalacion.potenciaKw,
      modalidad: instalacion.modalidad,
    },
    participantes: instalacion.participantes.map(part => ({
      nombre: part.nombre,
      cups: part.cups,
      unidad: part.unidad,
      beta: betaMap[part.id] ?? 0,
    })),
  });
}

// POST — confirma la firma
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const firmaToken = await prisma.firmaToken.findUnique({
    where: { token },
    include: { participante: true },
  });

  if (!firmaToken) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (firmaToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Este enlace ha caducado" }, { status: 410 });
  }

  if (firmaToken.usadoEn) {
    return NextResponse.json({ error: "Ya firmaste este documento", alreadySigned: true }, { status: 409 });
  }

  // Get IP address
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  const now = new Date();

  // Find the active conjunto to link the signature to specific coefficients
  const activeConjunto = await prisma.conjuntoCoeficientes.findFirst({
    where: {
      instalacionId: firmaToken.participante.instalacionId,
      estado: { not: "ARCHIVADO" },
    },
    orderBy: { actualizadoEn: "desc" },
  });

  // Mark token as used and update participant signature state
  await prisma.$transaction([
    prisma.firmaToken.update({
      where: { token },
      data: { usadoEn: now, ipAddress: ip },
    }),
    prisma.participante.update({
      where: { id: firmaToken.participanteId },
      data: {
        estadoFirma: "FIRMADO",
        firmadoEn: now,
        conjuntoFirmadoId: activeConjunto?.id ?? null,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    firmadoEn: now.toISOString(),
    participante: firmaToken.participante.nombre,
  });
}
