import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  generarContenidoConstante,
  generarContenidoVariable,
  getNombreFichero,
} from "@/lib/generators/txtGenerator";
import type { EntradaConstante, EntradaVariable, MatrizTipoDia, TipoDia } from "@/types/editor";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; conjuntoId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId, conjuntoId } = await params;

  // ─── Cargar datos desde DB ─────────────────────────────────────────────────

  const conjunto = await prisma.conjuntoCoeficientes.findFirst({
    where: {
      id: conjuntoId,
      instalacion: { id: instalacionId, organizacionId },
    },
    include: {
      instalacion: { select: { cau: true, anio: true } },
      entradas: {
        include: { participante: { select: { cups: true, nombre: true, orden: true } } },
      },
    },
  });

  if (!conjunto) {
    return NextResponse.json({ message: "Conjunto no encontrado" }, { status: 404 });
  }

  const { cau, anio } = conjunto.instalacion;

  // ─── Reconstruir estructuras del editor ───────────────────────────────────

  let resultado;

  if (conjunto.modo === "CONSTANTE") {
    const entradas: EntradaConstante[] = conjunto.entradas
      .sort((a, b) => a.participante.orden - b.participante.orden)
      .map((e) => ({
        participanteId: e.participanteId,
        cups: e.participante.cups,
        nombre: e.participante.nombre,
        valor: e.valor.toString(),
        orden: e.participante.orden,
      }));

    resultado = generarContenidoConstante(entradas);
  } else {
    // Agrupar por participanteId
    const porParticipante = new Map<string, { cups: string; nombre: string; orden: number; entradas: typeof conjunto.entradas }>();

    for (const e of conjunto.entradas) {
      const existing = porParticipante.get(e.participanteId);
      if (existing) {
        existing.entradas.push(e);
      } else {
        porParticipante.set(e.participanteId, {
          cups: e.participante.cups,
          nombre: e.participante.nombre,
          orden: e.participante.orden,
          entradas: [e],
        });
      }
    }

    const entradasVariable: EntradaVariable[] = Array.from(porParticipante.entries())
      .sort(([, a], [, b]) => a.orden - b.orden)
      .map(([participanteId, { cups, nombre, orden, entradas }]) => {
        const matriz: MatrizTipoDia = {
          LABORABLE: Array(24).fill("0"),
          SABADO: Array(24).fill("0"),
          FESTIVO: Array(24).fill("0"),
        };
        for (const e of entradas) {
          if (e.tipoDia && e.hora !== null) {
            matriz[e.tipoDia as TipoDia][e.hora] = e.valor.toString();
          }
        }
        return { participanteId, cups, nombre, orden, matriz };
      });

    resultado = generarContenidoVariable(entradasVariable, anio);
  }

  if (!resultado.exito || !resultado.contenido) {
    return NextResponse.json(
      { message: resultado.error ?? "Error al generar el fichero" },
      { status: 422 }
    );
  }

  // ─── Nombre del fichero y SHA-256 ─────────────────────────────────────────

  const nombreFichero = getNombreFichero(anio, cau);
  const checksumSha256 = createHash("sha256").update(resultado.contenido, "utf8").digest("hex");
  const totalParticipantes = conjunto.modo === "CONSTANTE"
    ? conjunto.entradas.length
    : new Set(conjunto.entradas.map((e) => e.participanteId)).size;

  // ─── Guardar en historial ─────────────────────────────────────────────────

  await prisma.historialFichero.create({
    data: {
      conjuntoId,
      generadoPorId: session.user.id,
      nombreFichero,
      checksumSha256,
      totalLineas: resultado.totalLineas ?? 0,
      totalParticipantes,
      modo: conjunto.modo,
      verificacionSuma: true,
    },
  });

  return NextResponse.json({
    contenido: resultado.contenido,
    nombreFichero,
    totalLineas: resultado.totalLineas,
  });
}
