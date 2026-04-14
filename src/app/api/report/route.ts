import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  const { mensaje } = await req.json();

  if (!mensaje?.trim()) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const user = session?.user?.email ?? "Usuario no autenticado";
  const timestamp = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });

  if (process.env.RESEND_API_KEY && process.env.FROM_EMAIL) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL,
        to: ["hola@repartio.es"],
        subject: `[Repartio] Reporte de problema — ${timestamp}`,
        text: `Usuario: ${user}\nFecha: ${timestamp}\n\nMensaje:\n${mensaje}`,
      }),
    }).catch(() => {});
  } else {
    console.log(`[REPORT] ${user}: ${mensaje}`);
  }

  return NextResponse.json({ ok: true });
}
