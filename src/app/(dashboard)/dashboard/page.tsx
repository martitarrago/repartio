import Link from "next/link";
import { Plus, Search, Sun } from "lucide-react";
import { InstallationCard } from "@/components/installations/InstallationCard";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { InstalacionResumen } from "@/types/editor";

export default async function DashboardPage() {
  const session = await auth();
  const organizacionId = (session?.user as any)?.organizacionId as string;

  const raw = await prisma.instalacion.findMany({
    where: { organizacionId },
    include: {
      _count: { select: { participantes: { where: { activo: true } } } },
      conjuntos: {
        where: { estado: { in: ["VALIDADO", "PUBLICADO"] } },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { actualizadaEn: "desc" },
  });

  const instalaciones: InstalacionResumen[] = raw.map((i) => ({
    id: i.id,
    nombre: i.nombre,
    cau: i.cau,
    anio: i.anio,
    modalidad: i.modalidad,
    tecnologia: i.tecnologia,
    estado: i.estado,
    municipio: i.municipio ?? undefined,
    provincia: i.provincia ?? undefined,
    potenciaKw: i.potenciaKw ? Number(i.potenciaKw) : undefined,
    totalParticipantes: i._count.participantes,
    tieneConjuntoValidado: i.conjuntos.length > 0,
    creadaEn: i.creadaEn.toISOString(),
    actualizadaEn: i.actualizadaEn.toISOString(),
  }));

  const activas = instalaciones.filter((i) => i.estado === "ACTIVA").length;
  const validadas = instalaciones.filter((i) => i.tieneConjuntoValidado).length;
  const totalParticipantes = instalaciones.reduce((s, i) => s + i.totalParticipantes, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-8 space-y-6 animate-fade-in">
      {/* Title + button */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold font-heading text-foreground">
            Tus instalaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{instalaciones.length}</span> total
            {" · "}
            <span className="font-semibold text-primary">{activas}</span> activas
            {" · "}
            <span className="font-semibold text-primary">{validadas}</span> validadas
            {" · "}
            <span className="font-semibold text-primary">{totalParticipantes}</span> participantes
          </p>
        </div>
        {instalaciones.length > 0 && (
          <Link
            href="/installations/new"
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white solar-gradient shadow-emerald hover:opacity-90 hover:-translate-y-px transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva instalación
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar..."
            className="flex h-8 w-full rounded-md bg-white/60 border border-border px-3 pl-9 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none focus:border-primary/40 focus:bg-white backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Grid or empty state */}
      {instalaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl glass-card py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-solar-light animate-float">
            <Sun className="h-7 w-7 text-solar-gold" />
          </div>
          <p className="text-base font-semibold font-heading text-foreground">
            Añade tu primera comunidad solar
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-sm">
            Crea tu primera instalación de autoconsumo colectivo y genera ficheros de reparto.
          </p>
          <Link
            href="/installations/new"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white solar-gradient shadow-emerald hover:opacity-90 transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva instalación
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {instalaciones.map((i) => (
            <InstallationCard key={i.id} instalacion={i} />
          ))}

          {/* Dashed create card */}
          <Link
            href="/installations/new"
            className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-transparent p-5 text-center transition-all duration-300 hover:border-primary/40 hover:bg-white/40 min-h-[120px] hover:-translate-y-1"
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted group-hover:bg-emerald-50 transition-colors">
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Nueva instalación
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}
