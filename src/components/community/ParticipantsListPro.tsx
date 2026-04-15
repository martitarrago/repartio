"use client";

import { useState } from "react";
import { Plus, Mail, X, Upload, Search, AlertCircle, Check, Pencil, Loader2 } from "lucide-react";
import { type Participant, validateCUPS } from "@/lib/types/community";
import { ImportParticipantsDialog } from "./ImportParticipantsDialog";

interface ParticipantsListProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  communityId?: string;
}

const STATUS_CONFIG = {
  active:  { label: "Activo",   className: "bg-primary/15 text-primary" },
  pending: { label: "Pendiente", className: "bg-accent/15 text-accent" },
  exited:  { label: "Baja",     className: "bg-destructive/15 text-destructive" },
};

const AVATAR_COLORS = [
  "hsl(160, 84%, 45%)", "hsl(43, 96%, 61%)",  "hsl(200, 80%, 70%)",
  "hsl(280, 60%, 65%)", "hsl(340, 70%, 60%)", "hsl(20, 90%, 60%)",
  "hsl(100, 50%, 50%)", "hsl(220, 70%, 60%)",
];

interface EditState {
  name: string;
  cups: string;
  email: string;
  unit: string;
  cupsError: string;
}

function ParticipantRow({
  participant: p,
  index,
  communityId,
  onUpdate,
  onToggleExit,
}: {
  participant: Participant;
  index: number;
  communityId?: string;
  onUpdate: (updated: Participant) => void;
  onToggleExit: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<EditState>({
    name: p.name, cups: p.cups, email: p.email, unit: p.unit, cupsError: "",
  });

  const initials = p.name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const status = STATUS_CONFIG[p.status];

  const startEdit = () => {
    setEdit({ name: p.name, cups: p.cups, email: p.email, unit: p.unit, cupsError: "" });
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    const cupsClean = edit.cups.toUpperCase().replace(/\s/g, "");
    const cupsValidation = validateCUPS(cupsClean);
    if (!cupsValidation.valid) {
      setEdit(e => ({ ...e, cupsError: cupsValidation.error ?? "CUPS inválido" }));
      return;
    }
    if (!edit.name.trim()) return;

    setSaving(true);

    const updated: Participant = {
      ...p,
      name: edit.name.trim(),
      cups: cupsClean,
      email: edit.email.trim(),
      unit: edit.unit.trim(),
    };

    // Persist to API if communityId is provided
    if (communityId) {
      try {
        await fetch(`/api/communities/${communityId}/participants/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: updated.name,
            cups: updated.cups,
            email: updated.email || undefined,
            unit: updated.unit || undefined,
          }),
        });
      } catch {
        // continue with local update even if API call fails
      }
    }

    onUpdate(updated);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="glass-card rounded-xl px-4 py-3 animate-fade-in border border-primary/20 bg-primary/5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">Nombre</label>
            <input
              type="text"
              value={edit.name}
              onChange={e => setEdit(ev => ({ ...ev, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">Piso / Puerta</label>
            <input
              type="text"
              value={edit.unit}
              placeholder="Ej. 2ºA"
              onChange={e => setEdit(ev => ({ ...ev, unit: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">CUPS (22 caracteres)</label>
            <input
              type="text"
              value={edit.cups}
              onChange={e => setEdit(ev => ({ ...ev, cups: e.target.value, cupsError: "" }))}
              className={`w-full px-3 py-2 rounded-lg bg-background border text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 ${
                edit.cupsError ? "border-destructive" : "border-border"
              }`}
            />
            {edit.cupsError && (
              <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {edit.cupsError}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">Email</label>
            <input
              type="email"
              value={edit.email}
              onChange={e => setEdit(ev => ({ ...ev, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={saveEdit}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Guardar
          </button>
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            <X className="w-3 h-3" /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-card rounded-xl px-4 py-2.5 grid grid-cols-12 gap-2 items-center hover-lift animate-fade-in group ${
        p.status === "exited" ? "opacity-50" : ""
      }`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Name + unit */}
      <div className="col-span-3 flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
          style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
          <p className="text-[10px] text-muted-foreground">{p.unit} · {p.email}</p>
        </div>
      </div>

      {/* CUPS */}
      <div className="col-span-4">
        <span className="text-[10px] font-mono text-muted-foreground tracking-tight">{p.cups}</span>
      </div>

      {/* Beta */}
      <div className="col-span-1 text-right">
        <span className="text-xs font-mono font-semibold text-foreground">{(p.beta * 100).toFixed(1)}%</span>
      </div>

      {/* Status */}
      <div className="col-span-2 flex justify-center">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={startEdit}
          className="p-1.5 rounded-lg hover:bg-secondary"
          title="Editar participante"
        >
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => onToggleExit(p.id)}
          className="p-1.5 rounded-lg hover:bg-secondary"
          title={p.status === "exited" ? "Reactivar" : "Dar de baja"}
        >
          {p.status === "exited" ? (
            <Check className="w-3.5 h-3.5 text-primary" />
          ) : (
            <X className="w-3.5 h-3.5 text-destructive" />
          )}
        </button>
      </div>
    </div>
  );
}

export function ParticipantsListPro({ participants, onParticipantsChange, communityId }: ParticipantsListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCups, setNewCups] = useState("");
  const [newPotencia, setNewPotencia] = useState("");
  const [cupsError, setCupsError] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cups.includes(search.toUpperCase()) ||
    p.unit.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = participants.filter(p => p.status === "active").length;

  const handleAdd = async () => {
    const cupsClean = newCups.toUpperCase().replace(/\s/g, "");
    const cupsValidation = validateCUPS(cupsClean);
    if (!cupsValidation.valid) {
      setCupsError(cupsValidation.error || "CUPS inválido");
      return;
    }
    if (!newName.trim()) return;

    setAddSaving(true);

    const newParticipant: Participant = {
      id: `p${Date.now()}`,
      name: newName.trim(),
      cups: cupsClean,
      email: newEmail.trim(),
      unit: newUnit.trim(),
      beta: 0,
      potenciaContratada: parseFloat(newPotencia) || undefined,
      status: "pending",
      signatureState: "pending",
      entryDate: new Date().toISOString().slice(0, 10),
    };

    // Persist to API
    if (communityId) {
      try {
        const res = await fetch(`/api/communities/${communityId}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newParticipant.name,
            cups: newParticipant.cups,
            email: newParticipant.email || undefined,
            unit: newParticipant.unit || undefined,
          }),
        });
        if (res.ok) {
          const { id } = await res.json();
          newParticipant.id = id;
        }
      } catch {
        // continue with local id
      }
    }

    onParticipantsChange([...participants, newParticipant]);
    setAddSaving(false);
    setShowAddForm(false);
    setNewName(""); setNewUnit(""); setNewEmail(""); setNewCups(""); setNewPotencia("");
    setCupsError("");
  };

  const handleUpdate = (updated: Participant) => {
    onParticipantsChange(participants.map(p => p.id === updated.id ? updated : p));
  };

  const toggleExit = async (id: string) => {
    const p = participants.find(pt => pt.id === id);
    if (!p) return;
    const newStatus = p.status === "exited" ? "active" : "exited";
    const estadoParticipante = newStatus === "exited" ? "BAJA" : "ACTIVO";

    // Optimistic update
    onParticipantsChange(
      participants.map(pt =>
        pt.id === id
          ? { ...pt, status: newStatus as Participant["status"], exitDate: newStatus === "exited" ? new Date().toISOString().slice(0, 10) : undefined }
          : pt
      )
    );

    if (communityId) {
      try {
        await fetch(`/api/communities/${communityId}/participants/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estadoParticipante }),
        });
      } catch {}
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {participants.length} participantes · {activeCount} activos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium text-xs hover:bg-secondary/80 transition-colors border border-border"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-medium text-xs hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddForm ? "Cancelar" : "Añadir"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre, CUPS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="glass-card rounded-2xl p-5 animate-scale-in space-y-3">
          <h3 className="font-heading font-semibold text-sm">Nuevo participante</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text" placeholder="Nombre completo *" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <input
              type="text" placeholder="Piso / Puerta (ej. 2ºA)" value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <div className="sm:col-span-2">
              <input
                type="text" placeholder="CUPS (22 caracteres) * — Ej: ES0021000000000001AA1P" value={newCups}
                onChange={(e) => { setNewCups(e.target.value); setCupsError(""); }}
                className={`w-full px-3 py-2 rounded-lg bg-secondary border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 ${cupsError ? "border-destructive" : "border-border"}`}
              />
              {cupsError && (
                <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {cupsError}
                </p>
              )}
            </div>
            <input
              type="email" placeholder="Email" value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            <input
              type="number" placeholder="Potencia contratada (kW)" value={newPotencia}
              onChange={(e) => setNewPotencia(e.target.value)}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={addSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {addSaving && <Loader2 className="w-3 h-3 animate-spin" />}
            Añadir participante
          </button>
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-12 gap-2 px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-3">Nombre</div>
        <div className="col-span-4">CUPS</div>
        <div className="col-span-1 text-right">β</div>
        <div className="col-span-2 text-center">Estado</div>
        <div className="col-span-2 text-right">Acciones</div>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {filtered.map((p, i) => (
          <ParticipantRow
            key={p.id}
            participant={p}
            index={i}
            communityId={communityId}
            onUpdate={handleUpdate}
            onToggleExit={toggleExit}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No hay participantes{search ? " que coincidan con la búsqueda" : ""}
          </div>
        )}
      </div>

      {/* Import dialog */}
      {communityId && (
        <ImportParticipantsDialog
          open={showImport}
          onOpenChange={setShowImport}
          communityId={communityId}
          existingCups={participants.map(p => p.cups)}
          onImported={(imported) => {
            const importedCups = new Set(imported.map(p => p.cups));
            const remaining = participants.filter(p => !importedCups.has(p.cups));
            onParticipantsChange([...remaining, ...imported]);
          }}
        />
      )}
    </div>
  );
}
