import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parsearValor } from "@/lib/validators/coeficientes";

const esquemaConstante = z.object({
  modo: z.literal("CONSTANTE"),
  entradas: z
    .array(z.object({ participanteId: z.string(), valor: z.string() }))
    .min(1),
});

const esquemaVariable = z.object({
  modo: z.literal("VARIABLE"),
  entradas: z
    .array(
      z.object({
        participanteId: z.string(),
        matriz: z.object({
          LABORABLE: z.array(z.string()).length(24),
          SABADO: z.array(z.string()).length(24),
          FESTIVO: z.array(z.string()).length(24),
        }),
      })
    )
    .min(1),
});

const esquema = esquemaConstante.or(esquemaVariable);

const esquemaPeticion = z.object({
  modo: z.enum(["CONSTANTE", "VARIABLE"]),
  entradas: z.array(z.any()),
  invalidarFirmas: z.boolean().optional(),
});

// ─── PUT — actualizar conjunto existente ─────────────────────────────────────

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; conjuntoId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId, conjuntoId } = await params;

  const conjunto = await prisma.conjuntoCoeficientes.findFirst({
    where: { id: conjuntoId, instalacion: { id: instalacionId, organizacionId } },
  });
  if (!conjunto) {
    return NextResponse.json({ message: "Conjunto no encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Cuerpo inválido" }, { status: 400 });

  const peticion = esquemaPeticion.safeParse(body);
  if (!peticion.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }

  const parsed = esquema.safeParse({ modo: peticion.data.modo, entradas: peticion.data.entradas });
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }

  const { invalidarFirmas } = peticion.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.entradaCoeficiente.deleteMany({ where: { conjuntoId } });
      await tx.conjuntoCoeficientes.update({
        where: { id: conjuntoId },
        data: { modo: parsed.data.modo },
      });
      await crearEntradas(tx, conjuntoId, parsed.data);

      if (invalidarFirmas) {
        await tx.participante.updateMany({
          where: { instalacionId, estadoFirma: "FIRMADO" },
          data: { estadoFirma: "PENDIENTE", firmadoEn: null },
        });
      }
    });

    return NextResponse.json({ id: conjuntoId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

async function crearEntradas(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  conjuntoId: string,
  data: z.infer<typeof esquema>
) {
  if (data.modo === "CONSTANTE") {
    await tx.entradaCoeficiente.createMany({
      data: data.entradas.map((e) => ({
        conjuntoId,
        participanteId: e.participanteId,
        hora: null,
        tipoDia: null,
        valor: parsearValor(e.valor) ?? 0,
      })),
    });
  } else {
    const rows: {
      conjuntoId: string;
      participanteId: string;
      hora: number;
      tipoDia: string;
      valor: number;
    }[] = [];

    for (const entrada of data.entradas) {
      for (const tipoDia of ["LABORABLE", "SABADO", "FESTIVO"] as const) {
        for (let hora = 0; hora < 24; hora++) {
          rows.push({
            conjuntoId,
            participanteId: entrada.participanteId,
            hora,
            tipoDia,
            valor: parsearValor(entrada.matriz[tipoDia][hora]) ?? 0,
          });
        }
      }
    }

    await tx.entradaCoeficiente.createMany({ data: rows });
  }
}
