export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand black */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex bg-gray-900">
        {/* Decorative glow blob — yellow solar accent */}
        <div
          className="pointer-events-none absolute right-[-80px] top-[15%] h-[320px] w-[320px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(239,159,39,0.12) 0%, rgba(239,159,39,0) 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
            <span className="text-sm font-bold" style={{ color: "#EF9F27" }}>⚡</span>
          </div>
          <span className="font-heading text-lg font-semibold text-white">Repartio</span>
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-2xl font-semibold font-heading text-white leading-relaxed max-w-md">
            Genera ficheros de coeficientes de reparto en segundos.
          </p>
          <p className="text-sm text-white/70">
            Conforme con el Real Decreto 244/2019, Anejo I.
          </p>
        </div>

        <div className="relative z-10 space-y-2">
          {["RD 244/2019", "Orden TED/1247/2021", "Validación automática"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-white/50" />
              <p className="text-2xs text-white/60">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
            <span className="text-xs font-bold" style={{ color: "#EF9F27" }}>⚡</span>
          </div>
          <span className="font-heading text-base font-semibold text-foreground">Repartio</span>
        </div>

        {children}
      </div>
    </div>
  );
}
