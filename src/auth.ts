import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: parsed.data.email },
          include: { organizacion: true },
        });

        if (!usuario || !usuario.passwordHash || !usuario.activo) return null;

        const ok = await bcrypt.compare(parsed.data.password, usuario.passwordHash);
        if (!ok) return null;

        // Actualizar último acceso
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { ultimoAcceso: new Date() },
        });

        return {
          id: usuario.id,
          email: usuario.email,
          name: [usuario.nombre, usuario.apellidos].filter(Boolean).join(" "),
          organizacionId: usuario.organizacionId,
          organizacion: usuario.organizacion.nombre,
          rol: usuario.rol,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.usuario.findUnique({ where: { email: user.email } });
        if (!existing) {
          const org = await prisma.organizacion.create({
            data: { nombre: user.name || "Mi organización" },
          });
          await prisma.usuario.create({
            data: {
              email: user.email,
              nombre: user.name?.split(" ")[0] || "",
              apellidos: user.name?.split(" ").slice(1).join(" ") || "",
              passwordHash: "",
              organizacionId: org.id,
              rol: "ADMIN",
              activo: true,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.usuario.findUnique({
          where: { email: token.email },
          include: { organizacion: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.organizacionId = dbUser.organizacionId;
          token.organizacion = dbUser.organizacion.nombre;
          token.rol = dbUser.rol;
          await prisma.usuario.update({ where: { id: dbUser.id }, data: { ultimoAcceso: new Date() } });
        }
        return token;
      }
      if (user) {
        token.id = user.id;
        token.organizacionId = (user as any).organizacionId;
        token.organizacion = (user as any).organizacion;
        token.rol = (user as any).rol;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).organizacionId = token.organizacionId;
      (session.user as any).organizacion = token.organizacion;
      (session.user as any).rol = token.rol;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
