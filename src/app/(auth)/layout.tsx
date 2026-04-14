"use client";

import { useTypewriter } from "@/hooks/useTypewriter";
import Image from "next/image";

const TAGLINES = [
  "Genera ficheros de coeficientes en segundos",
  "Gestiona comunidades de autoconsumo colectivo",
  "Firma acuerdos de reparto online",
  "Conforme con el RD 244/2019",
  "Automatiza el reparto de energía solar",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tagline = useTypewriter(TAGLINES, 60, 2500);

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex bg-gray-900">
        {/* Solar glow */}
        <div
          className="pointer-events-none absolute right-[-60px] top-[10%] h-[300px] w-[300px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(239,159,39,0.10) 0%, rgba(239,159,39,0) 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/logo-dark.svg"
            alt="Repartio"
            width={160}
            height={47}
            style={{ width: 160, height: "auto" }}
            priority
          />
        </div>

        {/* Tagline */}
        <div className="relative z-10 space-y-2">
          <p className="text-2xl font-semibold font-heading text-white leading-snug max-w-md min-h-[4rem]">
            {tagline}<span className="animate-pulse text-[#EF9F27]">|</span>
          </p>
          <p className="text-sm text-white/40">
            Plataforma de autoconsumo colectivo para España
          </p>
        </div>

        {/* Compliance badges */}
        <div className="relative z-10 flex flex-wrap gap-2">
          {["RD 244/2019", "Orden TED/1247/2021", "UTF-8 sin BOM"].map((item) => (
            <span key={item} className="text-2xs text-white/35 bg-white/5 px-2.5 py-1 rounded-full">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Image src="/logo.svg" alt="Repartio" width={130} height={38} style={{ width: 130, height: "auto" }} priority />
        </div>

        {children}
      </div>
    </div>
  );
}
