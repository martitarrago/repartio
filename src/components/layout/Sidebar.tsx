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
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-energy">
          <Zap className="h-4 w-4 text-energy-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-foreground">
            Repartio
          </p>
          <p className="text-xs text-muted-foreground">Autoconsumo colectivo</p>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50"
                title="Próximamente"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40">
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
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Separador */}
      <div className="mx-3 border-t border-border" />

      {/* Navegación inferior */}
      <nav className="space-y-1 p-3">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.href}
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50"
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
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </nav>
    </aside>
  );
}
