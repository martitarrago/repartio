"use client";

import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  breadcrumb?: string;
  usuario?: {
    nombre: string;
    email: string;
    organizacion: string;
  };
}

export function Header({
  breadcrumb,
  usuario = {
    nombre: "Usuario",
    email: "usuario@ejemplo.com",
    organizacion: "Mi Organización",
  },
}: HeaderProps) {
  return (
    <header
      className="flex h-12 items-center justify-between bg-white px-6"
      style={{ boxShadow: "0 1px 0 #E5E7EB" }}
    >
      {/* Breadcrumb */}
      <span className="text-sm font-medium text-[#0A0A0A]">
        {breadcrumb ?? ""}
      </span>

      {/* Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-[#6B7280] transition-colors duration-150 hover:bg-[#F9FAFB] hover:text-[#0A0A0A] focus:outline-none">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280]">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="hidden text-xs font-medium sm:block">{usuario.nombre}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-sm">
          <DropdownMenuLabel className="px-2 py-1.5 font-normal">
            <p className="text-sm font-medium text-[#0A0A0A]">{usuario.nombre}</p>
            <p className="text-xs text-[#9CA3AF]">{usuario.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#F3F4F6]" />
          <DropdownMenuItem disabled className="rounded-md px-2 py-1.5 text-xs text-[#9CA3AF]">
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="rounded-md px-2 py-1.5 text-xs text-[#9CA3AF]">
            Organización
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#F3F4F6]" />
          <DropdownMenuItem className="rounded-md px-2 py-1.5 text-xs text-[#DC2626] focus:text-[#DC2626]">
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
