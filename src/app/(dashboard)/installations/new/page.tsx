import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { WizardInstalacion } from "@/components/installations/WizardInstalacion";

export default function NuevaInstalacionPage() {
  return (
    <div className="flex flex-col">
      <Header title="Nueva instalación" />

      <div className="flex-1 px-8 pb-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Crea una nueva comunidad de autoconsumo colectivo</p>
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
