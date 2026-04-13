"use client";

import { useParams } from "next/navigation";
import { MapPin, Users, Zap, FileText, AlertCircle, AlertTriangle, CheckCircle2, X, Building2, Hash, Circle, PenLine } from "lucide-react";
import { useState, useMemo } from "react";
import { BetaCoefficients } from "@/components/community/BetaCoefficients";
import { ParticipantsListPro } from "@/components/community/ParticipantsListPro";
import { DocumentsTabPro } from "@/components/community/DocumentsTabPro";
import { TxtGeneratorTabPro } from "@/components/community/TxtGeneratorTabPro";
import { SignaturesTab } from "@/components/community/SignaturesTab";
import { GestorPanel } from "@/components/community/GestorPanel";
import { mockCommunities } from "@/lib/mock-data";
import {
  type Participant, type CoeficientMode, validateProject,
  MODALITIES, CONNECTION_TYPES, PROXIMITY_CRITERIA, DISTRIBUIDORAS,
  validateCUPS, validateCAU,
} from "@/lib/types/community";

const STEPS = [
  { id: "detalles", label: "Detalles", icon: Building2 },
  { id: "participantes", label: "Participantes", icon: Users },
  { id: "coeficientes", label: "Coeficientes", icon: Hash },
  { id: "documento", label: "Documento", icon: FileText },
  { id: "firmas", label: "Firmas", icon: PenLine },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type StepStatus = "complete" | "error" | "pending";

export default function CommunityDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeStep, setActiveStep] = useState<StepId>("detalles");

  const baseCommunity = mockCommunities.find(c => c.id === id) || mockCommunities[0];

  const [participants, setParticipants] = useState<Participant[]>(baseCommunity.participants);
  const [coefMode, setCoefMode] = useState<CoeficientMode>(baseCommunity.coeficientMode);
  const [gestorEnabled, setGestorEnabled] = useState(baseCommunity.gestorEnabled);
  const [gestorName, setGestorName] = useState(baseCommunity.gestorName || "");
  const [gestorNif, setGestorNif] = useState(baseCommunity.gestorNif || "");

  const [name, setName] = useState(baseCommunity.name);
  const [address, setAddress] = useState(baseCommunity.address);
  const [city, setCity] = useState(baseCommunity.city);
  const [postalCode, setPostalCode] = useState(baseCommunity.postalCode);
  const [cif, setCif] = useState(baseCommunity.cif || "");
  const [admin, setAdmin] = useState(baseCommunity.admin || "");
  const [cau, setCau] = useState(baseCommunity.cau);
  const [power, setPower] = useState(String(baseCommunity.potenciaInstalada));
  const [modality, setModality] = useState(baseCommunity.modality);
  const [connectionType, setConnectionType] = useState(baseCommunity.connectionType);
  const [proximity, setProximity] = useState(baseCommunity.proximity);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const community = useMemo(() => ({
    ...baseCommunity,
    name, address, city, postalCode, cif, admin, cau,
    potenciaInstalada: parseFloat(power) || baseCommunity.potenciaInstalada,
    modality, connectionType, proximity,
    participants,
    coeficientMode: coefMode,
    gestorEnabled, gestorName, gestorNif,
  }), [baseCommunity, name, address, city, postalCode, cif, admin, cau, power, modality, connectionType, proximity, participants, coefMode, gestorEnabled, gestorName, gestorNif]);

  const activeParticipants = participants.filter(p => p.status !== "exited");
  const totalBeta = activeParticipants.reduce((s, p) => s + p.beta, 0);
  const betaValid = Math.abs(totalBeta - 1) < 0.001;

  const issues = useMemo(() => validateProject(community), [community]);
  const errors = issues.filter(i => i.type === "error");
  const warnings = issues.filter(i => i.type === "warning");

  const stepStatuses = useMemo((): Record<StepId, StepStatus> => {
    const hasName = name.trim().length > 0;
    const cauResult = validateCAU(cau);
    const detalles: StepStatus = hasName && cauResult.valid ? "complete" : "pending";

    const validParticipants = activeParticipants.filter(p => validateCUPS(p.cups).valid);
    const participantes: StepStatus = validParticipants.length > 0 ? "complete" : (activeParticipants.length > 0 ? "error" : "pending");

    const coeficientes: StepStatus = activeParticipants.length === 0 ? "pending" : (betaValid ? "complete" : "error");

    const documento: StepStatus = community.documents.txt ? "complete" : "pending";

    const allSigned = activeParticipants.length > 0 && activeParticipants.every(p => p.signatureState === "signed");
    const anyRejected = activeParticipants.some(p => p.signatureState === "rejected");
    const firmas: StepStatus = anyRejected ? "error" : (allSigned ? "complete" : "pending");

    return { detalles, participantes, coeficientes, documento, firmas };
  }, [name, cau, community, activeParticipants, betaValid]);

  const allComplete = Object.values(stepStatuses).every(s => s === "complete");
  const projectStatus = allComplete
    ? { label: "Validado", className: "bg-primary/10 text-primary" }
    : { label: "Borrador", className: "bg-muted text-muted-foreground" };

  const inputClass = "w-full px-3 py-3 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all";

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold font-heading text-foreground">{community.name}</h1>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${projectStatus.className}`}>
              {projectStatus.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{community.address}, {community.city}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{activeParticipants.length} participantes</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{community.potenciaInstalada} kWp</span>
          </div>
        </div>
      </div>

      {/* 5-step stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const status = stepStatuses[step.id];
          const isActive = step.id === activeStep;
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full ${
                  isActive ? "bg-card border border-border shadow-sm" : "hover:bg-muted/50"
                }`}
              >
                {status === "complete" ? (
                  <CheckCircle2 className="text-primary flex-shrink-0" style={{ width: 18, height: 18 }} />
                ) : status === "error" ? (
                  <AlertCircle className="text-destructive flex-shrink-0" style={{ width: 18, height: 18 }} />
                ) : (
                  <Circle className={`flex-shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground/40"}`} style={{ width: 18, height: 18 }} />
                )}
                <div className="text-left min-w-0">
                  <p className={`text-xs font-semibold leading-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                  <p className={`text-[10px] leading-tight mt-0.5 ${
                    status === "complete" ? "text-primary" : status === "error" ? "text-destructive" : "text-muted-foreground/60"
                  }`}>
                    {status === "complete" ? "Completado" : status === "error" ? "Requiere atención" : "Pendiente"}
                  </p>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px flex-shrink-0 ${stepStatuses[STEPS[i].id] === "complete" ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Validation Banner */}
      {!dismissedBanner && (errors.length > 0 || warnings.length > 0) && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 relative">
          <button onClick={() => setDismissedBanner(true)} className="absolute top-3 right-3 p-1 rounded hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {errors.map((e, i) => (
            <div key={`e${i}`} className="flex items-start gap-2 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
              <span className="text-destructive">{e.message}</span>
              {e.action && <button className="ml-auto text-[10px] font-medium text-primary hover:underline whitespace-nowrap">{e.action}</button>}
            </div>
          ))}
          {warnings.map((w, i) => (
            <div key={`w${i}`} className="flex items-start gap-2 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      <div key={activeStep} className="animate-fade-in">
        {activeStep === "detalles" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Datos de la comunidad</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Nombre</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Administrador</label>
                  <input type="text" value={admin} onChange={(e) => setAdmin(e.target.value)} placeholder="Administrador / Representante" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Dirección</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Ciudad</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Código postal</label>
                  <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">CIF</label>
                  <input type="text" value={cif} onChange={(e) => setCif(e.target.value)} placeholder="Opcional" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Datos de la instalación</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">CAU</label>
                  <input type="text" value={cau} onChange={(e) => setCau(e.target.value)} className={`${inputClass} font-mono`} />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Potencia (kWp)</label>
                  <input type="number" value={power} onChange={(e) => setPower(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Distribuidora</label>
                  <div className="px-3 py-3 rounded-lg bg-muted/50 border border-border text-sm text-foreground">
                    {DISTRIBUIDORAS.find(d => d.id === community.distribuidora)?.label || community.distribuidora}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Modalidad</label>
                  <select value={modality} onChange={(e) => setModality(e.target.value as typeof modality)} className={inputClass}>
                    {MODALITIES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Tipo de conexión</label>
                  <select value={connectionType} onChange={(e) => setConnectionType(e.target.value as typeof connectionType)} className={inputClass}>
                    {CONNECTION_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Proximidad</label>
                  <select value={proximity} onChange={(e) => setProximity(e.target.value as typeof proximity)} className={inputClass}>
                    {PROXIMITY_CRITERIA.map(pc => <option key={pc.id} value={pc.id}>{pc.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <GestorPanel
              enabled={gestorEnabled}
              gestorName={gestorName}
              gestorNif={gestorNif}
              onToggle={setGestorEnabled}
              onUpdate={(n, nif) => { setGestorName(n); setGestorNif(nif); }}
            />
          </div>
        )}

        {activeStep === "participantes" && (
          <ParticipantsListPro participants={participants} onParticipantsChange={setParticipants} />
        )}

        {activeStep === "coeficientes" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${betaValid ? "bg-primary/10" : "bg-destructive/10"}`}>
                  <Hash className={`w-4 h-4 ${betaValid ? "text-primary" : "text-destructive"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Suma de coeficientes</p>
                  <p className={`text-xs ${betaValid ? "text-primary" : "text-destructive"}`}>
                    {betaValid ? "Válido — listo para generar documento" : "Debe sumar exactamente 100%"}
                  </p>
                </div>
              </div>
              <span className={`text-lg font-mono font-bold ${betaValid ? "text-primary" : "text-destructive"}`}>
                {(totalBeta * 100).toFixed(2)}%
              </span>
            </div>
            <BetaCoefficients participants={participants} mode={coefMode} onModeChange={setCoefMode} onParticipantsChange={setParticipants} />
          </div>
        )}

        {activeStep === "documento" && (
          <div className="space-y-6">
            <TxtGeneratorTabPro community={community} />
            <div className="border-t border-border pt-6">
              <DocumentsTabPro community={community} />
            </div>
          </div>
        )}

        {activeStep === "firmas" && (
          <SignaturesTab community={community} />
        )}
      </div>
    </div>
  );
}
