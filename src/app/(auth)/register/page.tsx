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
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-[#18181B]">Crear cuenta</h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">Empieza a gestionar tu autoconsumo</p>
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
            <label htmlFor="nombre" className="text-sm font-medium text-[#52525B]">
              Tu nombre
            </label>
            <Input
              id="nombre"
              placeholder="Ana García"
              autoComplete="name"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-2xs text-[#DC2626]">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="organizacion" className="text-sm font-medium text-[#52525B]">
              Organización
            </label>
            <Input
              id="organizacion"
              placeholder="Gestoría Energética SL"
              {...register("organizacion")}
            />
            {errors.organizacion && (
              <p className="text-2xs text-[#DC2626]">{errors.organizacion.message}</p>
            )}
          </div>

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
            <label htmlFor="password" className="text-sm font-medium text-[#52525B]">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-2xs text-[#DC2626]">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-[#A1A1AA]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#18181B] hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
