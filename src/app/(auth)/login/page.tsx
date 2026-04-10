"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const esquemaLogin = z.object({
  email: z.string().email("Introduce un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type FormLogin = z.infer<typeof esquemaLogin>;

export default function LoginPage() {
  const router = useRouter();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormLogin>({
    resolver: zodResolver(esquemaLogin),
  });

  async function onSubmit(data: FormLogin) {
    setErrorServidor(null);
    try {
      // TODO: integrar NextAuth signIn
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorServidor(body.message ?? "Email o contraseña incorrectos");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorServidor("Error de conexión. Inténtalo de nuevo.");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>
            Accede a tu cuenta de Repartio para gestionar tus instalaciones
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {errorServidor && (
              <Alert variant="destructive">
                <AlertDescription>{errorServidor}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="gestor@ejemplo.com"
                autoComplete="email"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-10"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Contacta con nosotros
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Al acceder aceptas nuestros{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
          Términos de uso
        </Link>{" "}
        y{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Política de privacidad
        </Link>
      </p>
    </div>
  );
}
