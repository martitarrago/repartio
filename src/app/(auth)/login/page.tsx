"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const esquema = z.object({
  email: z.string().email("Introduce un email válido"),
  password: z.string().min(1, "Introduce tu contraseña"),
});

type FormLogin = z.infer<typeof esquema>;

export default function LoginPage() {
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
        <h1 className="text-[20px] font-semibold text-[#0A0A0A]">Repartio</h1>
        <p className="mt-1 text-xs text-[#9CA3AF]">Gestión de autoconsumo colectivo</p>
      </div>

      <div className="rounded-lg border border-[#E5E7EB] bg-white p-8">
        <h2 className="mb-6 text-sm font-semibold text-[#0A0A0A]">Iniciar sesión</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <p className="rounded-md bg-[#FEF2F2] px-3 py-2 text-xs text-[#DC2626]">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-[#374151]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[11px] text-[#DC2626]">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium text-[#374151]">
                Contraseña
              </Label>
              <Link href="/forgot-password" className="text-[11px] text-[#6B7280] hover:text-[#0A0A0A]">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-[#DC2626]">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSubmitting ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-[#9CA3AF]">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-[#0A0A0A] hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
