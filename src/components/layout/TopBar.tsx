"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Settings, LogOut } from "lucide-react";

export function TopBar() {
  const { data: session } = useSession();
  const nombre = session?.user?.name ?? "Usuario";
  const iniciales = nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between bg-white px-6"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="text-base" style={{ color: "#E5A500" }}>⚡</span>
        <span className="text-lg font-semibold text-[#18181B]">Repartio</span>
      </Link>

      {/* Avatar + dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F4F5] text-[11px] font-semibold text-[#71717A] transition-colors hover:bg-[#E4E4E7]"
        >
          {iniciales}
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-white py-1 shadow-lg"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="px-3 py-2 border-b border-[#F4F4F5]">
              <p className="text-sm font-medium text-[#18181B] truncate">{nombre}</p>
              <p className="text-2xs text-[#A1A1AA] truncate">
                {session?.user?.email ?? ""}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors"
              disabled
            >
              <Settings className="h-3.5 w-3.5" />
              Configuración
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
