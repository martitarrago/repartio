import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
import { InstallationCard } from "@/components/installations/InstallationCard";
import type { InstalacionResumen } from "@/types/editor";

// ─── Datos de ejemplo (reemplazar con Prisma) ─────────────────────────────────
const DEMO_INSTALACIONES: InstalacionResumen[] = [
  {
    id: "1",
    nombre: "Comunidad Solar Parque Sur",
    cau: "ES0000000000000001AA0F",
    anio: 2024,
    modalidad: "COLECTIVO_CON_EXCEDENTES",
    tecnologia: "FOTOVOLTAICA",
    estado: "ACTIVA",
    municipio: "Madrid",
    provincia: "Madrid",
    potenciaKw: 50,
    totalParticipantes: 12,
    tieneConjuntoValidado: true,
    creadaEn: "2024-01-15T10:00:00Z",
    actualizadaEn: "2024-03-20T14:30:00Z",
  },
  {
    id: "2",
    nombre: "Bloque Energético Residencial Norte",
    cau: "ES0000000000000002BB0F",
    anio: 2024,
    modalidad: "COLECTIVO_SIN_EXCEDENTES",
    tecnologia: "FOTOVOLTAICA",
    estado: "BORRADOR",
    municipio: "Barcelona",
    provincia: "Barcelona",
    potenciaKw: 30,
    totalParticipantes: 8,
    tieneConjuntoValidado: false,
    creadaEn: "2024-02-01T09:00:00Z",
    actualizadaEn: "2024-02-10T11:00:00Z",
  },
  {
    id: "3",
    nombre: "Cooperativa Eólica La Ribera",
    cau: "ES0000000000000003CC0F",
    anio: 2023,
    modalidad: "COLECTIVO_CON_EXCEDENTES",
    tecnologia: "EOLICA",
    estado: "ACTIVA",
    municipio: "Zaragoza",
    provincia: "Zaragoza",
    potenciaKw: 200,
    totalParticipantes: 45,
    tieneConjuntoValidado: true,
    creadaEn: "2023-06-01T08:00:00Z",
    actualizadaEn: "2023-12-01T16:00:00Z",
  },
];

// ─── Estadísticas resumen ─────────────────────────────────────────────────────

function StatCard({
  titulo,
  valor,
  descripcion,
}: {
  titulo: string;
  valor: string | number;
  descripcion: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{descripcion}</p>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  // TODO: reemplazar con Prisma + auth
  const instalaciones = DEMO_INSTALACIONES;

  const activas = instalaciones.filter((i) => i.estado === "ACTIVA").length;
  const validadas = instalaciones.filter((i) => i.tieneConjuntoValidado).length;
  const totalParticipantes = instalaciones.reduce(
    (sum, i) => sum + i.totalParticipantes,
    0
  );

  return (
    <div className="flex flex-col">
      <Header
        titulo="Instalaciones"
        subtitulo="Gestiona tus comunidades de autoconsumo colectivo"
        acciones={
          <Button asChild size="sm">
            <Link href="/installations/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva instalación
            </Link>
          </Button>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            titulo="Total instalaciones"
            valor={instalaciones.length}
            descripcion="En tu organización"
          />
          <StatCard
            titulo="Activas"
            valor={activas}
            descripcion="Con reparto en vigor"
          />
          <StatCard
            titulo="Validadas"
            valor={validadas}
            descripcion="Fichero listo para envío"
          />
          <StatCard
            titulo="Participantes"
            valor={totalParticipantes}
            descripcion="Consumidores totales"
          />
        </div>

        {/* Búsqueda y filtros */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o CAU..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Grid de instalaciones */}
        {instalaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Sin instalaciones</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Todavía no has creado ninguna instalación. Empieza creando tu
              primera comunidad de autoconsumo.
            </p>
            <Button asChild className="mt-6">
              <Link href="/installations/new">
                <Plus className="mr-2 h-4 w-4" />
                Crear primera instalación
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {instalaciones.map((instalacion) => (
              <InstallationCard key={instalacion.id} instalacion={instalacion} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
