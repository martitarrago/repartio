"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Zap, Users, Plus, X, Check, Sun, Sliders, FileCheck, Loader2 } from "lucide-react";
import { DISTRIBUIDORAS, type Modality, MODALITIES, type ConnectionType, type ProximityCriteria, validateCUPS, validateCAU, detectDistribuidora } from "@/lib/types/community";

interface NewParticipant {
  name: string;
  unit: string;
  cups: string;
  email: string;
  beta: number;
  detectedDistribuidora?: string;
}

const steps = [
  { id: 1, label: "Comunidad", icon: Building2 },
  { id: 2, label: "Instalación", icon: Zap },
  { id: 3, label: "Participantes", icon: Users },
  { id: 4, label: "Reparto", icon: Sliders },
  { id: 5, label: "Resumen", icon: FileCheck },
];

export default function NewCommunityPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [cif, setCif] = useState("");
  const [admin, setAdmin] = useState("");

  const [cau, setCau] = useState("");
  const [cauError, setCauError] = useState("");
  const [power, setPower] = useState("");
  const [modality, setModality] = useState<Modality>("con_excedentes_con_compensacion");

  const [participants, setParticipants] = useState<NewParticipant[]>([]);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newCups, setNewCups] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [cupsError, setCupsError] = useState("");

  const [isComplete, setIsComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0 && address.trim().length > 0 && city.trim().length > 0 && postalCode.trim().length > 0;
      case 2: return power.trim().length > 0 && validateCAU(cau).valid;
      default: return true;
    }
  };

  const addParticipant = () => {
    if (!newName) return;
    if (newCups) {
      const v = validateCUPS(newCups);
      if (!v.valid) { setCupsError(v.error || ""); return; }
    }
    const detected = newCups ? detectDistribuidora(newCups) : undefined;
    const detectedLabel = detected ? DISTRIBUIDORAS.find(d => d.id === detected)?.label : undefined;
    setParticipants([...participants, {
      name: newName, unit: newUnit, cups: newCups.toUpperCase(), email: newEmail,
      beta: 0, detectedDistribuidora: detectedLabel,
    }]);
    setNewName(""); setNewUnit(""); setNewCups(""); setNewEmail(""); setCupsError("");
  };

  const removeParticipant = (index: number) => setParticipants(participants.filter((_, i) => i !== index));

  const distributeEqually = () => {
    if (participants.length === 0) return;
    const equal = 1 / participants.length;
    setParticipants(participants.map(p => ({ ...p, beta: equal })));
  };

  const updateBeta = (index: number, value: number) => {
    setParticipants(participants.map((p, i) => i === index ? { ...p, beta: value } : p));
  };

  const totalBeta = participants.reduce((s, p) => s + p.beta, 0);
  const betaValid = participants.length === 0 || Math.abs(totalBeta - 1) < 0.000001;

  const summaryWarnings: string[] = [];
  if (participants.length === 0) summaryWarnings.push("No hay participantes añadidos");
  if (participants.length > 0 && !betaValid) summaryWarnings.push(`La suma de coeficientes es ${(totalBeta * 100).toFixed(2)}%, debe ser 100%`);
  if (parseFloat(power) > 100 && modality === "sin_excedentes") summaryWarnings.push("Instalaciones >100kW suelen requerir modalidad con excedentes");

  const handleFinish = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, address, city, postalCode,
          cif: cif || undefined,
          admin: admin || undefined,
          cau: cau.toUpperCase(),
          power: parseFloat(power),
          modality,
          participants: participants.map(p => ({
            name: p.name,
            cups: p.cups,
            email: p.email || undefined,
            unit: p.unit || undefined,
            beta: p.beta,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.message || "Error al crear la comunidad");
        setSubmitting(false);
        return;
      }
      setIsComplete(true);
      setTimeout(() => router.push("/communities"), 2000);
    } catch {
      setSubmitError("Error de conexión");
      setSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-20 text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 shadow-lg">
          <Check className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold font-heading text-foreground mb-2">Comunidad creada!</h2>
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{name}</span> está lista.
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-mono">CAU: {cau}</p>
        <p className="text-xs text-muted-foreground mt-1">Redirigiendo...</p>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-3 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all";

  return (
    <div className="max-w-2xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold font-heading text-foreground">Nueva comunidad</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configura tu instalación de autoconsumo colectivo</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone = s.id < step;
          return (
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => isDone && setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all w-full justify-center ${
                  isActive ? "bg-primary/10 text-primary ring-1 ring-primary/20" :
                  isDone ? "bg-primary text-primary-foreground cursor-pointer" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-4 h-0.5 rounded-full flex-shrink-0 transition-colors ${isDone ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-xl p-6" key={step}>
        {step === 1 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Datos de la comunidad</h2>
            <input type="text" placeholder="Nombre de la comunidad *" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus />
            <input type="text" placeholder="Dirección completa *" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Ciudad *" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Código postal *" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} />
            </div>
            <input type="text" placeholder="CIF de la comunidad" value={cif} onChange={(e) => setCif(e.target.value)} className={inputClass} />
            <input type="text" placeholder="Administrador / Representante" value={admin} onChange={(e) => setAdmin(e.target.value)} className={inputClass} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Datos de la instalación</h2>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">CAU *</label>
              <input type="text" placeholder="Ej. CAU-2024-001-MADRID" value={cau}
                onChange={(e) => { setCau(e.target.value); setCauError(""); }}
                className={`${inputClass} font-mono ${cauError ? "border-destructive ring-destructive/20" : ""}`} autoFocus />
              {cauError && <p className="text-[10px] text-destructive mt-1">{cauError}</p>}
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Potencia (kWp) *</label>
              <input type="number" placeholder="Ej. 45" value={power} onChange={(e) => setPower(e.target.value)} className={inputClass} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Participantes</h2>
            <p className="text-xs text-muted-foreground">Añade los vecinos con su CUPS (22 caracteres). La distribuidora se detecta automáticamente.</p>

            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input type="text" placeholder="Nombre *" value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  onKeyDown={(e) => e.key === "Enter" && addParticipant()} />
                <input type="text" placeholder="Piso" value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20" />
                <input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20" />
                <button onClick={addParticipant} className="px-3 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium">
                  <Plus className="w-3.5 h-3.5" /> Añadir
                </button>
              </div>
              <input type="text" placeholder="CUPS (22 caracteres)" value={newCups} onChange={(e) => { setNewCups(e.target.value); setCupsError(""); }}
                className={`w-full px-3 py-2.5 rounded-lg bg-muted/50 border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 ${cupsError ? "border-destructive" : "border-border"}`} />
              {cupsError && <p className="text-[10px] text-destructive">{cupsError}</p>}
            </div>

            {participants.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {participants.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 text-xs animate-fade-in">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                        {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-foreground font-medium truncate">{p.name}</span>
                      {p.unit && <span className="text-muted-foreground">{p.unit}</span>}
                      {p.cups && <span className="text-[9px] font-mono text-muted-foreground/70 truncate">{p.cups}</span>}
                      {p.detectedDistribuidora && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded badge-active">{p.detectedDistribuidora}</span>
                      )}
                    </div>
                    <button onClick={() => removeParticipant(i)} className="p-1 hover:bg-muted rounded">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Sun className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Aún no has añadido participantes</p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
              <Sliders className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Reparto de coeficientes β</h2>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">La suma debe ser exactamente 100%</p>
              <button onClick={distributeEqually} className="text-xs font-medium text-primary hover:underline">
                Distribuir equitativamente
              </button>
            </div>

            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50">
              <span className="text-xs font-medium text-foreground">Suma total</span>
              <span className={`text-sm font-mono font-bold ${betaValid ? "text-primary" : "text-destructive"}`}>
                {(totalBeta * 100).toFixed(2)}%
              </span>
            </div>

            {participants.length > 0 ? (
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/30">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                      {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="text-xs font-medium text-foreground flex-1 truncate">{p.name}</span>
                    <input
                      type="range" min="0" max="100" step="0.1"
                      value={p.beta * 100}
                      onChange={(e) => updateBeta(i, parseFloat(e.target.value) / 100)}
                      className="w-24 accent-primary"
                    />
                    <input
                      type="number" min="0" max="100" step="0.01"
                      value={(p.beta * 100).toFixed(2)}
                      onChange={(e) => updateBeta(i, parseFloat(e.target.value || "0") / 100)}
                      className="w-20 px-2 py-1.5 rounded-lg bg-card border border-border text-xs font-mono text-right text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground">Añade participantes en el paso anterior para configurar el reparto</p>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Resumen</h2>

            <div className="space-y-3">
              <div className="border border-border rounded-lg p-4 space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Comunidad</p>
                <p className="text-sm font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{address}, {postalCode} {city}</p>
                {cif && <p className="text-xs text-muted-foreground">CIF: {cif}</p>}
                {admin && <p className="text-xs text-muted-foreground">Admin: {admin}</p>}
              </div>

              <div className="border border-border rounded-lg p-4 space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Instalación</p>
                <p className="text-xs text-foreground">CAU: <span className="font-mono">{cau}</span></p>
                <p className="text-xs text-foreground">Potencia: {power} kWp</p>
                <p className="text-xs text-foreground">Modalidad: {MODALITIES.find(m => m.id === modality)?.label}</p>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Participantes ({participants.length})</p>
                {participants.length > 0 ? (
                  <div className="space-y-0.5">
                    {participants.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{p.name} {p.unit && `(${p.unit})`}</span>
                        <span className="font-mono text-muted-foreground">{(p.beta * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-xs font-medium pt-1 border-t border-border">
                      <span>Total</span>
                      <span className={`font-mono ${betaValid ? "text-primary" : "text-destructive"}`}>{(totalBeta * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin participantes</p>
                )}
              </div>
            </div>

            {summaryWarnings.length > 0 && (
              <div className="border border-border rounded-lg p-4 badge-warning space-y-1">
                {summaryWarnings.map((w, i) => (
                  <p key={i} className="text-xs">{w}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
            step === 1 ? "opacity-0 pointer-events-none" : "bg-muted text-foreground hover:bg-muted/80"
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Anterior
        </button>
        {step < 5 ? (
          <button
            onClick={() => {
              if (step === 2) {
                const v = validateCAU(cau);
                if (!v.valid) { setCauError(v.error || ""); return; }
              }
              setStep(step + 1);
            }}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Siguiente <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex flex-col items-end gap-1">
            {submitError && <p className="text-xs text-destructive">{submitError}</p>}
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Crear comunidad
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
