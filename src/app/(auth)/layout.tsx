import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo — branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Repartio</span>
        </div>

        <div className="space-y-4">
          <blockquote className="space-y-2">
            <p className="text-lg text-white/90 leading-relaxed">
              "Genera los ficheros de coeficientes de reparto en segundos,
              cumpliendo al 100% con el Real Decreto 244/2019."
            </p>
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20" />
            <div>
              <p className="text-sm font-medium text-white">Administrador</p>
              <p className="text-xs text-white/60">Comunidad Energética</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <p className="text-xs text-white/70">Conforme con RD 244/2019</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <p className="text-xs text-white/70">Orden TED/1247/2021 implementada</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <p className="text-xs text-white/70">Validación automática Σβ = 1</p>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Logo móvil */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Repartio</span>
        </div>

        {children}
      </div>
    </div>
  );
}
