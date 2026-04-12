"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Instalaciones",
    href: "/installations",
    icon: Building2,
  },
  {
    label: "Ficheros",
    href: "/files",
    icon: FileText,
    disabled: true,
  },
  {
    label: "Estadísticas",
    href: "/stats",
    icon: BarChart3,
    disabled: true,
  },
];

const bottomItems = [
  {
    label: "Configuración",
    href: "/settings",
    icon: Settings,
    disabled: true,
  },
  {
    label: "Ayuda",
    href: "/help",
    icon: HelpCircle,
    disabled: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#E5E7EB] bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[#E5E7EB] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-energy">
          <Zap className="h-4 w-4 text-energy-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-[#1A1A1A]">
            Repartio
          </p>
          <p className="text-xs text-[#6B7280]">Autoconsumo colectivo</p>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-[#9CA3AF]"
                title="Próximamente"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-[#D1D5DB]">
                  Pronto
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[#FF2D8D10] text-[#FF2D8D] font-medium"
                  : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#1A1A1A]"
              )}
            >
              {/* Borde izquierdo fucsia en ítem activo */}
              {active && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[#FF2D8D]" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Separador */}
      <div className="mx-3 border-t border-[#E5E7EB]" />

      {/* Navegación inferior */}
      <nav className="space-y-0.5 p-3">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.href}
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-[#9CA3AF]"
              title="Próximamente"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
          );
        })}

        {/* Cerrar sesión */}
        <form action="/api/demo/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#4B5563] transition-colors hover:bg-[#F9FAFB] hover:text-[#EF4444]"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </nav>
    </aside>
  );
}
