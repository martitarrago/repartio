"use client";

import { useState, useEffect } from "react";
import {
  User, Building2, Lock, Users, Check, Loader2, AlertCircle,
  Trash2, Shield, Eye, EyeOff, Plus, X, Sparkles,
} from "lucide-react";
import Link from "next/link";

const inputClass = "w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all";
const labelClass = "text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block";

const ROL_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  LECTOR: "Lector",
};

type SaveState = "idle" | "saving" | "saved" | "error";

function SaveButton({ state, onClick, label = "Guardar cambios" }: { state: SaveState; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={state === "saving"}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {state === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {state === "saved" && <Check className="w-3.5 h-3.5" />}
      {state === "error" && <AlertCircle className="w-3.5 h-3.5" />}
      {state === "saving" ? "Guardando..." : state === "saved" ? "Guardado" : state === "error" ? "Error" : label}
    </button>
  );
}

// ── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection() {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    fetch("/api/settings/profile")
      .then(r => r.json())
      .then(d => { setNombre(d.nombre ?? ""); setApellidos(d.apellidos ?? ""); setEmail(d.email ?? ""); setRol(d.rol ?? ""); });
  }, []);

  const save = async () => {
    setSaveState("saving");
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, apellidos, email }),
    });
    setSaveState(res.ok ? "saved" : "error");
    setTimeout(() => setSaveState("idle"), 2500);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Mi perfil</h2>
        {rol && (
          <span className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {ROL_LABELS[rol] ?? rol}
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Apellidos</label>
            <input type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div className="flex justify-end">
          <SaveButton state={saveState} onClick={save} />
        </div>
      </div>
    </div>
  );
}

// ── Password Section ─────────────────────────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const save = async () => {
    setErrorMsg("");
    if (next !== confirm) { setErrorMsg("Las contraseñas no coinciden"); return; }
    if (next.length < 8) { setErrorMsg("Mínimo 8 caracteres"); return; }
    setSaveState("saving");
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    if (res.ok) {
      setSaveState("saved");
      setCurrent(""); setNext(""); setConfirm("");
    } else {
      const d = await res.json();
      setErrorMsg(d.error ?? "Error al cambiar contraseña");
      setSaveState("error");
    }
    setTimeout(() => setSaveState("idle"), 2500);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Cambiar contraseña</h2>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <label className={labelClass}>Contraseña actual</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={e => setCurrent(e.target.value)}
              className={inputClass}
            />
            <button onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nueva contraseña</label>
            <div className="relative">
              <input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={e => setNext(e.target.value)}
                className={inputClass}
              />
              <button onClick={() => setShowNext(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={`${inputClass} ${confirm && confirm !== next ? "border-destructive" : ""}`}
            />
          </div>
        </div>
        {errorMsg && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
          </p>
        )}
        <div className="flex justify-end">
          <SaveButton state={saveState} onClick={save} label="Cambiar contraseña" />
        </div>
      </div>
    </div>
  );
}

// ── Organization Section ─────────────────────────────────────────────────────

function OrganizationSection() {
  const [nombre, setNombre] = useState("");
  const [cif, setCif] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    fetch("/api/settings/organization")
      .then(r => r.json())
      .then(d => {
        setNombre(d.nombre ?? ""); setCif(d.cif ?? "");
        setEmail(d.email ?? ""); setTelefono(d.telefono ?? "");
        setDireccion(d.direccion ?? "");
      });
  }, []);

  const save = async () => {
    setSaveState("saving");
    const res = await fetch("/api/settings/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, cif, email, telefono, direccion }),
    });
    setSaveState(res.ok ? "saved" : "error");
    setTimeout(() => setSaveState("idle"), 2500);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <Building2 className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Organización</h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre de la empresa</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>CIF</label>
            <input type="text" value={cif} onChange={e => setCif(e.target.value)} placeholder="B12345678" className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email de contacto</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+34 600 000 000" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Dirección</label>
          <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle, número, ciudad" className={inputClass} />
        </div>
        <div className="flex justify-end">
          <SaveButton state={saveState} onClick={save} />
        </div>
      </div>
    </div>
  );
}

