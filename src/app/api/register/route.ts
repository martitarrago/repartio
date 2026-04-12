import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const esquema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  organizacion: z.string().min(2),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = esquema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nombre, email, organizacion, password } = parsed.data;

    // Comprobar que el email no existe
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json(
        { message: "Ya existe una cuenta con ese email" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Crear organización y usuario en una transacción
    const usuario = await prisma.$transaction(async (tx) => {
      const org = await tx.organizacion.create({
        data: { nombre: organizacion },
      });

      return tx.usuario.create({
        data: {
          nombre,
          email,
          passwordHash,
          organizacionId: org.id,
          rol: "ADMIN",
        },
      });
    });

    return NextResponse.json({ id: usuario.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
