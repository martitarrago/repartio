import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cups: z.string().length(22).optional(),
  email: z.string().email().optional().or(z.literal("")),
  unit: z.string().optional(),
  estadoFirma: z.enum(["PENDIENTE", "FIRMADO", "RECHAZADO"]).optional(),
  estadoParticipante: z.enum(["ACTIVO", "PENDIENTE_ALTA", "BAJA"]).optional(),
  signaturitSignatureId: z.string().optional(),
  signaturitRequestId: z.string().optional(),
  signedDocumentUrl: z.string().url().optional(),
});

async function verificarAcceso(instalacionId: string, organizacionId: string) {
  return prisma.instalacion.findFirst({ where: { id: instalacionId, organizacionId } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId, pid } = await params;

  if (!await verificarAcceso(instalacionId, organizacionId)) {
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
  if (d.cups !== undefined) data.cups = d.cups.toUpperCase();
  if (d.email !== undefined) data.email = d.email || null;
  if (d.unit !== undefined) data.unidad = d.unit || null;
  if (d.estadoFirma !== undefined) {
    data.estadoFirma = d.estadoFirma;
    if (d.estadoFirma === "FIRMADO") data.firmadoEn = new Date();
  }
  if (d.estadoParticipante !== undefined) {
    data.estadoParticipante = d.estadoParticipante;
    if (d.estadoParticipante === "BAJA") data.fechaBaja = new Date();
    data.activo = d.estadoParticipante !== "BAJA";
  }
  if (d.signaturitSignatureId !== undefined) data.signaturitSignatureId = d.signaturitSignatureId;
  if (d.signaturitRequestId !== undefined) data.signaturitRequestId = d.signaturitRequestId;
  if (d.signedDocumentUrl !== undefined) data.signedDocumentUrl = d.signedDocumentUrl;

  try {
    // Verificar que el participante pertenece a esta instalación
    const existing = await prisma.participante.findFirst({ where: { id: pid, instalacionId } });
    if (!existing) return NextResponse.json({ message: "Participante no encontrado" }, { status: 404 });

    const participante = await prisma.participante.update({ where: { id: pid }, data });
    return NextResponse.json({ id: participante.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId, pid } = await params;

  if (!await verificarAcceso(instalacionId, organizacionId)) {
    return NextResponse.json({ message: "Comunidad no encontrada" }, { status: 404 });
  }

  // Verificar que el participante pertenece a esta instalación
  const existing = await prisma.participante.findFirst({ where: { id: pid, instalacionId } });
  if (!existing) return NextResponse.json({ message: "Participante no encontrado" }, { status: 404 });

  // Baja lógica — no borrar para mantener historial
  await prisma.participante.update({
    where: { id: pid },
    data: { activo: false, estadoParticipante: "BAJA", fechaBaja: new Date() },
  });

  return NextResponse.json({ ok: true });
}
