"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// ─── Esquema de validación ─────────────────────────────────────────────────────

const esquemaInstalacion = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  descripcion: z.string().max(500).optional(),
  cau: z
    .string()
    .min(10, "El CAU debe tener al menos 10 caracteres")
    .max(30, "El CAU no puede superar 30 caracteres")
    .regex(/^[A-Z0-9]+$/i, "El CAU solo puede contener letras y números"),
  anio: z
    .number({ invalid_type_error: "Introduce un año válido" })
    .int()
    .min(2019, "El año mínimo es 2019")
    .max(new Date().getFullYear() + 1),
  modalidad: z.enum([
    "INDIVIDUAL_SIN_EXCEDENTES",
    "INDIVIDUAL_CON_EXCEDENTES",
    "COLECTIVO_SIN_EXCEDENTES",
    "COLECTIVO_CON_EXCEDENTES",
    "SERVICIOS_AUXILIARES",
  ]),
  tecnologia: z.enum([
    "FOTOVOLTAICA",
    "EOLICA",
    "HIDRAULICA",
    "COGENERACION",
    "BIOMASA",
    "OTRAS",
  ]),
  potenciaKw: z.number({ invalid_type_error: "Introduce un número" }).positive().optional().or(z.literal("")),
  municipio: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  codigoPostal: z
    .string()
    .regex(/^\d{5}$/, "El código postal debe tener 5 dígitos")
    .optional()
    .or(z.literal("")),
});

type FormInstalacion = z.infer<typeof esquemaInstalacion>;

// ─── Opciones de select ─────────────────────────────────────────────────────────

const MODALIDADES = [
  { value: "COLECTIVO_CON_EXCEDENTES", label: "Colectivo con excedentes" },
  { value: "COLECTIVO_SIN_EXCEDENTES", label: "Colectivo sin excedentes" },
  { value: "INDIVIDUAL_CON_EXCEDENTES", label: "Individual con excedentes" },
  { value: "INDIVIDUAL_SIN_EXCEDENTES", label: "Individual sin excedentes" },
  { value: "SERVICIOS_AUXILIARES", label: "Servicios auxiliares" },
] as const;

const TECNOLOGIAS = [
  { value: "FOTOVOLTAICA", label: "Fotovoltaica" },
  { value: "EOLICA", label: "Eólica" },
  { value: "HIDRAULICA", label: "Hidráulica" },
  { value: "COGENERACION", label: "Cogeneración" },
  { value: "BIOMASA", label: "Biomasa" },
  { value: "OTRAS", label: "Otras" },
] as const;

// ─── Componente ─────────────────────────────────────────────────────────────────

interface InstallationFormProps {
  instalacionId?: string; // si se pasa → modo edición
  valoresIniciales?: Partial<FormInstalacion>;
}

export function InstallationForm({
  instalacionId,
  valoresIniciales,
}: InstallationFormProps) {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const esEdicion = !!instalacionId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInstalacion>({
    resolver: zodResolver(esquemaInstalacion),
    defaultValues: {
      anio: new Date().getFullYear(),
      modalidad: "COLECTIVO_CON_EXCEDENTES",
      tecnologia: "FOTOVOLTAICA",
      ...valoresIniciales,
    },
  });

  async function onSubmit(data: FormInstalacion) {
    setErrorServidor(null);
    try {
      const url = esEdicion
        ? `/api/installations/${instalacionId}`
        : "/api/installations";
      const method = esEdicion ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorServidor(body.message ?? "Error al guardar la instalación");
        return;
      }

      const body = await res.json();
      router.push(`/installations/${body.id}`);
      router.refresh();
    } catch {
      setErrorServidor("Error de conexión. Inténtalo de nuevo.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {errorServidor && (
        <Alert variant="destructive">
          <AlertDescription>{errorServidor}</AlertDescription>
        </Alert>
      )}

      {/* ── Datos básicos ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Datos básicos</h2>
          <p className="text-sm text-muted-foreground">
            Información principal de la instalación
          </p>
        </div>
        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="nombre">
              Nombre de la instalación <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Comunidad Solar Parque Sur"
              {...register("nombre")}
              aria-invalid={!!errors.nombre}
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripción opcional de la instalación..."
              rows={3}
              {...register("descripcion")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cau">
              Código CAU <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cau"
              placeholder="Ej: ES0000000000000000AA0F"
              className="font-mono uppercase"
              {...register("cau")}
              aria-invalid={!!errors.cau}
            />
            {errors.cau ? (
              <p className="text-xs text-destructive">{errors.cau.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Código de Autoconsumo Unificado asignado por la distribuidora
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="anio">
              Año <span className="text-destructive">*</span>
            </Label>
            <Input
              id="anio"
              type="number"
              min={2019}
              max={new Date().getFullYear() + 1}
              {...register("anio", { valueAsNumber: true })}
              aria-invalid={!!errors.anio}
            />
            {errors.anio && (
              <p className="text-xs text-destructive">{errors.anio.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Configuración técnica ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Configuración técnica</h2>
          <p className="text-sm text-muted-foreground">
            Modalidad y tecnología de la instalación
          </p>
        </div>
        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="modalidad">
              Modalidad <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={watch("modalidad")}
              onValueChange={(v) =>
                setValue("modalidad", v as FormInstalacion["modalidad"])
              }
            >
              <SelectTrigger id="modalidad" aria-invalid={!!errors.modalidad}>
                <SelectValue placeholder="Selecciona modalidad" />
              </SelectTrigger>
              <SelectContent>
                {MODALIDADES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.modalidad && (
              <p className="text-xs text-destructive">{errors.modalidad.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tecnologia">
              Tecnología <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={watch("tecnologia")}
              onValueChange={(v) =>
                setValue("tecnologia", v as FormInstalacion["tecnologia"])
              }
            >
              <SelectTrigger id="tecnologia" aria-invalid={!!errors.tecnologia}>
                <SelectValue placeholder="Selecciona tecnología" />
              </SelectTrigger>
              <SelectContent>
                {TECNOLOGIAS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="potenciaKw">Potencia instalada (kW)</Label>
            <Input
              id="potenciaKw"
              type="number"
              step="0.001"
              min="0"
              placeholder="Ej: 50.000"
              {...register("potenciaKw", { valueAsNumber: true })}
              aria-invalid={!!errors.potenciaKw}
            />
            {errors.potenciaKw && (
              <p className="text-xs text-destructive">{errors.potenciaKw.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Ubicación ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Ubicación</h2>
          <p className="text-sm text-muted-foreground">Datos de localización (opcionales)</p>
        </div>
        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="municipio">Municipio</Label>
            <Input
              id="municipio"
              placeholder="Ej: Madrid"
              {...register("municipio")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provincia">Provincia</Label>
            <Input
              id="provincia"
              placeholder="Ej: Madrid"
              {...register("provincia")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigoPostal">Código postal</Label>
            <Input
              id="codigoPostal"
              placeholder="28001"
              maxLength={5}
              {...register("codigoPostal")}
              aria-invalid={!!errors.codigoPostal}
            />
            {errors.codigoPostal && (
              <p className="text-xs text-destructive">{errors.codigoPostal.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Acciones ── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting
            ? esEdicion
              ? "Guardando..."
              : "Creando..."
            : esEdicion
            ? "Guardar cambios"
            : "Crear instalación"}
        </Button>
      </div>
    </form>
  );
}
