import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET — historial de conjuntos de coeficientes con firmas asociadas
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

  const inst = await prisma.instalacion.findFirst({
    where: { id, organizacionId },
    select: { id: true },
  });
  if (!inst) {
    return NextResponse.json({ message: "No encontrada" }, { status: 404 });
  }

  // Conjunto activo (no archivado)
  const conjuntoActivo = await prisma.conjuntoCoeficientes.findFirst({
    where: { instalacionId: id, estado: { not: "ARCHIVADO" } },
    orderBy: { actualizadoEn: "desc" },
    select: { id: true },
  });

  // Todos los conjuntos que tienen al menos un participante que los firmó,
  // OR el conjunto activo (para mostrarlo aunque aún no tenga firmas vinculadas)
  const conjuntos = await prisma.conjuntoCoeficientes.findMany({
    where: {
      instalacionId: id,
      OR: [
        { firmasParticipantes: { some: {} } },
        ...(conjuntoActivo ? [{ id: conjuntoActivo.id }] : []),
      ],
    },
    orderBy: { creadoEn: "desc" },
    include: {
      entradas: {
        where: { hora: null, tipoDia: null },
        include: { participante: { select: { nombre: true, cups: true } } },
      },
      firmasParticipantes: {
        where: { estadoFirma: "FIRMADO" },
        select: {
          id: true,
          nombre: true,
          firmadoEn: true,
        },
      },
    },
  });

  const history = conjuntos.map((c) => ({
    id: c.id,
    estado: c.estado,
    modo: c.modo,
    version: c.version,
    creadoEn: c.creadoEn.toISOString(),
    isActive: c.id === conjuntoActivo?.id,
    coeficientes: c.entradas.map((e) => ({
      nombre: e.participante.nombre,
      cups: e.participante.cups,
      valor: Number(e.valor),
    })),
    firmas: c.firmasParticipantes.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      firmadoEn: p.firmadoEn?.toISOString() ?? null,
    })),
  }));

  return NextResponse.json({ history, activeConjuntoId: conjuntoActivo?.id ?? null });
}

// POST — restaurar un conjunto archivado como activo
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const conjuntoId = body?.conjuntoId as string | undefined;
  if (!conjuntoId) {
    return NextResponse.json({ message: "conjuntoId requerido" }, { status: 400 });
  }

  const conjunto = await prisma.conjuntoCoeficientes.findFirst({
    where: { id: conjuntoId, instalacion: { id, organizacionId } },
  });
  if (!conjunto) {
    return NextResponse.json({ message: "Conjunto no encontrado" }, { status: 404 });
  }

  await prisma.$transaction([
    // Archivar todos los conjuntos no archivados
    prisma.conjuntoCoeficientes.updateMany({
      where: { instalacionId: id, estado: { not: "ARCHIVADO" } },
      data: { estado: "ARCHIVADO" },
    }),
    // Restaurar el seleccionado
    prisma.conjuntoCoeficientes.update({
      where: { id: conjuntoId },
      data: { estado: "BORRADOR" },
    }),
  ]);

  return NextResponse.json({ ok: true, conjuntoId });
}
