import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  rol: z.enum(["ADMIN", "GESTOR", "LECTOR"]).optional(),
  activo: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizacionId = (session.user as any).organizacionId as string;
  const { userId } = await params;

  const me = await prisma.usuario.findUnique({ where: { id: session.user.id }, select: { rol: true } });
  if (!me || (me.rol !== "ADMIN" && me.rol !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }
  if (userId === session.user.id) {
    return NextResponse.json({ error: "No puedes modificar tu propio rol" }, { status: 400 });
  }

  const target = await prisma.usuario.findFirst({ where: { id: userId, organizacionId } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body ?? {});
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const user = await prisma.usuario.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizacionId = (session.user as any).organizacionId as string;
  const { userId } = await params;

  if (userId === session.user.id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  const me = await prisma.usuario.findUnique({ where: { id: session.user.id }, select: { rol: true } });
  if (!me || (me.rol !== "ADMIN" && me.rol !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const target = await prisma.usuario.findFirst({ where: { id: userId, organizacionId } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Baja lógica
  await prisma.usuario.update({ where: { id: userId }, data: { activo: false } });

  return NextResponse.json({ ok: true });
}
