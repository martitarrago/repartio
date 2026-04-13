/**
 * Signaturit integration — envío de solicitudes de firma eIDAS.
 *
 * Para activarlo:
 * 1. Crea una cuenta en https://app.signaturit.com
 * 2. Añade SIGNATURIT_API_KEY en .env
 * 3. Sube el documento PDF del acuerdo al bucket de Supabase Storage
 *
 * Mientras SIGNATURIT_API_KEY está vacía, el endpoint devuelve 503
 * con instrucciones. El resto del código está completamente funcional.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const SIGNATURIT_BASE = process.env.SIGNATURIT_SANDBOX === "true"
  ? "https://api.sandbox.signaturit.com/v1"
  : "https://api.signaturit.com/v1";

async function signaturitRequest(path: string, body: any) {
  const res = await fetch(`${SIGNATURIT_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SIGNATURIT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Signaturit error: ${res.status} ${await res.text()}`);
  return res.json();
}

// POST /api/communities/[id]/sign — envía solicitud de firma a todos los participantes pendientes
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.SIGNATURIT_API_KEY) {
    return NextResponse.json(
      {
        error: "SIGNATURIT_API_KEY no configurada.",
        instructions: "Crea una cuenta en https://app.signaturit.com y añade la API key en .env",
      },
      { status: 503 }
    );
  }

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

  const body = await req.json().catch(() => ({}));
  const documentUrl: string | undefined = body.documentUrl;

  if (!documentUrl) {
    return NextResponse.json({ error: "documentUrl requerida" }, { status: 400 });
  }

  // Build signers for Signaturit
  const signers = instalacion.participantes.map(p => ({
    email: p.email ?? "",
    name: p.nombre,
    // Signaturit supports phone OTP — optional
  })).filter(s => s.email);

  if (signers.length === 0) {
    return NextResponse.json({ error: "No hay participantes con email pendientes de firma" }, { status: 400 });
  }

  try {
    // Send signature request
    const signatureRequest = await signaturitRequest("/signatures.json", {
      documents: [{ url: documentUrl, name: `Acuerdo_${instalacion.nombre}.pdf` }],
      recipients: signers,
      subject: `Acuerdo de reparto — ${instalacion.nombre}`,
      body: `Por favor, firme el acuerdo de reparto de energía solar de la comunidad ${instalacion.nombre}.`,
      mandatory_pages: [],
    });

    // Save signaturit request ID to each participant
    await prisma.participante.updateMany({
      where: { instalacionId, activo: true, estadoFirma: "PENDIENTE" },
      data: { signaturitRequestId: signatureRequest.id },
    });

    return NextResponse.json({
      ok: true,
      signaturitRequestId: signatureRequest.id,
      signerCount: signers.length,
    });
  } catch (e: any) {
    console.error("Signaturit error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
