export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — solar gradient */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex solar-gradient">
        {/* Decorative glow blobs */}
        <div
          className="pointer-events-none absolute right-[-60px] top-[20%] h-[280px] w-[280px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="pointer-events-none absolute left-[-40px] bottom-[25%] h-[200px] w-[200px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
            filter: "blur(30px)",
          }}
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <span className="text-sm text-white font-bold">⚡</span>
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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg solar-gradient shadow-emerald">
            <span className="text-xs text-white font-bold">⚡</span>
          </div>
          <span className="font-heading text-base font-semibold text-foreground">Repartio</span>
        </div>

        {children}
      </div>
    </div>
  );
}
