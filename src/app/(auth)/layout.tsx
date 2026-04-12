export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — warm gradient with amber sun */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{ background: "linear-gradient(180deg, #FAF9F7 0%, #FDF6E3 100%)" }}
      >
        {/* Decorative amber sun blur */}
        <div
          className="pointer-events-none absolute right-[-80px] top-[30%] h-[320px] w-[320px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(229,165,0,0.25) 0%, rgba(229,165,0,0) 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10 flex items-center gap-2">
          <span className="text-base" style={{ color: "#E5A500" }}>⚡</span>
          <span className="text-lg font-semibold text-[#18181B]">Repartio</span>
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-2xl font-semibold text-[#18181B] leading-relaxed max-w-md">
            Genera ficheros de coeficientes de reparto en segundos.
          </p>
          <p className="text-sm text-[#71717A]">
            Conforme con el Real Decreto 244/2019, Anejo I.
          </p>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-[#A1A1AA]" />
            <p className="text-2xs text-[#A1A1AA]">RD 244/2019</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-[#A1A1AA]" />
            <p className="text-2xs text-[#A1A1AA]">Orden TED/1247/2021</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-[#A1A1AA]" />
            <p className="text-2xs text-[#A1A1AA]">Validación automática</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#FAF9F7] px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="text-base" style={{ color: "#E5A500" }}>⚡</span>
          <span className="text-lg font-semibold text-[#18181B]">Repartio</span>
        </div>

        {children}
      </div>
    </div>
  );
}
