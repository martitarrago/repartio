import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { InstalacionResumen } from "@/types/editor";

const ESTADO: Record<
  InstalacionResumen["estado"],
  { label: string; className: string }
> = {
  ACTIVA:     { label: "Activa",     className: "bg-[#ECFDF5] text-[#059669]" },
  BORRADOR:   { label: "Borrador",   className: "bg-[#FEF9C3] text-[#A16207]" },
  SUSPENDIDA: { label: "Suspendida", className: "bg-[#FEF9C3] text-[#A16207]" },
  BAJA:       { label: "Baja",       className: "bg-[#FEF2F2] text-[#DC2626]" },
};

const TECNOLOGIA: Record<InstalacionResumen["tecnologia"], string> = {
  FOTOVOLTAICA: "Fotovoltaica",
  EOLICA: "Eólica",
  HIDRAULICA: "Hidráulica",
  COGENERACION: "Cogeneración",
  BIOMASA: "Biomasa",
  OTRAS: "Otras",
};

const MODALIDAD: Record<InstalacionResumen["modalidad"], string> = {
  INDIVIDUAL_SIN_EXCEDENTES: "Individual sin excedentes",
  INDIVIDUAL_CON_EXCEDENTES: "Individual con excedentes",
  COLECTIVO_SIN_EXCEDENTES:  "Colectivo sin excedentes",
  COLECTIVO_CON_EXCEDENTES:  "Colectivo con excedentes",
  SERVICIOS_AUXILIARES:      "Servicios auxiliares",
};

export function InstallationCard({ instalacion }: { instalacion: InstalacionResumen }) {
  const estado = ESTADO[instalacion.estado];

  return (
    <Link href={`/installations/${instalacion.id}`} className="group block">
      <Card className="transition-shadow duration-150 hover:shadow-sm">
        <CardContent className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#0A0A0A]">
                {instalacion.nombre}
              </p>
              <p className="mt-0.5 font-mono text-xs text-[#9CA3AF]">
                {instalacion.cau}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${estado.className}`}
            >
              {estado.label}
            </span>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-[#F3F4F6]" />

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <div>
              <p className="text-[#9CA3AF]">Año</p>
              <p className="mt-0.5 font-medium text-[#374151]">{instalacion.anio}</p>
            </div>
            <div>
              <p className="text-[#9CA3AF]">Participantes</p>
              <p className="mt-0.5 font-medium text-[#374151]">{instalacion.totalParticipantes}</p>
            </div>
            <div>
              <p className="text-[#9CA3AF]">Tecnología</p>
              <p className="mt-0.5 font-medium text-[#374151]">{TECNOLOGIA[instalacion.tecnologia]}</p>
            </div>
            <div>
              <p className="text-[#9CA3AF]">Potencia</p>
              <p className="mt-0.5 font-medium text-[#374151]">
                {instalacion.potenciaKw ? `${instalacion.potenciaKw} kW` : "—"}
              </p>
            </div>
            {(instalacion.municipio || instalacion.provincia) && (
              <div className="col-span-2">
                <p className="text-[#9CA3AF]">Ubicación</p>
                <p className="mt-0.5 truncate font-medium text-[#374151]">
                  {[instalacion.municipio, instalacion.provincia].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">{MODALIDAD[instalacion.modalidad]}</span>
            <span className="flex items-center gap-0.5 text-xs text-[#9CA3AF] transition-colors duration-150 group-hover:text-[#0A0A0A]">
              Ver
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
