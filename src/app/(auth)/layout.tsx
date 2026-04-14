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

function SolarGrid() {
  return (
    <svg viewBox="0 0 200 200" className="w-64 h-64 opacity-20" aria-hidden>
      <g transform="rotate(-12, 100, 100)">
        {[0, 1, 2, 3, 4].map(row =>
          [0, 1, 2, 3, 4].map(col => (
            <rect
              key={`${row}-${col}`}
              x={12 + col * 38}
              y={12 + row * 38}
              width="32"
              height="32"
              rx="4"
              fill={row === 0 && col === 0 ? "#EF9F27" : "white"}
              opacity={row === 0 && col === 0 ? 0.9 : 0.08}
            />
          ))
        )}
      </g>
    </svg>
  );
}

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
          className="pointer-events-none absolute right-[-80px] top-[15%] h-[320px] w-[320px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(239,159,39,0.12) 0%, rgba(239,159,39,0) 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Solar grid illustration */}
        <div className="pointer-events-none absolute right-8 bottom-16">
          <SolarGrid />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Image src="/logo-dark.svg" alt="Repartio" width={32} height={32} className="rounded-lg" />
          <span className="font-heading text-lg font-semibold text-white">Repartio</span>
        </div>

        {/* Rotating tagline */}
        <div className="relative z-10 space-y-4">
          <p className="text-2xl font-semibold font-heading text-white leading-relaxed max-w-md min-h-[4rem]">
            {tagline}<span className="animate-pulse text-[#EF9F27]">|</span>
          </p>
          <p className="text-sm text-white/50">
            Plataforma de autoconsumo colectivo para España
          </p>
        </div>

        {/* Compliance badges */}
        <div className="relative z-10 flex flex-wrap gap-2">
          {["RD 244/2019", "Orden TED/1247/2021", "UTF-8 sin BOM"].map((item) => (
            <span key={item} className="text-2xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <Image src="/logo-dark.svg" alt="Repartio" width={28} height={28} className="rounded-lg" />
          <span className="font-heading text-base font-semibold text-foreground">Repartio</span>
        </div>

        {children}
      </div>
    </div>
  );
}
