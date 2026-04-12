import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  FileText,
  Pencil,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { InstallationForm } from "@/components/installations/InstallationForm";
import { ParticipantesTab } from "@/components/installations/ParticipantesTab";
import { HistorialTab } from "@/components/installations/HistorialTab";
import { EditorCoeficientesLazy } from "@/components/editor/EditorCoeficientesLazy";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { InstalacionResumen, Participante } from "@/types/editor";
import type { RegistroHistorial } from "@/components/installations/HistorialTab";

// ─── Carga de datos desde Prisma ─────────────────────────────────────────────

async function getInstalacion(
  id: string,
  organizacionId: string
): Promise<{
  instalacion: InstalacionResumen;
  participantes: Participante[];
  historial: RegistroHistorial[];
  conjuntoActivoId: string | undefined;
} | null> {
  const inst = await prisma.instalacion.findFirst({
    where: { id, organizacionId },
    include: {
      _count: { select: { participantes: { where: { activo: true } } } },
      conjuntos: {
        where: { estado: { in: ["VALIDADO", "PUBLICADO"] } },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!inst) return null;

  const participantesRaw = await prisma.participante.findMany({
    where: { instalacionId: id, activo: true },
    orderBy: { orden: "asc" },
  });

  const historialRaw = await prisma.historialFichero.findMany({
    where: { conjunto: { instalacionId: id } },
    include: { generadoPor: { select: { email: true } } },
    orderBy: { generadoEn: "desc" },
    take: 50,
  });

  const conjuntoActivo = await prisma.conjuntoCoeficientes.findFirst({
    where: { instalacionId: id, estado: { not: "ARCHIVADO" } },
    orderBy: { actualizadoEn: "desc" },
    select: { id: true },
  });

  const instalacion: InstalacionResumen = {
    id: inst.id,
    nombre: inst.nombre,
    cau: inst.cau,
    anio: inst.anio,
    modalidad: inst.modalidad,
    tecnologia: inst.tecnologia,
    estado: inst.estado,
    municipio: inst.municipio ?? undefined,
    provincia: inst.provincia ?? undefined,
    potenciaKw: inst.potenciaKw ? Number(inst.potenciaKw) : undefined,
    totalParticipantes: inst._count.participantes,
    tieneConjuntoValidado: inst.conjuntos.length > 0,
    creadaEn: inst.creadaEn.toISOString(),
    actualizadaEn: inst.actualizadaEn.toISOString(),
  };

  const participantes: Participante[] = participantesRaw.map((p) => ({
    id: p.id,
    cups: p.cups,
    nombre: p.nombre,
    descripcion: p.descripcion ?? undefined,
    orden: p.orden,
    activo: p.activo,
  }));

  const historial: RegistroHistorial[] = historialRaw.map((h) => ({
    id: h.id,
    nombreFichero: h.nombreFichero,
    modo: h.modo,
    totalLineas: h.totalLineas,
    totalParticipantes: h.totalParticipantes,
    verificacionSuma: h.verificacionSuma,
    generadoEn: h.generadoEn.toISOString(),
    generadoPor: h.generadoPor?.email ?? undefined,
    storageUrl: h.storageUrl ?? undefined,
  }));

  return { instalacion, participantes, historial, conjuntoActivoId: conjuntoActivo?.id };
}

// ─── Badge de estado ──────────────────────────────────────────────────────────

const ESTADO_BADGE = {
  BORRADOR:   { label: "Borrador",   variant: "warning"  as const },
  ACTIVA:     { label: "Activa",     variant: "success"  as const },
  SUSPENDIDA: { label: "Suspendida", variant: "warning"  as const },
  BAJA:       { label: "Baja",       variant: "error"    as const },
};

const MODALIDAD_LABEL: Record<string, string> = {
  INDIVIDUAL_SIN_EXCEDENTES: "Individual sin excedentes",
  INDIVIDUAL_CON_EXCEDENTES: "Individual con excedentes",
  COLECTIVO_SIN_EXCEDENTES: "Colectivo sin excedentes",
  COLECTIVO_CON_EXCEDENTES: "Colectivo con excedentes",
  SERVICIOS_AUXILIARES: "Servicios auxiliares",
};

const TECNOLOGIA_LABEL: Record<string, string> = {
  FOTOVOLTAICA: "Fotovoltaica",
  EOLICA: "Eólica",
  HIDRAULICA: "Hidráulica",
  COGENERACION: "Cogeneración",
  BIOMASA: "Biomasa",
  OTRAS: "Otras",
};

// ─── Página ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function InstalacionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;
  const session = await auth();
  const organizacionId = (session?.user as any)?.organizacionId as string;
  const datos = await getInstalacion(id, organizacionId);

  if (!datos) notFound();

  const { instalacion, participantes, historial, conjuntoActivoId } = datos;
  const estadoBadge = ESTADO_BADGE[instalacion.estado];
  const tabActiva = tab ?? "detalles";

  return (
    <div className="flex flex-col h-full">
      <Header breadcrumb={instalacion.nombre} />

      {/* Barra de info rápida */}
      <div className="border-b border-[#E5E7EB] bg-white px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
            <span className="text-[#9CA3AF]">
              <span className="font-medium text-[#374151]">Modalidad:</span>{" "}
              {MODALIDAD_LABEL[instalacion.modalidad]}
            </span>
            <span className="text-[#9CA3AF]">
              <span className="font-medium text-[#374151]">Tecnología:</span>{" "}
              {TECNOLOGIA_LABEL[instalacion.tecnologia]}
            </span>
            {instalacion.potenciaKw && (
              <span className="text-[#9CA3AF]">
                <span className="font-medium text-[#374151]">Potencia:</span>{" "}
                {instalacion.potenciaKw} kW
              </span>
            )}
            <span className="text-[#9CA3AF]">
              <span className="font-medium text-[#374151]">Participantes:</span>{" "}
              {instalacion.totalParticipantes}
            </span>
            {instalacion.tieneConjuntoValidado && (
              <span className="text-[#059669]">Reparto validado</span>
            )}
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard">
              <ChevronLeft className="h-3.5 w-3.5" />
              Volver
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue={tabActiva} className="flex flex-col h-full">
          <div className="border-b border-[#E5E7EB] bg-white px-6 pt-1">
            <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0">
              {["detalles", "participantes", "coeficientes", "historial", "descargas"].map((value) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-medium capitalize text-[#6B7280] transition-colors duration-150 data-[state=active]:border-[#FF2D8D] data-[state=active]:text-[#0A0A0A] data-[state=active]:shadow-none"
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Detalles ── */}
          <TabsContent value="detalles" className="mt-0 flex-1">
            <div className="p-6">
              <div className="mx-auto max-w-2xl">
                <InstallationForm
                  instalacionId={instalacion.id}
                  valoresIniciales={{
                    nombre: instalacion.nombre,
                    cau: instalacion.cau,
                    anio: instalacion.anio,
                    modalidad: instalacion.modalidad,
                    tecnologia: instalacion.tecnologia,
                    potenciaKw: instalacion.potenciaKw,
                    municipio: instalacion.municipio,
                    provincia: instalacion.provincia,
                  }}
                />
              </div>
            </div>
          </TabsContent>

          {/* ── Participantes ── */}
          <TabsContent value="participantes" className="mt-0">
            <div className="p-6">
              <ParticipantesTab
                instalacionId={instalacion.id}
                participantesIniciales={participantes}
              />
            </div>
          </TabsContent>

          {/* ── Coeficientes ── */}
          <TabsContent value="coeficientes" className="mt-0">
            <div className="p-6">
              <CoeficientesTabPlaceholder
                instalacionId={instalacion.id}
                cau={instalacion.cau}
                anio={instalacion.anio}
                participantes={participantes}
                conjuntoId={conjuntoActivoId}
              />
            </div>
          </TabsContent>

          {/* ── Historial ── */}
          <TabsContent value="historial" className="mt-0">
            <div className="p-6">
              <HistorialTab registros={historial} />
            </div>
          </TabsContent>

          {/* ── Descargas ── */}
          <TabsContent value="descargas" className="mt-0">
            <div className="p-6">
              <DescargasTab instalacion={instalacion} historial={historial} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Placeholder del editor de coeficientes ───────────────────────────────────
// En producción, reemplazar por EditorCoeficientesContainer

function CoeficientesTabPlaceholder({
  instalacionId,
  cau,
  anio,
  participantes,
  conjuntoId,
}: {
  instalacionId: string;
  cau: string;
  anio: number;
  participantes: Participante[];
  conjuntoId?: string;
}) {
  if (participantes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Zap className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">Sin participantes</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Añade al menos un participante en la pestaña{" "}
          <strong>Participantes</strong> antes de configurar los coeficientes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">Editor de coeficientes β</h3>
        <p className="text-sm text-muted-foreground">
          Define el reparto de autoconsumo entre los {participantes.length}{" "}
          participantes para el año {anio}
        </p>
      </div>
      <Separator />
      <EditorCoeficientesLazy
        instalacionId={instalacionId}
        cau={cau}
        anio={anio}
        participantes={participantes}
        conjuntoId={conjuntoId}
      />
    </div>
  );
}

// ─── Tab Descargas ────────────────────────────────────────────────────────────

function DescargasTab({
  instalacion,
  historial,
}: {
  instalacion: InstalacionResumen;
  historial: RegistroHistorial[];
}) {
  const ultimoFichero = historial[0];

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="font-medium">Descargas</h3>
        <p className="text-sm text-muted-foreground">
          Descarga el fichero .txt listo para enviar a la distribuidora
        </p>
      </div>
      <Separator />

      {!instalacion.tieneConjuntoValidado ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Reparto pendiente de validación</p>
          <p className="mt-1 text-amber-700">
            Para descargar el fichero oficial, primero valida los coeficientes en
            la pestaña <strong>Coeficientes</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Fichero de coeficientes</p>
                <p className="text-sm text-muted-foreground">
                  Formato Anejo I — RD 244/2019
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Instalación</p>
                <p className="font-medium truncate">{instalacion.nombre}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CAU</p>
                <p className="font-mono text-xs">{instalacion.cau}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Año</p>
                <p className="font-medium">{instalacion.anio}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Participantes</p>
                <p className="font-medium">{instalacion.totalParticipantes}</p>
              </div>
            </div>

            {ultimoFichero ? (
              <div className="space-y-3">
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Último fichero generado:{" "}
                  {new Date(ultimoFichero.generadoEn).toLocaleString("es-ES")}
                </p>
                {ultimoFichero.storageUrl ? (
                  <Button asChild className="w-full">
                    <a href={ultimoFichero.storageUrl} download={ultimoFichero.nombreFichero}>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar fichero .txt
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    Fichero no disponible en almacenamiento
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                <p>Aún no has generado ningún fichero.</p>
                <p className="mt-1">
                  Ve a la pestaña <strong>Coeficientes</strong> y pulsa "Generar fichero".
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Información del formato</p>
            <p>Codificación: UTF-8 sin BOM</p>
            <p>Separador: punto y coma (;)</p>
            <p>Decimal: coma (,)</p>
            <p>Coeficientes: 6 decimales (ej: 0,333333)</p>
          </div>
        </div>
      )}
    </div>
  );
}
