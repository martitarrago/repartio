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
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* Título de página */}
      <div>
        {titulo && (
          <h1 className="text-lg font-semibold leading-none text-foreground">
            {titulo}
          </h1>
        )}
        {subtitulo && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitulo}</p>
        )}
      </div>

      {/* Acciones + Usuario */}
      <div className="flex items-center gap-3">
        {acciones}

        <Button variant="ghost" size="icon" className="relative" disabled>
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">{usuario.nombre}</p>
                <p className="text-xs text-muted-foreground">{usuario.organizacion}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{usuario.nombre}</p>
                <p className="text-xs text-muted-foreground">{usuario.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Perfil</DropdownMenuItem>
            <DropdownMenuItem disabled>Organización</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
