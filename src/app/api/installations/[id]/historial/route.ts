import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId } = await params;

  const inst = await prisma.instalacion.findFirst({ where: { id: instalacionId, organizacionId } });
  if (!inst) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const historial = await prisma.historialFichero.findMany({
    where: { conjunto: { instalacionId } },
    orderBy: { generadoEn: "desc" },
    take: 20,
    select: {
      id: true,
      nombreFichero: true,
      generadoEn: true,
      totalLineas: true,
      totalParticipantes: true,
      modo: true,
      verificacionSuma: true,
    },
  });

  return NextResponse.json(historial);
}
