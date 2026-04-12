import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const esquema = z.object({
  nombre: z.string().min(3).max(100),
  descripcion: z.string().max(500).optional(),
  cau: z.string().length(26, "El CAU debe tener exactamente 26 caracteres").regex(/^[A-Z0-9]+$/i),
  anio: z.number().int().min(2019).max(new Date().getFullYear() + 1),
  modalidad: z.enum([
    "INDIVIDUAL_SIN_EXCEDENTES",
    "INDIVIDUAL_CON_EXCEDENTES",
    "COLECTIVO_SIN_EXCEDENTES",
    "COLECTIVO_CON_EXCEDENTES",
    "SERVICIOS_AUXILIARES",
  ]),
  tecnologia: z.enum([
    "FOTOVOLTAICA",
    "EOLICA",
    "HIDRAULICA",
    "COGENERACION",
    "BIOMASA",
    "OTRAS",
  ]),
  potenciaKw: z.number().positive().optional().or(z.literal("")),
  municipio: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  codigoPostal: z
    .string()
    .regex(/^\d{5}$/)
    .optional()
    .or(z.literal("")),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id } = await params;

  const existente = await prisma.instalacion.findFirst({
    where: { id, organizacionId },
  });
  if (!existente) {
    return NextResponse.json({ message: "Instalación no encontrada" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = esquema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Datos inválidos", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { potenciaKw, codigoPostal, ...rest } = parsed.data;

  try {
    const instalacion = await prisma.instalacion.update({
      where: { id },
      data: {
        ...rest,
        potenciaKw: typeof potenciaKw === "number" ? potenciaKw : null,
        codigoPostal: codigoPostal || null,
      },
    });
    return NextResponse.json({ id: instalacion.id });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { message: "Ya existe una instalación con ese CAU para ese año" },
        { status: 409 }
      );
    }
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
