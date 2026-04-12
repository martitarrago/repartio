import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InstalacionResumen } from "@/types/editor";

const ESTADO_BADGE: Record<
  InstalacionResumen["estado"],
  { label: string; className: string }
> = {
  BORRADOR: {
    label: "Borrador",
    className: "border border-[#E5E7EB] bg-transparent text-[#6B7280]",
  },
  ACTIVA: {
    label: "Activa",
    className: "border-transparent bg-[#22C55E]/10 text-[#16a34a]",
  },
  SUSPENDIDA: {
    label: "Suspendida",
    className: "border-transparent bg-[#F59E0B]/10 text-[#d97706]",
  },
  BAJA: {
    label: "Baja",
    className: "border-transparent bg-[#EF4444]/10 text-[#dc2626]",
  },
};

const TECNOLOGIA_LABEL: Record<InstalacionResumen["tecnologia"], string> = {
  FOTOVOLTAICA: "Fotovoltaica",
  EOLICA: "Eólica",
  HIDRAULICA: "Hidráulica",
  COGENERACION: "Cogeneración",
  BIOMASA: "Biomasa",
  OTRAS: "Otras",
};

const MODALIDAD_LABEL: Record<InstalacionResumen["modalidad"], string> = {
  INDIVIDUAL_SIN_EXCEDENTES: "Individual sin excedentes",
  INDIVIDUAL_CON_EXCEDENTES: "Individual con excedentes",
  COLECTIVO_SIN_EXCEDENTES: "Colectivo sin excedentes",
  COLECTIVO_CON_EXCEDENTES: "Colectivo con excedentes",
  SERVICIOS_AUXILIARES: "Servicios auxiliares",
};

interface InstallationCardProps {
  instalacion: InstalacionResumen;
}

export function InstallationCard({ instalacion }: InstallationCardProps) {
  const estadoBadge = ESTADO_BADGE[instalacion.estado];

  return (
    <Card className="group border border-[#E5E7EB] bg-white shadow-none transition-shadow hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icono con amarillo energía */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5C518]/15">
              <Zap className="h-5 w-5 text-[#d4a800]" />
            </div>
            <div>
              <h3 className="font-semibold leading-tight text-[#1A1A1A] line-clamp-1">
                {instalacion.nombre}
              </h3>
              <p className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                {instalacion.cau}
              </p>
            </div>
          </div>
          {/* Badge de estado con colores semánticos */}
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0 ${estadoBadge.className}`}
          >
            {estadoBadge.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <div className="flex items-center gap-1.5 text-[#6B7280]">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
            <span>Año {instalacion.anio}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#6B7280]">
            <Users className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
            <span>
              {instalacion.totalParticipantes}{" "}
              participante{instalacion.totalParticipantes !== 1 ? "s" : ""}
            </span>
          </div>
          {(instalacion.municipio || instalacion.provincia) && (
            <div className="col-span-2 flex items-center gap-1.5 text-[#6B7280]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
              <span className="truncate">
                {[instalacion.municipio, instalacion.provincia]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[#6B7280]">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
            <span className="truncate">
              {TECNOLOGIA_LABEL[instalacion.tecnologia]}
            </span>
          </div>
          {instalacion.potenciaKw && (
            <div className="flex items-center gap-1.5 text-[#6B7280]">
              <Zap className="h-3.5 w-3.5 shrink-0 text-[#F5C518]" />
              <span>{instalacion.potenciaKw} kW</span>
            </div>
          )}
        </div>

        <p className="text-xs text-[#9CA3AF] truncate">
          {MODALIDAD_LABEL[instalacion.modalidad]}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-[#F3F4F6] pt-3">
        {instalacion.tieneConjuntoValidado ? (
          <div className="flex items-center gap-1.5 text-xs text-[#16a34a]">
            <BadgeCheck className="h-3.5 w-3.5" />
            <span>Reparto validado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-[#d97706]">
            <Clock className="h-3.5 w-3.5" />
            <span>Sin validar</span>
          </div>
        )}

        <Button
          asChild
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-xs text-[#6B7280] hover:text-[#1A1A1A]"
        >
          <Link href={`/installations/${instalacion.id}`}>
            Abrir
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
