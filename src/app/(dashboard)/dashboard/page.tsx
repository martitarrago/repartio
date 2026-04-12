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
    <div className="mx-auto w-full max-w-6xl px-8 py-8 space-y-6">
      {/* Title + button */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#18181B]">Tus instalaciones</h1>
          <p className="text-sm text-[#71717A]">
            <span className="font-semibold text-[#18181B]">{instalaciones.length}</span> total
            {" · "}
            <span className="font-semibold text-[#18181B]">{activas}</span> activas
            {" · "}
            <span className="font-semibold text-[#18181B]">{validadas}</span> validadas
            {" · "}
            <span className="font-semibold text-[#18181B]">{totalParticipantes}</span> participantes
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A1A1AA]" />
          <input
            placeholder="Buscar..."
            className="flex h-8 w-full rounded-md bg-[#F4F4F5] px-3 pl-9 py-2 text-sm text-[#18181B] placeholder:text-[#A1A1AA] transition-all duration-150 focus:outline-none focus:border focus:border-[#18181B] focus:bg-white"
          />
        </div>
      </div>

      {/* Grid or empty state */}
      {instalaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg bg-white py-24 text-center border border-black/[0.06] shadow-card">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF3C7]">
            <Sun className="h-6 w-6 text-[#E5A500]" />
          </div>
          <p className="text-sm font-medium text-[#18181B]">
            Añade tu primera comunidad solar
          </p>
          <p className="mt-1 text-2xs text-[#A1A1AA] max-w-sm">
            Crea tu primera instalación de autoconsumo colectivo y genera ficheros de reparto.
          </p>
          <Link
            href="/installations/new"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-[#18181B] px-4 py-2 text-sm font-medium text-white hover:bg-[#27272A] transition-colors"
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
            className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E4E4E7] bg-transparent p-5 text-center transition-all duration-200 hover:border-[#A1A1AA] hover:bg-white/50 min-h-[120px]"
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F4F5] group-hover:bg-[#E4E4E7] transition-colors">
              <Plus className="h-4 w-4 text-[#A1A1AA] group-hover:text-[#71717A]" />
            </div>
            <p className="text-sm font-medium text-[#A1A1AA] group-hover:text-[#71717A]">
              Nueva instalación
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}
