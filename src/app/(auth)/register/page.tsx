"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const esquema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  organizacion: z.string().min(2, "El nombre de la organización es obligatorio"),
  email: z.string().email("Introduce un email válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormRegister = z.infer<typeof esquema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormRegister>({ resolver: zodResolver(esquema) });

  async function onSubmit(data: FormRegister) {
    setError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? "Error al crear la cuenta");
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-[20px] font-semibold text-[#0A0A0A]">Repartio</h1>
        <p className="mt-1 text-xs text-[#9CA3AF]">Gestión de autoconsumo colectivo</p>
      </div>

      <div className="rounded-lg border border-[#E5E7EB] bg-white p-8">
        <h2 className="mb-6 text-sm font-semibold text-[#0A0A0A]">Crear cuenta</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <p className="rounded-md bg-[#FEF2F2] px-3 py-2 text-xs text-[#DC2626]">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nombre" className="text-xs font-medium text-[#374151]">
              Tu nombre
            </Label>
            <Input
              id="nombre"
              placeholder="Ana García"
              autoComplete="name"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-[11px] text-[#DC2626]">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="organizacion" className="text-xs font-medium text-[#374151]">
              Nombre de tu organización
            </Label>
            <Input
              id="organizacion"
              placeholder="Gestoría Energética SL"
              {...register("organizacion")}
            />
            {errors.organizacion && (
              <p className="text-[11px] text-[#DC2626]">{errors.organizacion.message}</p>
            )}
          </div>

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
            <Label htmlFor="password" className="text-xs font-medium text-[#374151]">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-[11px] text-[#DC2626]">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-[#9CA3AF]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#0A0A0A] hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
