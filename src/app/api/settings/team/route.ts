import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizacionId = (session.user as any).organizacionId as string;

  const usuarios = await prisma.usuario.findMany({
    where: { organizacionId, activo: true },
    select: { id: true, nombre: true, apellidos: true, email: true, rol: true, ultimoAcceso: true, creadoEn: true },
    orderBy: { creadoEn: "asc" },
  });

  return NextResponse.json(usuarios);
}

const inviteSchema = z.object({
  nombre: z.string().min(1).max(100),
  apellidos: z.string().max(100).optional(),
  email: z.string().email(),
  rol: z.enum(["ADMIN", "GESTOR", "LECTOR"]).default("GESTOR"),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizacionId = (session.user as any).organizacionId as string;

  // Solo ADMIN puede invitar
  const me = await prisma.usuario.findUnique({ where: { id: session.user.id }, select: { rol: true } });
  if (!me || (me.rol !== "ADMIN" && me.rol !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Solo administradores pueden invitar usuarios" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", errors: parsed.error.flatten() }, { status: 400 });

  const exists = await prisma.usuario.findUnique({ where: { email: parsed.data.email } });
  if (exists) return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.usuario.create({
    data: {
      nombre: parsed.data.nombre,
      apellidos: parsed.data.apellidos ?? null,
      email: parsed.data.email,
      rol: parsed.data.rol,
      passwordHash,
      organizacionId,
    },
    select: { id: true, nombre: true, email: true, rol: true },
  });

  return NextResponse.json(user, { status: 201 });
}
