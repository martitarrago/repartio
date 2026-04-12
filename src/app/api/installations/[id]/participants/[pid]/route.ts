import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const esquema = z.object({
  cups: z
    .string()
    .length(22, "El CUPS debe tener exactamente 22 caracteres")
    .regex(/^ES/i, "El CUPS debe comenzar por 'ES'"),
  nombre: z.string().min(2).max(100),
  descripcion: z.string().max(200).optional(),
});

async function verificarPropiedad(instalacionId: string, organizacionId: string) {
  return prisma.instalacion.findFirst({ where: { id: instalacionId, organizacionId } });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId, pid } = await params;

  if (!(await verificarPropiedad(instalacionId, organizacionId))) {
    return NextResponse.json({ message: "No encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = esquema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Datos inválidos", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const participante = await prisma.participante.update({
      where: { id: pid },
      data: parsed.data,
    });
    return NextResponse.json(participante);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { message: "Ya existe ese CUPS en esta instalación" },
        { status: 409 }
      );
    }
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId, pid } = await params;

  if (!(await verificarPropiedad(instalacionId, organizacionId))) {
    return NextResponse.json({ message: "No encontrado" }, { status: 404 });
  }

  await prisma.participante.delete({ where: { id: pid } });
  return new NextResponse(null, { status: 204 });
}
