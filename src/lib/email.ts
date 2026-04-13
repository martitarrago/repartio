/**
 * Utilidad de email — usa Resend si RESEND_API_KEY está configurada.
 * Sin API key: imprime el enlace en consola (útil en desarrollo).
 *
 * Para activar email real:
 * 1. Crea cuenta gratuita en https://resend.com (3.000 emails/mes gratis)
 * 2. Verifica tu dominio o usa el sandbox de Resend
 * 3. Añade RESEND_API_KEY y FROM_EMAIL en .env
 */

interface SignatureEmailParams {
  to: string;
  participantName: string;
  communityName: string;
  link: string;
}

export async function sendSignatureEmail(params: SignatureEmailParams): Promise<boolean> {
  const { to, participantName, communityName, link } = params;

  const subject = `Acuerdo de reparto solar — ${communityName}`;
  const html = buildEmailHtml({ participantName, communityName, link });
  const text = buildEmailText({ participantName, communityName, link });

  // ── Resend ────────────────────────────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    try {
      const from = process.env.FROM_EMAIL ?? "Repartio <noreply@repartio.es>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html, text }),
      });
      if (res.ok) return true;
      console.error("[email] Resend error:", await res.text());
    } catch (e) {
      console.error("[email] Resend exception:", e);
    }
    return false;
  }

  // ── Fallback: consola ────────────────────────────────────────────────────
  console.log(`\n📧 [email dev] Para: ${to}`);
  console.log(`   Asunto: ${subject}`);
  console.log(`   Enlace de firma: ${link}\n`);
  return false; // false indica que no se envió email real
}

function buildEmailHtml({ participantName, communityName, link }: Omit<SignatureEmailParams, "to">) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:linear-gradient(135deg,#059669,#34d399);padding:32px 40px">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:700">Acuerdo de reparto solar</p>
      <p style="margin:8px 0 0;color:#a7f3d0;font-size:14px">${communityName}</p>
    </div>
    <div style="padding:32px 40px">
      <p style="margin:0 0 16px;color:#374151;font-size:15px">Hola <strong>${participantName}</strong>,</p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6">
        Te invitamos a firmar el acuerdo de reparto de energía solar de la comunidad <strong>${communityName}</strong>.
        Puedes revisar el documento y confirmar tu firma haciendo clic en el botón:
      </p>
      <a href="${link}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600">
        Revisar y firmar →
      </a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.6">
        Este enlace es personal e intransferible. Caduca en 30 días.<br>
        Si no esperabas este email, puedes ignorarlo.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailText({ participantName, communityName, link }: Omit<SignatureEmailParams, "to">) {
  return `Hola ${participantName},

Te invitamos a firmar el acuerdo de reparto de energía solar de la comunidad ${communityName}.

Enlace para firmar: ${link}

Este enlace es personal e intransferible y caduca en 30 días.
`;
}
