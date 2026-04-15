"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-xl border border-white/10 bg-gray-900/95 px-5 py-3 text-xs text-white/70 shadow-lift backdrop-blur-xl sm:bottom-6"
        >
          <p className="leading-relaxed">
            Usamos cookies esenciales para el funcionamiento del servicio.{" "}
            <Link
              href="/privacidad"
              className="font-medium text-white/90 underline underline-offset-2 transition-colors hover:text-white"
            >
              Más información
            </Link>
          </p>
          <button
            onClick={accept}
            className="shrink-0 rounded-lg bg-white px-3.5 py-1.5 text-xs font-medium text-gray-900 transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            Entendido
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
