export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — minimal branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#18181B] p-12 lg:flex">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span className="text-lg font-semibold text-white">Repartio</span>
        </div>

        <div className="space-y-4">
          <p className="text-2xl font-semibold text-white leading-relaxed max-w-md">
            Genera ficheros de coeficientes de reparto en segundos.
          </p>
          <p className="text-sm text-white/50">
            Conforme con el Real Decreto 244/2019, Anejo I.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-white/30" />
            <p className="text-2xs text-white/40">RD 244/2019</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-white/30" />
            <p className="text-2xs text-white/40">Orden TED/1247/2021</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-white/30" />
            <p className="text-2xs text-white/40">Validación automática</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#F8F8F6] px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="text-base">⚡</span>
          <span className="text-lg font-semibold text-[#18181B]">Repartio</span>
        </div>

        {children}
      </div>
    </div>
  );
}
