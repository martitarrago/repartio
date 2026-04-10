import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que NO requieren autenticación
const RUTAS_PUBLICAS = ["/login", "/register", "/forgot-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si hay sesión (cookie de sesión — adaptar a NextAuth/Clerk)
  const token = request.cookies.get("next-auth.session-token")?.value
    ?? request.cookies.get("__Secure-next-auth.session-token")?.value;

  const esRutaPublica = RUTAS_PUBLICAS.some((ruta) =>
    pathname.startsWith(ruta)
  );

  // Si no hay sesión y la ruta no es pública → login
  if (!token && !esRutaPublica) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si hay sesión y la ruta es pública → dashboard
  if (token && esRutaPublica) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - archivos estáticos con extensión
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
