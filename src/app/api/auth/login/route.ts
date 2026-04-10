import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEMO_EMAIL = "demo@repartio.es";
const DEMO_PASSWORD = "demo1234";
const DEMO_SESSION_VALUE = "demo-session-repartio";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  // ── Modo demo ──────────────────────────────────────────────────────────────
  if (
    email?.toLowerCase().trim() === DEMO_EMAIL &&
    password === DEMO_PASSWORD
  ) {
    const response = NextResponse.json({ ok: true, demo: true });
    response.cookies.set("repartio-session", DEMO_SESSION_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas
    });
    return response;
  }

  // ── Auth real (pendiente de implementar con NextAuth/Prisma) ───────────────
  return NextResponse.json(
    { message: "Email o contraseña incorrectos" },
    { status: 401 }
  );
}
