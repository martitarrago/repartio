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

  const count = await prisma.participante.count({ where: { instalacionId, activo: true } });

  try {
    const participante = await prisma.participante.create({
      data: {
        nombre: name,
        cups: cups.toUpperCase(),
        email: email || null,
        unidad: unit || null,
        instalacionId,
        orden: count,
      },
    });
    return NextResponse.json({ id: participante.id }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ message: "CUPS ya registrado en esta comunidad" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
