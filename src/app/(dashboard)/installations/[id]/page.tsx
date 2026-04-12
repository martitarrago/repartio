import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { Separator } from "@/components/ui/separator";
import { InstallationForm } from "@/components/installations/InstallationForm";
import { ParticipantesTab } from "@/components/installations/ParticipantesTab";
import { DocumentoTab } from "@/components/installations/DocumentoTab";
import { EditorCoeficientesLazy } from "@/components/editor/EditorCoeficientesLazy";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type {
  InstalacionResumen,
  Participante,
  EntradaConstante,
  EntradaVariable,
  ModoCoeficiente,
  MatrizTipoDia,
  TipoDia,
} from "@/types/editor";
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
  modoInicial: ModoCoeficiente;
  entradasConstantesIniciales: EntradaConstante[];
  entradasVariablesIniciales: EntradaVariable[];
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
    include: {
      entradas: {
        include: { participante: { select: { cups: true, nombre: true, orden: true } } },
      },
    },
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

  // ── Reconstruir entradas guardadas para pre-rellenar el editor ──────────────
  let modoInicial: ModoCoeficiente = "CONSTANTE";
  let entradasConstantesIniciales: EntradaConstante[] = [];
  let entradasVariablesIniciales: EntradaVariable[] = [];

  if (conjuntoActivo && conjuntoActivo.entradas.length > 0) {
    modoInicial = conjuntoActivo.modo;

    if (conjuntoActivo.modo === "CONSTANTE") {
      entradasConstantesIniciales = conjuntoActivo.entradas
        .sort((a, b) => a.participante.orden - b.participante.orden)
        .map((e) => ({
          participanteId: e.participanteId,
          cups: e.participante.cups,
          nombre: e.participante.nombre,
          valor: Number(e.valor).toFixed(6),
          orden: e.participante.orden,
        }));
    } else {
      const porParticipante = new Map<
        string,
        { cups: string; nombre: string; orden: number; entradas: typeof conjuntoActivo.entradas }
      >();
      for (const e of conjuntoActivo.entradas) {
        const existing = porParticipante.get(e.participanteId);
        if (existing) existing.entradas.push(e);
        else porParticipante.set(e.participanteId, { cups: e.participante.cups, nombre: e.participante.nombre, orden: e.participante.orden, entradas: [e] });
      }
      entradasVariablesIniciales = Array.from(porParticipante.entries())
        .sort(([, a], [, b]) => a.orden - b.orden)
        .map(([participanteId, { cups, nombre, orden, entradas }]) => {
          const matriz: MatrizTipoDia = { LABORABLE: Array(24).fill("0"), SABADO: Array(24).fill("0"), FESTIVO: Array(24).fill("0") };
          for (const e of entradas) {
            if (e.tipoDia && e.hora !== null) matriz[e.tipoDia as TipoDia][e.hora] = Number(e.valor).toFixed(6);
          }
          return { participanteId, cups, nombre, orden, matriz };
        });
    }
  }

  return {
    instalacion,
    participantes,
    historial,
    conjuntoActivoId: conjuntoActivo?.id,
    modoInicial,
    entradasConstantesIniciales,
    entradasVariablesIniciales,
  };
}

// ─── Badge de estado ──────────────────────────────────────────────────────────

const ESTADO_BADGE = {
  BORRADOR:   { label: "Borrador",   variant: "warning" as const },
  ACTIVA:     { label: "Activa",     variant: "info"    as const },
  SUSPENDIDA: { label: "Suspendida", variant: "warning" as const },
  BAJA:       { label: "Baja",       variant: "error"   as const },
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

// ─── Tab labels ──────────────────────────────────────────────────────────────

const TAB_LABELS: Record<string, string> = {
  detalles: "Detalles",
  participantes: "Participantes",
  coeficientes: "Coeficientes",
  documento: "Documento .txt",
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

  const {
    instalacion,
    participantes,
    historial,
    conjuntoActivoId,
    modoInicial,
    entradasConstantesIniciales,
    entradasVariablesIniciales,
  } = datos;
  const estadoBadge = ESTADO_BADGE[instalacion.estado];
  const tabActiva = tab ?? "detalles";

  return (
    <div className="flex flex-col h-full">
      <Header title={instalacion.nombre} />

      {/* Info bar */}
      <div className="px-8 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#71717A]">
            <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
            <span>{MODALIDAD_LABEL[instalacion.modalidad]}</span>
            <span>·</span>
            <span>{TECNOLOGIA_LABEL[instalacion.tecnologia]}</span>
            {instalacion.potenciaKw && (
              <>
                <span>·</span>
                <span>{instalacion.potenciaKw} kW</span>
              </>
            )}
            <span>·</span>
            <span>
              <span className="font-semibold text-[#18181B]">{instalacion.totalParticipantes}</span> participantes
            </span>
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
          <div className="px-8">
            <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0 border-b border-[#F4F4F5]">
              {Object.entries(TAB_LABELS).map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-normal text-[#A1A1AA] transition-all duration-150 data-[state=active]:border-[#18181B] data-[state=active]:text-[#18181B] data-[state=active]:font-medium data-[state=active]:shadow-none"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Detalles ── */}
          <TabsContent value="detalles" className="mt-0 flex-1">
            <div className="px-8 py-6">
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
            <div className="px-8 py-6">
              <ParticipantesTab
                instalacionId={instalacion.id}
                participantesIniciales={participantes}
              />
            </div>
          </TabsContent>

          {/* ── Coeficientes ── */}
          <TabsContent value="coeficientes" className="mt-0">
            <div className="px-8 py-6">
              <CoeficientesTabPlaceholder
                instalacionId={instalacion.id}
                cau={instalacion.cau}
                anio={instalacion.anio}
                participantes={participantes}
                conjuntoId={conjuntoActivoId}
                modoInicial={modoInicial}
                entradasConstantesIniciales={entradasConstantesIniciales}
                entradasVariablesIniciales={entradasVariablesIniciales}
              />
            </div>
          </TabsContent>

          {/* ── Documento .txt ── */}
          <TabsContent value="documento" className="mt-0">
            <div className="px-8 py-6">
              <DocumentoTab
                instalacionId={instalacion.id}
                conjuntoId={conjuntoActivoId}
                nombre={instalacion.nombre}
                cau={instalacion.cau}
                anio={instalacion.anio}
                totalParticipantes={instalacion.totalParticipantes}
                historial={historial}
                tieneConjuntoValidado={instalacion.tieneConjuntoValidado}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Placeholder del editor de coeficientes ───────────────────────────────────

function CoeficientesTabPlaceholder({
  instalacionId,
  cau,
  anio,
  participantes,
  conjuntoId,
  modoInicial,
  entradasConstantesIniciales,
  entradasVariablesIniciales,
}: {
  instalacionId: string;
  cau: string;
  anio: number;
  participantes: Participante[];
  conjuntoId?: string;
  modoInicial: ModoCoeficiente;
  entradasConstantesIniciales: EntradaConstante[];
  entradasVariablesIniciales: EntradaVariable[];
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
        modoInicial={modoInicial}
        entradasConstantesIniciales={entradasConstantesIniciales}
        entradasVariablesIniciales={entradasVariablesIniciales}
      />
    </div>
  );
}
