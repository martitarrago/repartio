import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { InstallationForm } from "@/components/installations/InstallationForm";

export default function NuevaInstalacionPage() {
  return (
    <div className="flex flex-col">
      <Header
        titulo="Nueva instalación"
        subtitulo="Crea una nueva comunidad de autoconsumo colectivo"
        acciones={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          <InstallationForm />
        </div>
      </div>
    </div>
  );
}
