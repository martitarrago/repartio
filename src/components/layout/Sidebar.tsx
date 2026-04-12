"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
  { label: "Inicio",        href: "/dashboard",    icon: LayoutDashboard },
  { label: "Instalaciones", href: "/installations", icon: Building2 },
  { label: "Ficheros",      href: "/files",         icon: FileText,  disabled: true },
  { label: "Estadísticas",  href: "/stats",         icon: BarChart3, disabled: true },
];

const bottomItems = [
  { label: "Configuración", href: "/settings", icon: Settings,   disabled: true },
  { label: "Ayuda",         href: "/help",     icon: HelpCircle, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside
      className="flex h-screen w-[220px] shrink-0 flex-col bg-white"
      style={{ boxShadow: "1px 0 0 #E5E7EB" }}
    >
      {/* Logo */}
      <div className="flex h-12 items-center gap-2.5 px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#0A0A0A]">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-[#0A0A0A]">Repartio</span>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[#9CA3AF]"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-[#F3F4F6] text-[#0A0A0A] font-medium"
                  : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#0A0A0A]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-[#F3F4F6] px-2 py-2 space-y-0.5">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.href}
              className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[#9CA3AF]"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </div>
          );
        })}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[#6B7280] transition-colors duration-150 hover:bg-[#F9FAFB] hover:text-[#DC2626]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
