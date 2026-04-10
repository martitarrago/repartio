import { redirect } from "next/navigation";

// Redirige / → /dashboard (o /login si no hay sesión)
// En producción, la lógica de auth se implementa en middleware.ts
export default function RootPage() {
  redirect("/dashboard");
}
