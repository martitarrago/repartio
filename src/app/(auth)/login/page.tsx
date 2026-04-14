"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const esquema = z.object({
  email: z.string().email("Introduce un email válido"),
  password: z.string().min(1, "Introduce tu contraseña"),
});

type FormLogin = z.infer<typeof esquema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormLogin>({ resolver: zodResolver(esquema) });

  async function onSubmit(data: FormLogin) {
    setError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-[#18181B]">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">Accede a tu cuenta de Repartio</p>
      </div>

      <div
        className="rounded-lg bg-white p-8"
        style={{
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <p className="rounded-md bg-[#FEF2F2] px-3 py-2 text-xs text-[#DC2626]">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-[#52525B]">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-2xs text-[#DC2626]">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-[#52525B]">
                Contraseña
              </label>
              <Link href="/forgot-password" className="text-2xs text-[#A1A1AA] hover:text-[#18181B]">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={mostrarPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pr-9"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#71717A]"
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-2xs text-[#DC2626]">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-[#A1A1AA]">o</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-[#A1A1AA]">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-[#18181B] hover:underline">
          Crear cuenta
        </Link>
      </p>
      <p className="mt-3 text-center text-[11px] text-[#C4C4C4]">
        <Link href="/privacidad" className="hover:underline">Privacidad</Link>
        {" · "}
        <Link href="/legal" className="hover:underline">Aviso legal</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
