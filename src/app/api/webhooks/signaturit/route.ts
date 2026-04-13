/**
 * Signaturit webhook — recibe actualizaciones de estado de firma.
 *
 * Configurar en el panel de Signaturit:
 * URL: https://tu-dominio.com/api/webhooks/signaturit
 * Eventos: signature_completed, signature_declined, signature_expired
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = body;

  if (!type || !data) {
    return NextResponse.json({ ok: true }); // Ignore malformed events
  }

  const signatureId: string = data.id ?? data.signature_id;
  const requestId: string = data.signature_request_id ?? data.request_id;

  if (!signatureId) {
    return NextResponse.json({ ok: true });
  }

  try {
    switch (type) {
      case "onSignatureCompleted":
      case "signature_completed": {
        // Find participant by signaturit signature or request id
        const participante = await prisma.participante.findFirst({
          where: {
            OR: [
              { signaturitSignatureId: signatureId },
              { signaturitRequestId: requestId ?? "" },
            ],
          },
        });

        if (participante) {
          await prisma.participante.update({
            where: { id: participante.id },
            data: {
              estadoFirma: "FIRMADO",
              firmadoEn: new Date(),
              signaturitSignatureId: signatureId,
              signedDocumentUrl: data.signed_document_url ?? null,
            },
          });
        }
        break;
      }

      case "onSignatureDeclined":
      case "signature_declined": {
        const participante = await prisma.participante.findFirst({
          where: {
            OR: [
              { signaturitSignatureId: signatureId },
              { signaturitRequestId: requestId ?? "" },
            ],
          },
        });

        if (participante) {
          await prisma.participante.update({
            where: { id: participante.id },
            data: {
              estadoFirma: "RECHAZADO",
              signaturitSignatureId: signatureId,
            },
          });
        }
        break;
      }

      default:
        // Unhandled event type — log and ignore
        console.log(`[Signaturit webhook] Unhandled event: ${type}`);
    }
  } catch (e) {
    console.error("[Signaturit webhook] Error:", e);
    // Return 200 so Signaturit doesn't retry — we'll handle re-sync separately
  }

  return NextResponse.json({ ok: true });
}
