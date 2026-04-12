"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Building2,
  FileText,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { label: "Instalaciones", href: "/dashboard",      icon: Building2 },
  { label: "Ficheros",      href: "/files",           icon: FileText,  disabled: true },
  { label: "Configuración", href: "/settings",        icon: Settings,  disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const nombre = session?.user?.name ?? "Usuario";
  const iniciales = nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname.startsWith("/installations")
      : pathname.startsWith(href);

  return (
    <aside className="flex h-screen w-[200px] shrink-0 flex-col bg-white">
      {/* Logo */}
      <div className="flex h-12 items-center gap-2 px-4">
        <span className="text-base">⚡</span>
        <span className="text-lg font-semibold text-[#18181B]">Repartio</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[#A1A1AA]"
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
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150",
                active
                  ? "bg-[#F4F4F5] text-[#18181B] font-medium"
                  : "text-[#71717A] hover:bg-[#FAFAFA] hover:text-[#18181B]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: avatar + name + logout */}
      <div className="px-3 pb-4 space-y-2">
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F4F5] text-[11px] font-semibold text-[#71717A]">
            {iniciales}
          </div>
          <span className="truncate text-sm text-[#18181B] font-medium">{nombre}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-[#A1A1AA] transition-all duration-150 hover:bg-[#FAFAFA] hover:text-[#71717A]"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
