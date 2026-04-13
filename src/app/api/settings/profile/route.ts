import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { id: true, nombre: true, apellidos: true, email: true, rol: true, ultimoAcceso: true, creadoEn: true },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  return NextResponse.json(user);
}

const patchSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  apellidos: z.string().max(100).optional(),
  email: z.string().email().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", errors: parsed.error.flatten() }, { status: 400 });

  const user = await prisma.usuario.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { id: true, nombre: true, apellidos: true, email: true, rol: true },
  });

  return NextResponse.json(user);
}
