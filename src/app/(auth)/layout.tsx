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

function SolarIllustration() {
  return (
    <svg viewBox="0 0 320 280" className="w-full max-w-xs opacity-90" aria-hidden>
      {/* Building outline */}
      <rect x="80" y="120" width="160" height="130" rx="4" fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="1"/>
      {/* Floors */}
      {[0,1,2,3].map(i => (
        <rect key={i} x="80" y={120 + i * 32} width="160" height="1" fill="white" fillOpacity="0.05"/>
      ))}
      {/* Windows */}
      {[0,1,2,3].map(row =>
        [0,1,2,3].map(col => (
          <rect key={`${row}-${col}`} x={92 + col * 37} y={130 + row * 32} width="24" height="18" rx="2"
            fill="white" fillOpacity={row === 0 && col === 1 ? 0.15 : 0.04}/>
        ))
      )}

      {/* Solar panels on roof — main feature */}
      <g transform="translate(75, 65) skewX(-8)">
        {[0,1,2,3,4].map(col => (
          <g key={col}>
            <rect x={col * 32} y="0" width="26" height="36" rx="3"
              fill={col === 0 ? "#EF9F27" : "white"} fillOpacity={col === 0 ? 0.9 : 0.12}/>
            {/* Panel grid lines */}
            <line x1={col * 32 + 13} y1="0" x2={col * 32 + 13} y2="36" stroke="black" strokeOpacity="0.2" strokeWidth="0.5"/>
            <line x1={col * 32} y1="18" x2={col * 32 + 26} y2="18" stroke="black" strokeOpacity="0.2" strokeWidth="0.5"/>
          </g>
        ))}
      </g>

      {/* Energy flow lines from panels */}
      <path d="M 160 100 Q 160 115 160 120" stroke="#EF9F27" strokeOpacity="0.4" strokeWidth="1.5" fill="none" strokeDasharray="3,3"/>

      {/* Network nodes */}
      <circle cx="60" cy="190" r="4" fill="#EF9F27" fillOpacity="0.5"/>
      <circle cx="260" cy="170" r="4" fill="#EF9F27" fillOpacity="0.5"/>
      <circle cx="40" cy="230" r="3" fill="white" fillOpacity="0.15"/>
      <circle cx="285" cy="220" r="3" fill="white" fillOpacity="0.15"/>

      {/* Connection lines */}
      <line x1="80" y1="190" x2="60" y2="190" stroke="white" strokeOpacity="0.08" strokeWidth="1"/>
      <line x1="240" y1="175" x2="260" y2="170" stroke="white" strokeOpacity="0.08" strokeWidth="1"/>
      <line x1="60" y1="190" x2="40" y2="230" stroke="white" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="2,3"/>
      <line x1="260" y1="170" x2="285" y2="220" stroke="white" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="2,3"/>

      {/* Sun */}
      <circle cx="265" cy="45" r="18" fill="#EF9F27" fillOpacity="0.15"/>
      <circle cx="265" cy="45" r="10" fill="#EF9F27" fillOpacity="0.25"/>
      {[0,45,90,135,180,225,270,315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return <line key={i}
          x1={265 + Math.cos(rad) * 13} y1={45 + Math.sin(rad) * 13}
          x2={265 + Math.cos(rad) * 22} y2={45 + Math.sin(rad) * 22}
          stroke="#EF9F27" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round"/>;
      })}

      {/* Subtle percentage label */}
      <text x="160" y="258" textAnchor="middle" fontSize="9" fill="white" fillOpacity="0.2" fontFamily="monospace">β = 0.250000 + 0.250000 + 0.500000 = 1,000000</text>
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

        {/* Illustration + tagline */}
        <div className="relative z-10 space-y-6">
          <SolarIllustration />
          <div className="space-y-2">
            <p className="text-xl font-semibold font-heading text-white leading-snug max-w-md min-h-[3.5rem]">
              {tagline}<span className="animate-pulse text-[#EF9F27]">|</span>
            </p>
            <p className="text-sm text-white/40">
              Plataforma de autoconsumo colectivo para España
            </p>
          </div>
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
