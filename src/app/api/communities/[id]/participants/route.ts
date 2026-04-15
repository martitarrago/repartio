import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const crearSchema = z.object({
  name: z.string().min(1).max(100),
  cups: z.string().length(22),
  email: z.string().email().optional().or(z.literal("")),
  unit: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId } = await params;

  const instalacion = await prisma.instalacion.findFirst({ where: { id: instalacionId, organizacionId } });
  if (!instalacion) {
    return NextResponse.json({ message: "Comunidad no encontrada" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Cuerpo inválido" }, { status: 400 });

  const parsed = crearSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const { name, cups, email, unit } = parsed.data;
  const cupsUpper = cups.toUpperCase();

  // Si el CUPS ya existe en esta comunidad, distinguir activo vs. baja
  const existing = await prisma.participante.findUnique({
    where: { cups_instalacionId: { cups: cupsUpper, instalacionId } },
  });

  if (existing) {
    if (existing.activo) {
      return NextResponse.json({ message: "CUPS ya registrado en esta comunidad" }, { status: 409 });
    }
    // Estaba de baja → reactivar con los nuevos datos
    const reactivado = await prisma.participante.update({
      where: { id: existing.id },
      data: {
        nombre: name,
        email: email || null,
        unidad: unit || null,
        activo: true,
        estadoParticipante: "ACTIVO",
        estadoFirma: "PENDIENTE",
        fechaBaja: null,
        fechaAlta: new Date(),
      },
    });
    return NextResponse.json({ id: reactivado.id, reactivated: true }, { status: 200 });
  }

  const count = await prisma.participante.count({ where: { instalacionId, activo: true } });

  const participante = await prisma.participante.create({
    data: {
      nombre: name,
      cups: cupsUpper,
      email: email || null,
      unidad: unit || null,
      instalacionId,
      orden: count,
    },
  });
  return NextResponse.json({ id: participante.id }, { status: 201 });
}
