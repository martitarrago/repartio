"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
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
    .length(26, "El CAU debe tener exactamente 26 caracteres")
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
  instalacionId?: string; // si se pasa → modo edición (auto-save)
  valoresIniciales?: Partial<FormInstalacion>;
  /** Callback tras crear una instalación nueva (solo modo creación) */
  onCreated?: (id: string) => void;
}

export function InstallationForm({
  instalacionId,
  valoresIniciales,
  onCreated,
}: InstallationFormProps) {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [estadoGuardado, setEstadoGuardado] = useState<"idle" | "guardando" | "guardado">("idle");
  const esEdicion = !!instalacionId;
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormInstalacion>({
    resolver: zodResolver(esquemaInstalacion),
    defaultValues: {
      anio: new Date().getFullYear(),
      modalidad: "COLECTIVO_CON_EXCEDENTES",
      tecnologia: "FOTOVOLTAICA",
      ...valoresIniciales,
    },
  });

  // ─── Auto-save para modo edición ─────────────────────────────────────────
  const doAutoSave = useCallback(async () => {
    if (!esEdicion) return;
    const valid = await trigger();
    if (!valid) return;

    const data = getValues();
    setErrorServidor(null);
    setEstadoGuardado("guardando");

    try {
      const res = await fetch(`/api/installations/${instalacionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorServidor(body.message ?? "Error al guardar");
        setEstadoGuardado("idle");
        return;
      }

      setEstadoGuardado("guardado");
      setTimeout(() => setEstadoGuardado("idle"), 2000);
    } catch {
      setErrorServidor("Error de conexión. Inténtalo de nuevo.");
      setEstadoGuardado("idle");
    }
  }, [esEdicion, instalacionId, trigger, getValues]);

  // Watch all fields for auto-save debounce in edit mode
  const allFields = watch();
  const prevFieldsRef = useRef(JSON.stringify(allFields));

  useEffect(() => {
    if (!esEdicion) return;
    const currentJson = JSON.stringify(allFields);
    if (currentJson === prevFieldsRef.current) return;
    prevFieldsRef.current = currentJson;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      doAutoSave();
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [allFields, esEdicion, doAutoSave]);

  // ─── Submit para modo creación ────────────────────────────────────────────
  async function onSubmitCreate(data: FormInstalacion) {
    setErrorServidor(null);
    try {
      const res = await fetch("/api/installations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorServidor(body.message ?? "Error al crear la instalación");
        return;
      }

      const body = await res.json();
      if (onCreated) {
        onCreated(body.id);
      } else {
        router.push(`/installations/${body.id}`);
        router.refresh();
      }
    } catch {
      setErrorServidor("Error de conexión. Inténtalo de nuevo.");
    }
  }

  return (
    <form
      onSubmit={esEdicion ? (e) => e.preventDefault() : handleSubmit(onSubmitCreate)}
      className="space-y-8"
    >
      {/* Estado de guardado (solo edición) */}
      {esEdicion && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            {estadoGuardado === "guardando" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Guardando...
              </>
            )}
            {estadoGuardado === "guardado" && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-yellow-600" />
                <span className="text-yellow-600">Guardado</span>
              </>
            )}
          </span>
        </div>
      )}

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
              Nombre de la instalación <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Comunidad Solar Parque Sur"
              {...register("nombre")}
              aria-invalid={!!errors.nombre}
            />
            {errors.nombre && (
              <p className="text-xs text-[#DC2626]">{errors.nombre.message}</p>
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
              Código CAU <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="cau"
              placeholder="Ej: ES0000000000000000AA0F"
              className="font-mono uppercase"
              {...register("cau")}
              aria-invalid={!!errors.cau}
            />
            {errors.cau ? (
              <p className="text-xs text-[#DC2626]">{errors.cau.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Código de Autoconsumo Unificado asignado por la distribuidora
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="anio">
              Año <span className="text-[#DC2626]">*</span>
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
              <p className="text-xs text-[#DC2626]">{errors.anio.message}</p>
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
              Modalidad <span className="text-[#DC2626]">*</span>
            </Label>
            <Select
              defaultValue={watch("modalidad")}
              onValueChange={(v) =>
                setValue("modalidad", v as FormInstalacion["modalidad"], { shouldDirty: true })
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
              <p className="text-xs text-[#DC2626]">{errors.modalidad.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tecnologia">
              Tecnología <span className="text-[#DC2626]">*</span>
            </Label>
            <Select
              defaultValue={watch("tecnologia")}
              onValueChange={(v) =>
                setValue("tecnologia", v as FormInstalacion["tecnologia"], { shouldDirty: true })
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
              <p className="text-xs text-[#DC2626]">{errors.potenciaKw.message}</p>
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
              <p className="text-xs text-[#DC2626]">{errors.codigoPostal.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Acciones (solo creación) ── */}
      {!esEdicion && (
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
            {isSubmitting ? "Creando..." : "Crear instalación"}
          </Button>
        </div>
      )}
    </form>
  );
}
