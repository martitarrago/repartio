"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/ui/motion";

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

  const fields: Array<{
    name: keyof FormRegister;
    label: string;
    placeholder: string;
    type?: string;
    autoComplete?: string;
  }> = [
    { name: "nombre", label: "Tu nombre", placeholder: "Ana García", autoComplete: "name" },
    { name: "organizacion", label: "Organización", placeholder: "Gestoría Energética SL" },
    { name: "email", label: "Email", placeholder: "tu@email.com", type: "email", autoComplete: "email" },
    { name: "password", label: "Contraseña", placeholder: "Mínimo 8 caracteres", type: "password", autoComplete: "new-password" },
  ];

  return (
    <FadeIn className="w-full max-w-[360px]">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Crear cuenta
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Empieza a gestionar tu autoconsumo
        </p>
      </div>

      <div className="rounded-lg border border-border bg-white p-7 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              <Input
                id={f.name}
                type={f.type}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                aria-invalid={!!errors[f.name]}
                {...register(f.name)}
              />
              {errors[f.name] && (
                <p className="text-2xs text-destructive">{errors[f.name]?.message as string}</p>
              )}
            </div>
          ))}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </FadeIn>
  );
}
