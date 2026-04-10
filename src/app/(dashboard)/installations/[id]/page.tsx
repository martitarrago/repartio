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
import type { InstalacionResumen, Participante } from "@/types/editor";
import type { RegistroHistorial } from "@/components/installations/HistorialTab";

// ─── Datos de ejemplo (reemplazar con Prisma) ─────────────────────────────────

async function getInstalacion(id: string): Promise<{
  instalacion: InstalacionResumen;
  participantes: Participante[];
  historial: RegistroHistorial[];
} | null> {
  // TODO: reemplazar con Prisma
  if (id === "nueva") return null;

  return {
    instalacion: {
      id,
      nombre: "Comunidad Solar Parque Sur",
      cau: "ES0000000000000001AA0F",
      anio: 2024,
      modalidad: "COLECTIVO_CON_EXCEDENTES",
      tecnologia: "FOTOVOLTAICA",
      estado: "ACTIVA",
      municipio: "Madrid",
      provincia: "Madrid",
      potenciaKw: 50,
      totalParticipantes: 3,
      tieneConjuntoValidado: true,
      creadaEn: "2024-01-15T10:00:00Z",
      actualizadaEn: "2024-03-20T14:30:00Z",
    },
    participantes: [
      {
        id: "p1",
        cups: "ES0000000000000001AA",
        nombre: "Piso 1A — García López",
        descripcion: "Propietario",
        orden: 0,
        activo: true,
      },
      {
        id: "p2",
        cups: "ES0000000000000002BB",
        nombre: "Piso 2B — Martínez Ruiz",
        descripcion: "Arrendatario",
        orden: 1,
        activo: true,
      },
      {
        id: "p3",
        cups: "ES0000000000000003CC",
        nombre: "Local Bajo — Comercial XYZ",
        orden: 2,
        activo: true,
      },
    ],
    historial: [
      {
        id: "h1",
        nombreFichero: "ES0000000000000001AA0F_2024_0320143022.txt",
        modo: "CONSTANTE",
        totalLineas: 3,
        totalParticipantes: 3,
        verificacionSuma: true,
        generadoEn: "2024-03-20T14:30:22Z",
        generadoPor: "admin@ejemplo.com",
        storageUrl: undefined,
      },
    ],
  };
}

// ─── Badge de estado ──────────────────────────────────────────────────────────

const ESTADO_BADGE = {
  BORRADOR: { label: "Borrador", variant: "secondary" as const },
  ACTIVA: { label: "Activa", variant: "default" as const },
  SUSPENDIDA: { label: "Suspendida", variant: "outline" as const },
  BAJA: { label: "Baja", variant: "destructive" as const },
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
  const datos = await getInstalacion(id);

  if (!datos) notFound();

  const { instalacion, participantes, historial } = datos;
  const estadoBadge = ESTADO_BADGE[instalacion.estado];
  const tabActiva = tab ?? "detalles";

  return (
    <div className="flex flex-col h-full">
      <Header
        titulo={instalacion.nombre}
        subtitulo={`CAU: ${instalacion.cau} · Año ${instalacion.anio}`}
        acciones={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                Volver
              </Link>
            </Button>
          </div>
        }
      />

      {/* Barra de info rápida */}
      <div className="border-b border-border bg-muted/30 px-6 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Modalidad:</span>{" "}
            {MODALIDAD_LABEL[instalacion.modalidad]}
          </span>
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Tecnología:</span>{" "}
            {TECNOLOGIA_LABEL[instalacion.tecnologia]}
          </span>
          {instalacion.potenciaKw && (
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">Potencia:</span>{" "}
              {instalacion.potenciaKw} kW
            </span>
          )}
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Participantes:</span>{" "}
            {instalacion.totalParticipantes}
          </span>
          {instalacion.tieneConjuntoValidado && (
            <span className="flex items-center gap-1 text-green-600">
              <Zap className="h-3.5 w-3.5" />
              Reparto validado
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue={tabActiva} className="flex flex-col h-full">
          <div className="border-b border-border px-6 pt-2">
            <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0">
              {[
                { value: "detalles", label: "Detalles", icon: Pencil },
                { value: "participantes", label: "Participantes", icon: null },
                { value: "coeficientes", label: "Coeficientes", icon: null },
                { value: "historial", label: "Historial", icon: FileText },
                { value: "descargas", label: "Descargas", icon: Download },
              ].map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  {label}
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
                anio={instalacion.anio}
                totalParticipantes={instalacion.totalParticipantes}
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
  anio,
  totalParticipantes,
}: {
  instalacionId: string;
  anio: number;
  totalParticipantes: number;
}) {
  if (totalParticipantes === 0) {
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
          Define el reparto de autoconsumo entre los {totalParticipantes}{" "}
          participantes para el año {anio}
        </p>
      </div>
      <Separator />
      {/* Aquí se monta EditorCoeficientesContainer (Client Component) */}
      <EditorCoeficientesLazy
        instalacionId={instalacionId}
        anio={anio}
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
