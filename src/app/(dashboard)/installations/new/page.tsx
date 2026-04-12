import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { WizardInstalacion } from "@/components/installations/WizardInstalacion";

export default function NuevaInstalacionPage() {
  return (
    <div className="flex flex-col">
      <Header breadcrumb="Nueva instalación" />

      <div className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-semibold text-[#0A0A0A]">Nueva instalación</h1>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">Crea una nueva comunidad de autoconsumo colectivo</p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard">
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver
              </Link>
            </Button>
          </div>
          <WizardInstalacion />
        </div>
      </div>
    </div>
  );
}
