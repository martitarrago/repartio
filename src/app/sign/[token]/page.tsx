"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Zap, AlertCircle, PenLine } from "lucide-react";

interface TokenData {
  participante: {
    nombre: string;
    cups: string;
    unidad: string | null;
    email: string | null;
    estadoFirma: string;
  };
  instalacion: {
    nombre: string;
    cau: string;
    direccion: string | null;
    municipio: string | null;
    potenciaKw: number | null;
    modalidad: string;
  };
  participantes: {
    nombre: string;
    cups: string;
    unidad: string | null;
    beta: number;
  }[];
}

type PageState = "loading" | "ready" | "signing" | "signed" | "already_signed" | "expired" | "error";

const MODALIDAD_LABELS: Record<string, string> = {
  COLECTIVO_SIN_EXCEDENTES: "Sin excedentes",
  COLECTIVO_CON_EXCEDENTES: "Con excedentes y compensación",
  INDIVIDUAL_SIN_EXCEDENTES: "Sin excedentes (individual)",
  INDIVIDUAL_CON_EXCEDENTES: "Con excedentes (individual)",
};

export default function SignPage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<TokenData | null>(null);
  const [error, setError] = useState("");
  const [firmadoEn, setFirmadoEn] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then(async r => {
        const json = await r.json();
        if (r.status === 409) { setState("already_signed"); return; }
        if (r.status === 410) { setState("expired"); return; }
        if (!r.ok) { setError(json.error ?? "Error desconocido"); setState("error"); return; }
        setData(json);
        setState("ready");
      })
      .catch(() => { setState("error"); setError("Error de conexión"); });
  }, [token]);

  const handleSign = async () => {
    if (!confirmed) return;
    setState("signing");
    try {
      const res = await fetch(`/api/sign/${token}`, { method: "POST" });
      const json = await res.json();
      if (res.status === 409) { setState("already_signed"); return; }
      if (!res.ok) { setError(json.error ?? "Error al firmar"); setState("error"); return; }
      setFirmadoEn(json.firmadoEn);
      setState("signed");
    } catch {
      setState("error");
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="font-semibold text-gray-900">Repartio</span>
          <span className="text-gray-400 text-sm ml-2">Firma de acuerdo</span>
        </div>
      </header>

      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Loading */}
          {state === "loading" && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h1 className="text-lg font-semibold text-gray-900 mb-2">Enlace no válido</h1>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          )}

          {/* Expired */}
          {state === "expired" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h1 className="text-lg font-semibold text-gray-900 mb-2">Enlace caducado</h1>
              <p className="text-gray-500 text-sm">Este enlace de firma ha expirado. Solicita uno nuevo al administrador de tu comunidad.</p>
            </div>
          )}

          {/* Already signed */}
          {state === "already_signed" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h1 className="text-lg font-semibold text-gray-900 mb-2">Ya firmaste este documento</h1>
              <p className="text-gray-500 text-sm">Tu firma ya estaba registrada. No es necesario volver a firmar.</p>
            </div>
          )}

          {/* Signed — success */}
          {state === "signed" && (
            <div className="bg-white rounded-2xl border border-yellow-200 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-yellow-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">¡Documento firmado!</h1>
              <p className="text-gray-500 text-sm mb-4">
                Has firmado el acuerdo de reparto de <strong>{data?.instalacion.nombre}</strong>.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 text-left space-y-1">
                <p><span className="font-medium">Firmante:</span> {data?.participante.nombre}</p>
                <p><span className="font-medium">CUPS:</span> {data?.participante.cups}</p>
                <p><span className="font-medium">Fecha y hora:</span> {firmadoEn ? new Date(firmadoEn).toLocaleString("es-ES") : ""}</p>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Recibirás una copia por email cuando el administrador complete el proceso.
              </p>
            </div>
          )}

          {/* Ready to sign */}
          {(state === "ready" || state === "signing") && data && (
            <>
              {/* Hero */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h1 className="font-bold text-gray-900">{data.instalacion.nombre}</h1>
                    <p className="text-sm text-gray-500">
                      {data.instalacion.direccion}{data.instalacion.municipio ? `, ${data.instalacion.municipio}` : ""}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-0.5">CAU</p>
                    <p className="font-mono font-medium text-gray-700 text-xs">{data.instalacion.cau}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Potencia</p>
                    <p className="font-semibold text-gray-700">{data.instalacion.potenciaKw ?? "—"} kWp</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Modalidad</p>
                    <p className="font-medium text-gray-700 text-sm">{MODALIDAD_LABELS[data.instalacion.modalidad] ?? data.instalacion.modalidad}</p>
                  </div>
                </div>
              </div>

              {/* Your data */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Tus datos</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Nombre</span>
                    <span className="font-medium text-gray-900">{data.participante.nombre}</span>
                  </div>
                  {data.participante.unidad && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Unidad</span>
                      <span className="font-medium text-gray-900">{data.participante.unidad}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">CUPS</span>
                    <span className="font-mono text-xs text-gray-700">{data.participante.cups}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Tu coeficiente β</span>
                    <span className="font-bold text-gray-900">
                      {((data.participantes.find(p => p.cups === data.participante.cups)?.beta ?? 0) * 100).toFixed(4)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Distribution table */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                  Reparto de energía — todos los participantes
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-xs text-gray-400 font-medium">Participante</th>
                        <th className="text-left py-2 text-xs text-gray-400 font-medium">Unidad</th>
                        <th className="text-right py-2 text-xs text-gray-400 font-medium">Coef. β</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.participantes.map((p, i) => {
                        const isMe = p.cups === data.participante.cups;
                        return (
                          <tr key={i} className={`border-b border-gray-50 ${isMe ? "bg-yellow-50" : ""}`}>
                            <td className={`py-2.5 ${isMe ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                              {p.nombre} {isMe && <span className="text-xs text-yellow-600 ml-1">(tú)</span>}
                            </td>
                            <td className="py-2.5 text-gray-500 text-xs">{p.unidad ?? "—"}</td>
                            <td className={`py-2.5 text-right font-mono text-xs ${isMe ? "font-bold text-gray-900" : "text-gray-600"}`}>
                              {(p.beta * 100).toFixed(4)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200">
                        <td colSpan={2} className="pt-2 text-xs text-gray-400 font-medium">Total</td>
                        <td className="pt-2 text-right font-mono text-xs font-bold text-gray-700">
                          {(data.participantes.reduce((s, p) => s + p.beta, 0) * 100).toFixed(4)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Legal text */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold mb-1">Acuerdo de autoconsumo colectivo</p>
                <p>
                  Al firmar este documento, confirmo que he leído y acepto los coeficientes de reparto de energía indicados
                  arriba, de conformidad con el <strong>Real Decreto 244/2019</strong> y el <strong>Real Decreto 244/2024</strong>
                  sobre autoconsumo de energía eléctrica. Estos coeficientes determinan la fracción de la energía producida
                  por la instalación fotovoltaica compartida que se asignará a mi punto de suministro.
                </p>
              </div>

              {/* Confirm checkbox + sign button */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={e => setConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-yellow-500 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">
                    He leído el acuerdo de reparto y confirmo que los coeficientes β son correctos.
                    Entiendo que al pulsar "Firmar" quedaré vinculado a este reparto.
                  </span>
                </label>

                <button
                  onClick={handleSign}
                  disabled={!confirmed || state === "signing"}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {state === "signing" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <PenLine className="w-5 h-5" />
                  )}
                  {state === "signing" ? "Registrando firma..." : "Firmar el acuerdo"}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Firma electrónica simple (eIDAS) · Se registrará tu IP y la fecha/hora exacta
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        Repartio © {new Date().getFullYear()} · Plataforma de autoconsumo colectivo
      </footer>
    </div>
  );
}
