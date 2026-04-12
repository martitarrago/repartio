import Link from "next/link";
import type { InstalacionResumen } from "@/types/editor";

const ESTADO: Record<
  InstalacionResumen["estado"],
  { label: string; className: string }
> = {
  ACTIVA:     { label: "Activa",     className: "bg-[#E0F2FE] text-[#0369A1]" },
  BORRADOR:   { label: "Borrador",   className: "bg-[#FEF9C3] text-[#A16207]" },
  SUSPENDIDA: { label: "Suspendida", className: "bg-[#FEF9C3] text-[#A16207]" },
  BAJA:       { label: "Baja",       className: "bg-[#FEF2F2] text-[#DC2626]" },
};

export function InstallationCard({ instalacion }: { instalacion: InstalacionResumen }) {
  const estado = ESTADO[instalacion.estado];

  return (
    <Link href={`/installations/${instalacion.id}`} className="group block">
      <div
        className="rounded-lg bg-white p-5 transition-all duration-200 hover:-translate-y-px"
        style={{
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)";
        }}
      >
        {/* Header: name + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-[#18181B]">
              {instalacion.nombre}
            </p>
            <p className="mt-0.5 font-mono text-2xs text-[#A1A1AA]">
              {instalacion.cau}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-[999px] px-2.5 py-0.5 text-[11px] font-medium ${estado.className}`}
          >
            {estado.label}
          </span>
        </div>

        {/* Meta line */}
        <p className="mt-3 text-sm text-[#71717A]">
          {instalacion.anio} · {instalacion.totalParticipantes} participante{instalacion.totalParticipantes !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
