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
      className="flex h-12 shrink-0 items-center justify-between bg-white/80 backdrop-blur-xl px-6"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg solar-gradient shadow-brand">
          <span className="text-xs text-white font-bold">⚡</span>
        </div>
        <span className="font-heading text-base font-semibold text-foreground">Repartio</span>
      </Link>

      {/* Avatar + dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full solar-gradient text-[11px] font-semibold text-white shadow-brand transition-opacity hover:opacity-90"
        >
          {iniciales}
        </button>

        {open && (
          <div className="glass-card absolute right-0 top-full mt-1.5 w-48 rounded-lg py-1 animate-scale-in">
            <div className="px-3 py-2 border-b border-border/60">
              <p className="text-sm font-medium text-foreground truncate">{nombre}</p>
              <p className="text-2xs text-muted-foreground truncate">
                {session?.user?.email ?? ""}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              disabled
            >
              <Settings className="h-3.5 w-3.5" />
              Configuración
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
