"use client";

import { useParams, useRouter } from "next/navigation";
import { MapPin, Users, Zap, FileText, AlertCircle, AlertTriangle, CheckCircle2, X, Building2, Hash, Circle, PenLine, Loader2, Send, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useMemo, useEffect, useCallback } from "react";
import { BetaCoefficients } from "@/components/community/BetaCoefficients";
import { ParticipantsListPro } from "@/components/community/ParticipantsListPro";
import { DocumentosTab } from "@/components/community/DocumentosTab";
import { SignaturesTab } from "@/components/community/SignaturesTab";
import { GestorPanel } from "@/components/community/GestorPanel";
import {
  type Participant, type CoeficientMode, type Community, validateProject,
  MODALITIES, CONNECTION_TYPES, PROXIMITY_CRITERIA, DISTRIBUIDORAS,
  validateCUPS, validateCAU,
} from "@/lib/types/community";

const STEPS = [
  { id: "detalles", label: "Detalles", icon: Building2 },
  { id: "participantes", label: "Participantes", icon: Users },
  { id: "coeficientes", label: "Coeficientes", icon: Hash },
  { id: "firmas", label: "Firmas", icon: PenLine },
  { id: "documento", label: "Documentos", icon: FileText },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type StepStatus = "complete" | "error" | "pending";

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"ok" | "error" | null>(null);
  const [markingEnviado, setMarkingEnviado] = useState(false);
  const [activeStep, setActiveStep] = useState<StepId>("detalles");
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [conjuntoId, setConjuntoId] = useState<string | undefined>(undefined);

  // Community state
  const [baseCommunity, setBaseCommunity] = useState<Community | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [savedBetaValid, setSavedBetaValid] = useState(false);
  const [coefMode, setCoefMode] = useState<CoeficientMode>("fixed");
  const [gestorEnabled, setGestorEnabled] = useState(false);
  const [gestorName, setGestorName] = useState("");
  const [gestorNif, setGestorNif] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [cif, setCif] = useState("");
  const [admin, setAdmin] = useState("");
  const [cau, setCau] = useState("");
  const [power, setPower] = useState("");
  const [modality, setModality] = useState("con_excedentes_con_compensacion");
  const [connectionType, setConnectionType] = useState("red_interior");
  const [proximity, setProximity] = useState("mismo_edificio");

  // Cargar desde API
  useEffect(() => {
    fetch(`/api/communities/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((c: Community) => {
        setBaseCommunity(c);
        setParticipants(c.participants);
        const activeParts = c.participants.filter((p: Participant) => p.status !== "exited");
        const savedTotal = activeParts.reduce((s: number, p: Participant) => s + p.beta, 0);
        setSavedBetaValid(Math.abs(savedTotal - 1) < 0.001);
        setConjuntoId(c.conjuntoId ?? undefined);
        setCoefMode(c.coeficientMode);
        setGestorEnabled(c.gestorEnabled);
        setGestorName(c.gestorName || "");
        setGestorNif(c.gestorNif || "");
        setName(c.name);
        setAddress(c.address);
        setCity(c.city);
        setPostalCode(c.postalCode);
        setCif(c.cif || "");
        setAdmin(c.admin || "");
        setCau(c.cau);
        setPower(String(c.potenciaInstalada));
        setModality(c.modality);
        setConnectionType(c.connectionType);
        setProximity(c.proximity);
        setLoading(false);
      })
      .catch(() => { router.push("/communities"); });
  }, [id, router]);

  // Guardar cambios en detalles
  const handleSaveDetalles = useCallback(async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await fetch(`/api/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, address, city, postalCode, cif: cif || undefined, admin: admin || undefined,
          cau, power: parseFloat(power) || undefined,
          modality, connectionType, proximity,
          gestorEnabled, gestorName: gestorName || undefined, gestorNif: gestorNif || undefined,
        }),
      });
      setSaveResult(res.ok ? "ok" : "error");
    } catch {
      setSaveResult("error");
    }
    setSaving(false);
    setTimeout(() => setSaveResult(null), 3000);
  }, [id, name, address, city, postalCode, cif, admin, cau, power, modality, connectionType, proximity, gestorEnabled, gestorName, gestorNif]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/communities/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/communities");
    } catch {}
    setDeleting(false);
  }, [id, router]);

  const handleMarkEnviado = useCallback(async () => {
    setMarkingEnviado(true);
    try {
      const res = await fetch(`/api/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fase: "enviado" }),
      });
      if (res.ok && baseCommunity) {
        setBaseCommunity({ ...baseCommunity, phase: "enviado" });
      }
    } catch {}
    setMarkingEnviado(false);
  }, [id, baseCommunity]);

  const community = useMemo((): Community => ({
    ...(baseCommunity ?? {} as Community),
    name, address, city, postalCode, cif, admin, cau,
    potenciaInstalada: parseFloat(power) || 0,
    modality: modality as any,
    connectionType: connectionType as any,
    proximity: proximity as any,
    participants,
    coeficientMode: coefMode,
    gestorEnabled, gestorName, gestorNif,
  }), [baseCommunity, name, address, city, postalCode, cif, admin, cau, power, modality, connectionType, proximity, participants, coefMode, gestorEnabled, gestorName, gestorNif]);

  const activeParticipants = participants.filter(p => p.status !== "exited");
  const totalBeta = activeParticipants.reduce((s, p) => s + p.beta, 0);
  const betaValid = Math.abs(totalBeta - 1) < 0.001;

  const issues = useMemo(() => baseCommunity ? validateProject(community) : [], [community, baseCommunity]);
  const errors = issues.filter(i => i.type === "error");
  const warnings = issues.filter(i => i.type === "warning");

  const stepStatuses = useMemo((): Record<StepId, StepStatus> => {
    const cauResult = validateCAU(cau);
    const detalles: StepStatus = name.trim().length > 0 && cauResult.valid ? "complete" : "pending";
    const validParticipants = activeParticipants.filter(p => validateCUPS(p.cups).valid);
    const participantes: StepStatus = validParticipants.length > 0 ? "complete" : (activeParticipants.length > 0 ? "error" : "pending");
    const coeficientes: StepStatus = activeParticipants.length === 0 ? "pending" : (savedBetaValid ? "complete" : "error");
    const documento: StepStatus = community.documents?.txt ? "complete" : "pending";
    const allSigned = activeParticipants.length > 0 && activeParticipants.every(
      p => p.signatureState === "signed" && p.conjuntoFirmadoId === conjuntoId
    );
    const anyRejected = activeParticipants.some(p => p.signatureState === "rejected");
    const firmas: StepStatus = anyRejected ? "error" : (allSigned ? "complete" : "pending");
    return { detalles, participantes, coeficientes, documento, firmas };
  }, [name, cau, community, activeParticipants, savedBetaValid, conjuntoId]);

  const allComplete = Object.values(stepStatuses).every(s => s === "complete");
  const isEnviado = baseCommunity?.phase === "enviado";
  const isActivo = baseCommunity?.phase === "activo";
  const projectStatus = isActivo
    ? { label: "Activo", className: "bg-yellow-100 text-yellow-700" }
    : isEnviado
    ? { label: "Enviado", className: "bg-blue-100 text-blue-700" }
    : allComplete
    ? { label: "Validado", className: "bg-primary/10 text-primary" }
    : { label: "Borrador", className: "bg-muted text-muted-foreground" };

  const inputClass = "w-full px-3 py-3 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        {allComplete && !isEnviado && !isActivo && (
          <button
            onClick={handleMarkEnviado}
            disabled={markingEnviado}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {markingEnviado ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Marcar como enviado
          </button>
        )}
        {isEnviado && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Enviado a distribuidora
          </div>
        )}
        <AlertDialog onOpenChange={() => setDeleteConfirmText("")}>
          <AlertDialogTrigger asChild>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Eliminar comunidad">
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar comunidad</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es irreversible. Escribe <strong>{name}</strong> para confirmar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Escribe el nombre de la comunidad"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-destructive/30"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteConfirmText !== name || deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stepper */}
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
                  <CheckCircle2 className="text-yellow-500 flex-shrink-0" style={{ width: 18, height: 18 }} />
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
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Modalidad</label>
                  <select value={modality} onChange={(e) => setModality(e.target.value)} className={inputClass}>
                    {MODALITIES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Tipo de conexión</label>
                  <select value={connectionType} onChange={(e) => setConnectionType(e.target.value)} className={inputClass}>
                    {CONNECTION_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-semibold">Proximidad</label>
                <select value={proximity} onChange={(e) => setProximity(e.target.value)} className={inputClass}>
                  {PROXIMITY_CRITERIA.map(pc => <option key={pc.id} value={pc.id}>{pc.label}</option>)}
                </select>
              </div>
            </div>

            <GestorPanel
              enabled={gestorEnabled}
              gestorName={gestorName}
              gestorNif={gestorNif}
              onToggle={setGestorEnabled}
              onUpdate={(n, nif) => { setGestorName(n); setGestorNif(nif); }}
            />

            <div className="flex items-center justify-end gap-3">
              {saveResult === "ok" && (
                <span className="text-xs text-primary flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Guardado</span>
              )}
              {saveResult === "error" && (
                <span className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Error al guardar</span>
              )}
              <button
                onClick={handleSaveDetalles}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </div>
        )}

        {activeStep === "participantes" && (
          <ParticipantsListPro
            participants={participants}
            onParticipantsChange={setParticipants}
            communityId={id}
          />
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
            <BetaCoefficients
              participants={participants}
              mode={coefMode}
              onModeChange={setCoefMode}
              onParticipantsChange={setParticipants}
              communityId={id}
              conjuntoId={conjuntoId}
              onSaved={(cId) => { setConjuntoId(cId); setSavedBetaValid(betaValid); }}
            />
          </div>
        )}

        {activeStep === "documento" && (
          <DocumentosTab community={community} communityId={id} conjuntoId={conjuntoId} />
        )}

        {activeStep === "firmas" && (
          <SignaturesTab community={community} communityId={id} conjuntoId={conjuntoId} validationErrors={errors} />
        )}
      </div>
    </div>
  );
}
