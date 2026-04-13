/**
 * POST /api/communities/[id]/sign
 * Genera tokens únicos de firma para cada participante pendiente.
 * Devuelve los enlaces para que el admin los comparta (WhatsApp, email manual, etc.)
 * Si RESEND_API_KEY está configurada, envía emails automáticamente.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendSignatureEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const TOKEN_EXPIRY_DAYS = 30;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId } = await params;

  const instalacion = await prisma.instalacion.findFirst({
    where: { id: instalacionId, organizacionId },
    include: {
      participantes: {
        where: { activo: true, estadoFirma: "PENDIENTE" },
      },
    },
  });

  if (!instalacion) {
    return NextResponse.json({ error: "Comunidad no encontrada" }, { status: 404 });
  }

  if (instalacion.participantes.length === 0) {
    return NextResponse.json({ error: "No hay participantes pendientes de firma" }, { status: 400 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  const results = await Promise.all(
    instalacion.participantes.map(async (p) => {
      // Reusar token existente no usado si aún no ha expirado
      const existing = await prisma.firmaToken.findFirst({
        where: {
          participanteId: p.id,
          usadoEn: null,
          expiresAt: { gt: new Date() },
        },
      });

      const firmaToken = existing ?? await prisma.firmaToken.create({
        data: {
          participanteId: p.id,
          instalacionId,
          expiresAt,
        },
      });

      const link = `${BASE_URL}/sign/${firmaToken.token}`;

      // Enviar email si hay servicio configurado
      let emailSent = false;
      if (p.email) {
        emailSent = await sendSignatureEmail({
          to: p.email,
          participantName: p.nombre,
          communityName: instalacion.nombre,
          link,
        });
      }

      return {
        participanteId: p.id,
        nombre: p.nombre,
        email: p.email,
        link,
        emailSent,
        token: firmaToken.token,
      };
    })
  );

  return NextResponse.json({
    ok: true,
    count: results.length,
    links: results,
  });
}
