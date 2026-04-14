"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookies_ok");
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookies_ok", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-white/10 px-6 py-3 flex items-center justify-between gap-4 text-xs text-white/60">
      <p>
        Usamos cookies esenciales para el funcionamiento del servicio.{" "}
        <Link href="/privacidad" className="underline hover:text-white/80 transition-colors">
          Más información
        </Link>
      </p>
      <button
        onClick={accept}
        className="shrink-0 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-medium"
      >
        Entendido
      </button>
    </div>
  );
}
