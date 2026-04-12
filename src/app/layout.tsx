import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Repartio — Gestión de Autoconsumo Colectivo",
  description:
    "Plataforma para la gestión y generación de coeficientes de reparto de autoconsumo colectivo según el Real Decreto 244/2019.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${sora.variable} ${manrope.variable}`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
