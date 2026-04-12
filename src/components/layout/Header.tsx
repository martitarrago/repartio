"use client";

import { Bell, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  titulo?: string;
  subtitulo?: string;
  acciones?: React.ReactNode;
  usuario?: {
    nombre: string;
    email: string;
    organizacion: string;
  };
}

export function Header({
  titulo,
  subtitulo,
  acciones,
  usuario = {
    nombre: "Usuario",
    email: "usuario@ejemplo.com",
    organizacion: "Mi Organización",
  },
}: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-6">
      {/* Título de página */}
      <div>
        {titulo && (
          <h1 className="text-lg font-semibold leading-none text-[#1A1A1A]">
            {titulo}
          </h1>
        )}
        {subtitulo && (
          <p className="mt-0.5 text-sm text-[#6B7280]">{subtitulo}</p>
        )}
      </div>

      {/* Acciones + Usuario */}
      <div className="flex items-center gap-3">
        {acciones}

        <Button variant="ghost" size="icon" className="relative text-[#6B7280] hover:text-[#1A1A1A]" disabled>
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#FF2D8D]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2 text-[#4B5563] hover:text-[#1A1A1A]">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-energy text-energy-foreground">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none text-[#1A1A1A]">{usuario.nombre}</p>
                <p className="text-xs text-[#6B7280]">{usuario.organizacion}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-[#E5E7EB] bg-white shadow-sm">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-[#1A1A1A]">{usuario.nombre}</p>
                <p className="text-xs text-[#6B7280]">{usuario.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#E5E7EB]" />
            <DropdownMenuItem disabled className="text-[#9CA3AF]">Perfil</DropdownMenuItem>
            <DropdownMenuItem disabled className="text-[#9CA3AF]">Organización</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E5E7EB]" />
            <DropdownMenuItem className="text-[#EF4444] focus:text-[#EF4444]">
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
