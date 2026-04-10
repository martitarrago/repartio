import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Calendar,
  ChevronRight,
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
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  BORRADOR: { label: "Borrador", variant: "secondary" },
  ACTIVA: { label: "Activa", variant: "default" },
  SUSPENDIDA: { label: "Suspendida", variant: "outline" },
  BAJA: { label: "Baja", variant: "destructive" },
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
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold leading-tight text-foreground line-clamp-1">
                {instalacion.nombre}
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {instalacion.cau}
              </p>
            </div>
          </div>
          <Badge variant={estadoBadge.variant} className="shrink-0">
            {estadoBadge.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Año {instalacion.anio}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{instalacion.totalParticipantes} participante{instalacion.totalParticipantes !== 1 ? "s" : ""}</span>
          </div>
          {(instalacion.municipio || instalacion.provincia) && (
            <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {[instalacion.municipio, instalacion.provincia]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{TECNOLOGIA_LABEL[instalacion.tecnologia]}</span>
          </div>
          {instalacion.potenciaKw && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span>{instalacion.potenciaKw} kW</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground truncate">
          {MODALIDAD_LABEL[instalacion.modalidad]}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0">
        {instalacion.tieneConjuntoValidado ? (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <BadgeCheck className="h-3.5 w-3.5" />
            <span>Reparto validado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Sin validar</span>
          </div>
        )}

        <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs">
          <Link href={`/installations/${instalacion.id}`}>
            Abrir
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
