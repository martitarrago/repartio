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
import { Separator } from "@/components/ui/separator";
import { InstallationForm } from "./InstallationForm";
import { ParticipantesTab } from "./ParticipantesTab";
import { cn } from "@/lib/utils/cn";

// ─── Pasos del wizard ────────────────────────────────────────────────────────

const PASOS = [
  { id: 1, nombre: "Detalles", icono: Settings, descripcion: "Datos de la instalación" },
  { id: 2, nombre: "Participantes", icono: Users, descripcion: "Consumidores asociados" },
  { id: 3, nombre: "Coeficientes", icono: Zap, descripcion: "Reparto de autoconsumo" },
  { id: 4, nombre: "Documento", icono: FileText, descripcion: "Generar fichero .txt" },
] as const;

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ pasoActual }: { pasoActual: number }) {
  return (
    <nav className="flex items-center gap-2">
      {PASOS.map((paso, i) => {
        const completado = pasoActual > paso.id;
        const activo = pasoActual === paso.id;
        const Icono = paso.icono;

        return (
          <div key={paso.id} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8 sm:w-12",
                  completado ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  completado
                    ? "bg-primary text-primary-foreground"
                    : activo
                    ? "border-2 border-primary text-primary"
                    : "border border-border text-muted-foreground"
                )}
              >
                {completado ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icono className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="hidden sm:block">
                <p
                  className={cn(
                    "text-xs font-medium",
                    activo ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {paso.nombre}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {paso.descripcion}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// ─── Wizard ──────────────────────────────────────────────────────────────────

export function WizardInstalacion() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [instalacionId, setInstalacionId] = useState<string | null>(null);

  function handleCreated(id: string) {
    setInstalacionId(id);
    setPaso(2);
  }

  function irASiguiente() {
    if (paso < 4) setPaso(paso + 1);
  }

  function irAAnterior() {
    if (paso > 1) setPaso(paso - 1);
  }

  function irAInstalacion() {
    if (instalacionId) {
      router.push(`/installations/${instalacionId}`);
      router.refresh();
    }
  }

  function irAInstalacionConTab(tab: string) {
    if (instalacionId) {
      router.push(`/installations/${instalacionId}?tab=${tab}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex justify-center">
        <Stepper pasoActual={paso} />
      </div>

      <Separator />

      {/* Contenido del paso */}
      <div className="mx-auto max-w-2xl">
        {/* Paso 1: Detalles */}
        {paso === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Datos de la instalación</h2>
              <p className="text-sm text-muted-foreground">
                Rellena los datos básicos de la comunidad de autoconsumo
              </p>
            </div>
            <InstallationForm onCreated={handleCreated} />
          </div>
        )}

        {/* Paso 2: Participantes */}
        {paso === 2 && instalacionId && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Añadir participantes</h2>
              <p className="text-sm text-muted-foreground">
                Añade los consumidores que forman parte de esta comunidad
              </p>
            </div>
            <ParticipantesTab
              instalacionId={instalacionId}
              participantesIniciales={[]}
            />
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={irAAnterior} disabled>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button onClick={irASiguiente}>
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 3: Coeficientes (redirige a la instalación) */}
        {paso === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Configurar coeficientes</h2>
              <p className="text-sm text-muted-foreground">
                Define el reparto de autoconsumo entre los participantes
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <Zap className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">Editor de coeficientes</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                El editor completo de coeficientes está disponible en la página
                de la instalación. Haz clic para continuar allí.
              </p>
              <Button
                className="mt-4"
                onClick={() => irAInstalacionConTab("coeficientes")}
              >
                Ir al editor de coeficientes
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={irAAnterior}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button onClick={irASiguiente}>
                Saltar
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 4: Documento */}
        {paso === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Documento .txt</h2>
              <p className="text-sm text-muted-foreground">
                Genera el fichero de coeficientes para la distribuidora
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">Generación del fichero</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Primero configura los coeficientes. La generación del fichero
                está disponible en la pestaña Documento .txt de la instalación.
              </p>
              <Button
                className="mt-4"
                onClick={() => irAInstalacionConTab("documento")}
              >
                Ir a Documento .txt
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={irAAnterior}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button onClick={irAInstalacion}>
                Ir a la instalación
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
