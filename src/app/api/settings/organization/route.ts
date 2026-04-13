import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizacionId = (session.user as any).organizacionId as string;

  const org = await prisma.organizacion.findUnique({
    where: { id: organizacionId },
    select: { id: true, nombre: true, cif: true, email: true, telefono: true, direccion: true, logoUrl: true, creadaEn: true },
  });
  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  return NextResponse.json(org);
}

const patchSchema = z.object({
  nombre: z.string().min(1).max(150).optional(),
  cif: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  telefono: z.string().max(20).optional(),
  direccion: z.string().max(300).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizacionId = (session.user as any).organizacionId as string;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", errors: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, any> = {};
  if (parsed.data.nombre !== undefined) data.nombre = parsed.data.nombre;
  if (parsed.data.cif !== undefined) data.cif = parsed.data.cif || null;
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
  if (parsed.data.telefono !== undefined) data.telefono = parsed.data.telefono || null;
  if (parsed.data.direccion !== undefined) data.direccion = parsed.data.direccion || null;

  const org = await prisma.organizacion.update({
    where: { id: organizacionId },
    data,
    select: { id: true, nombre: true, cif: true, email: true, telefono: true, direccion: true },
  });

  return NextResponse.json(org);
}