// ── Team Section ─────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  nombre: string;
  apellidos: string | null;
  email: string;
  rol: string;
  ultimoAcceso: string | null;
}

function TeamSection() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteNombre, setInviteNombre] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRol, setInviteRol] = useState("GESTOR");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/team").then(r => r.json()).then(d => setMembers(Array.isArray(d) ? d : []));
  }, []);

  const handleInvite = async () => {
    setInviteError("");
    setInviting(true);
    const res = await fetch("/api/settings/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: inviteNombre, email: inviteEmail, rol: inviteRol, password: invitePassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setMembers(prev => [...prev, data]);
      setShowInvite(false);
      setInviteNombre(""); setInviteEmail(""); setInvitePassword("");
    } else {
      setInviteError(data.error ?? "Error al añadir usuario");
    }
    setInviting(false);
  };

  const handleChangeRol = async (userId: string, rol: string) => {
    const res = await fetch(`/api/settings/team/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol }),
    });
    if (res.ok) {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, rol } : m));
    }
  };

  const handleDelete = async (userId: string) => {
    setDeletingId(userId);
    const res = await fetch(`/api/settings/team/${userId}`, { method: "DELETE" });
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== userId));
    setDeletingId(null);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Equipo</h2>
          <span className="text-xs text-muted-foreground">({members.length} usuarios)</span>
        </div>
        <button
          onClick={() => setShowInvite(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          {showInvite ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showInvite ? "Cancelar" : "Añadir usuario"}
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="p-5 border-b border-border bg-muted/20 space-y-3">
          <h3 className="text-xs font-semibold text-foreground">Nuevo usuario</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Nombre *" value={inviteNombre} onChange={e => setInviteNombre(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20" />
            <input type="email" placeholder="Email *" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20" />
            <input type="password" placeholder="Contraseña inicial *" value={invitePassword} onChange={e => setInvitePassword(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20" />
            <select value={inviteRol} onChange={e => setInviteRol(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20">
              <option value="ADMIN">Administrador</option>
              <option value="GESTOR">Gestor</option>
              <option value="LECTOR">Lector (solo lectura)</option>
            </select>
          </div>
          {inviteError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {inviteError}
            </p>
          )}
          <button onClick={handleInvite} disabled={inviting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50">
            {inviting && <Loader2 className="w-3 h-3 animate-spin" />}
            Añadir usuario
          </button>
        </div>
      )}

      {/* Members list */}
      <div className="divide-y divide-border">
        {members.map(m => (
          <div key={m.id} className="px-5 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {m.nombre.charAt(0)}{m.apellidos?.charAt(0) ?? ""}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{m.nombre} {m.apellidos ?? ""}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
            <select
              value={m.rol}
              onChange={e => handleChangeRol(m.id, e.target.value)}
              className="text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none"
            >
              <option value="ADMIN">Admin</option>
              <option value="GESTOR">Gestor</option>
              <option value="LECTOR">Lector</option>
            </select>
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
            <button
              onClick={() => handleDelete(m.id)}
              disabled={deletingId === m.id}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
              title="Eliminar usuario"
            >
              {deletingId === m.id
                ? <Loader2 className="w-3.5 h-3.5 text-destructive animate-spin" />
                : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function PlanSection() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm text-foreground">Mi plan</h2>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Plan Gratis</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EF9F27]/15 text-[#B8760A]">Beta</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">1 comunidad · 1 usuario · Todas las funciones</p>
        </div>
        <Link
          href="/pricing"
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Ver planes
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Estamos en beta — los planes y precios definitivos se anunciarán próximamente.
        Escríbenos a{" "}
        <a href="mailto:hola@repartio.es" className="underline hover:text-foreground transition-colors">
          hola@repartio.es
        </a>
        {" "}para cualquier consulta.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold font-heading text-foreground">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Gestiona tu cuenta, organización y equipo</p>
      </div>
      <PlanSection />
      <ProfileSection />
      <PasswordSection />
      <OrganizationSection />
      <TeamSection />
    </div>
  );
}
