import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WizardInstalacion } from "@/components/installations/WizardInstalacion";

export default function NuevaInstalacionPage() {
  return (
    <div className="mx-auto w-full max-w-[960px] px-8 py-6 space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[#71717A] hover:text-[#18181B] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a instalaciones
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[#18181B]">Nueva instalación</h1>
        <p className="text-sm text-[#A1A1AA]">Crea una nueva comunidad de autoconsumo colectivo</p>
      </div>

      <WizardInstalacion />
    </div>
  );
}
