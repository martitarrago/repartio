import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
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
    <div className="flex flex-col">
      <Header title="Instalaciones" />

      <div className="flex-1 px-8 pb-8 space-y-6">

        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {/* Stats as plain inline text */}
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
          <Button asChild>
            <Link href="/installations/new">
              <Plus className="h-3.5 w-3.5" />
              Nueva instalación
            </Link>
          </Button>
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
          <div
            className="flex flex-col items-center justify-center rounded-lg bg-white py-24 text-center"
            style={{
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F4F5]">
              <Plus className="h-5 w-5 text-[#A1A1AA]" />
            </div>
            <p className="text-sm font-medium text-[#18181B]">No tienes instalaciones</p>
            <p className="mt-1 text-2xs text-[#A1A1AA]">
              Crea tu primera comunidad de autoconsumo colectivo.
            </p>
            <Button asChild className="mt-6">
              <Link href="/installations/new">
                <Plus className="h-3.5 w-3.5" />
                Nueva instalación
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {instalaciones.map((i) => (
              <InstallationCard key={i.id} instalacion={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
