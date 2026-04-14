import Link from "next/link";
import { Users } from "lucide-react";
import type { InstalacionResumen } from "@/types/editor";

const ESTADO: Record<
  InstalacionResumen["estado"],
  { label: string; className: string }
> = {
  ACTIVA:     { label: "Activa",     className: "bg-yellow-100 text-yellow-800" },
  BORRADOR:   { label: "Borrador",   className: "bg-[#FEF9C3] text-[#A16207]" },
  SUSPENDIDA: { label: "Suspendida", className: "bg-[#FEF9C3] text-[#A16207]" },
  BAJA:       { label: "Baja",       className: "bg-[#FEF2F2] text-[#DC2626]" },
};

export function InstallationCard({ instalacion }: { instalacion: InstalacionResumen }) {
  const estado = ESTADO[instalacion.estado];
  const direccion = [instalacion.municipio, instalacion.provincia]
    .filter(Boolean)
    .join(", ");

  return (
    <Link href={`/installations/${instalacion.id}`} className="group block hover-lift">
      <div className="glass-card rounded-lg p-5 transition-all duration-300">
        {/* Header: name + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold font-heading text-foreground group-hover:text-primary transition-colors">
              {instalacion.nombre}
            </p>
            {direccion && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {direccion}
              </p>
            )}
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${estado.className}`}
          >
            {estado.label}
          </span>
        </div>

        {/* Footer: participants */}
        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {instalacion.totalParticipantes} participante{instalacion.totalParticipantes !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
