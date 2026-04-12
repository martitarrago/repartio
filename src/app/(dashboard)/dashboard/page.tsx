import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
import { InstallationCard } from "@/components/installations/InstallationCard";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { InstalacionResumen } from "@/types/editor";

// ─── Página ───────────────────────────────────────────────────────────────────
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
      <Header breadcrumb="Instalaciones" />

      <div className="flex-1 px-8 py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold text-[#0A0A0A]">Instalaciones</h1>
          <Button asChild>
            <Link href="/installations/new">
              <Plus className="h-3.5 w-3.5" />
              Nueva instalación
            </Link>
          </Button>
        </div>

        {/* Stats strip — solo números */}
        <div className="flex items-center gap-0 divide-x divide-[#E5E7EB]">
          {[
            { valor: instalaciones.length, label: "Total" },
            { valor: activas,              label: "Activas" },
            { valor: validadas,            label: "Validadas" },
            { valor: totalParticipantes,   label: "Participantes" },
          ].map((stat) => (
            <div key={stat.label} className="px-6 first:pl-0 last:pr-0">
              <p className="text-[24px] font-semibold tabular-nums text-[#0A0A0A] leading-none">
                {stat.valor}
              </p>
              <p className="mt-1 text-[12px] text-[#9CA3AF]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            <Input placeholder="Buscar instalación o CAU…" className="pl-9" />
          </div>
        </div>

        {/* Grid o empty state */}
        {instalaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#E5E7EB] bg-white py-24 text-center">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
              <Plus className="h-5 w-5 text-[#D1D5DB]" />
            </div>
            <p className="text-sm font-medium text-[#374151]">No tienes instalaciones</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
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
