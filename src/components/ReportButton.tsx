"use client";

import { useState } from "react";
import { MessageSquarePlus, X, Send, Loader2, Check } from "lucide-react";

export function ReportButton() {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async () => {
    if (!mensaje.trim() || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje }),
      });
      if (res.ok) {
        setState("sent");
        setTimeout(() => { setState("idle"); setMensaje(""); setOpen(false); }, 2000);
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg hover:opacity-90 transition-opacity"
        title="Reportar un problema"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        Reportar problema
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900">Reportar un problema</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="¿Qué ha pasado? Describe el problema con el mayor detalle posible..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900/20 resize-none"
              autoFocus
            />

            <button
              onClick={handleSubmit}
              disabled={!mensaje.trim() || state === "sending" || state === "sent"}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {state === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
              {state === "sent" && <Check className="w-4 h-4" />}
              {state === "error" && <X className="w-4 h-4" />}
              {state === "idle" && <Send className="w-4 h-4" />}
              {state === "idle" ? "Enviar" : state === "sending" ? "Enviando..." : state === "sent" ? "¡Enviado!" : "Error, intenta de nuevo"}
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              Tu reporte llegará directamente al equipo de Repartio.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
