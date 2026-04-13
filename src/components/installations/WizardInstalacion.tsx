"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { InstallationForm } from "./InstallationForm";
import { ParticipantesTab } from "./ParticipantesTab";
import { cn } from "@/lib/utils/cn";

// ─── Pasos ───────────────────────────────────────────────────────────────────

const PASOS = [
  { id: 1, nombre: "Detalles",      icono: Settings,  descripcion: "Datos básicos"       },
  { id: 2, nombre: "Participantes", icono: Users,     descripcion: "Consumidores"         },
  { id: 3, nombre: "Coeficientes",  icono: Zap,       descripcion: "Reparto"             },
  { id: 4, nombre: "Documento",     icono: FileText,  descripcion: "Fichero .txt"        },
] as const;

const TOTAL = PASOS.length;

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ pasoActual }: { pasoActual: number }) {
  return (
    <div className="flex items-center gap-2">
      {PASOS.map((paso, i) => {
        const completado = pasoActual > paso.id;
        const activo    = pasoActual === paso.id;
        const Icono     = paso.icono;

        return (
          <div key={paso.id} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-6 sm:w-10 flex-shrink-0 transition-colors duration-300",
                  completado ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                  completado
                    ? "bg-primary text-primary-foreground"
                    : activo
                    ? "border-2 border-primary text-primary bg-primary/5"
                    : "border border-border text-muted-foreground bg-background"
                )}
              >
                {completado ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icono className="h-3 w-3" />
                )}
              </div>
              <div className="hidden sm:block">
                <p
                  className={cn(
                    "text-xs font-medium leading-none",
                    activo ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {paso.nombre}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Wizard ──────────────────────────────────────────────────────────────────

export function WizardInstalacion() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [instalacionId, setInstalacionId] = useState<string | null>(null);

  const progreso = ((paso - 1) / (TOTAL - 1)) * 100;

  function handleCreated(id: string) {
    setInstalacionId(id);
    setPaso(2);
  }

  function irASiguiente() {
    if (paso < TOTAL) setPaso(paso + 1);
  }

  function irAAnterior() {
    if (paso > 1) setPaso(paso - 1);
  }

  function irAInstalacionConTab(tab: string) {
    if (instalacionId) {
      router.push(`/installations/${instalacionId}?tab=${tab}`);
      router.refresh();
    }
  }

  function irAInstalacion() {
    if (instalacionId) {
      router.push(`/installations/${instalacionId}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Progreso */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Paso {paso} de {TOTAL}
        </span>
        <div className="w-full max-w-md">
          <Progress value={progreso} className="h-1.5" />
        </div>
      </div>

      {/* Stepper */}
      <div className="flex justify-center">
        <Stepper pasoActual={paso} />
      </div>

      <Separator />

      {/* Contenido */}
      <div className="mx-auto max-w-2xl">

        {/* Paso 1: Detalles */}
        {paso === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold font-heading">
                Datos de la instalación
              </h2>
              <p className="text-sm text-muted-foreground">
                Rellena los datos básicos de la comunidad de autoconsumo.
              </p>
            </div>
            <InstallationForm onCreated={handleCreated} />
          </div>
        )}

        {/* Paso 2: Participantes */}
        {paso === 2 && instalacionId && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold font-heading">
                Añadir participantes
              </h2>
              <p className="text-sm text-muted-foreground">
                Añade los consumidores que forman parte de esta comunidad.
              </p>
            </div>
            <ParticipantesTab
              instalacionId={instalacionId}
              participantesIniciales={[]}
            />
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" size="sm" onClick={irAAnterior} disabled>
                <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
                Anterior
              </Button>
              <Button size="sm" onClick={irASiguiente}>
                Siguiente
                <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 3: Coeficientes */}
        {paso === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold font-heading">
                Configurar coeficientes
              </h2>
              <p className="text-sm text-muted-foreground">
                Define el reparto de autoconsumo entre los participantes.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
              <Zap className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">Editor de coeficientes</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                El editor completo está disponible en la página de la
                instalación.
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => irAInstalacionConTab("coeficientes")}
              >
                Ir al editor
                <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={irAAnterior}>
                <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={irASiguiente}>
                Saltar
                <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 4: Documento */}
        {paso === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold font-heading">
                Documento .txt
              </h2>
              <p className="text-sm text-muted-foreground">
                Genera el fichero de coeficientes para la distribuidora.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">Generación del fichero</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Primero configura los coeficientes. La generación está
                disponible en la pestaña .txt de la instalación.
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => irAInstalacionConTab("documento")}
              >
                Ir a .txt
                <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={irAAnterior}>
                <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
                Anterior
              </Button>
              <Button size="sm" onClick={irAInstalacion}>
                Ver instalación
                <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
