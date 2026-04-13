"use client";

import { useState } from "react";
import { Plus, Mail, X, Upload, Search, AlertCircle, Check } from "lucide-react";
import { type Participant, validateCUPS } from "@/lib/types/community";

interface ParticipantsListProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
}

const STATUS_CONFIG = {
  active: { label: "Activo", className: "bg-primary/15 text-primary" },
  pending: { label: "Pendiente", className: "bg-accent/15 text-accent" },
  exited: { label: "Baja", className: "bg-destructive/15 text-destructive" },
};

const AVATAR_COLORS = [
  "hsl(160, 84%, 45%)", "hsl(43, 96%, 61%)", "hsl(200, 80%, 70%)",
  "hsl(280, 60%, 65%)", "hsl(340, 70%, 60%)", "hsl(20, 90%, 60%)",
  "hsl(100, 50%, 50%)", "hsl(220, 70%, 60%)",
];

export function ParticipantsListPro({ participants, onParticipantsChange }: ParticipantsListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCups, setNewCups] = useState("");
  const [newPotencia, setNewPotencia] = useState("");
  const [cupsError, setCupsError] = useState("");

  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cups.includes(search) ||
    p.unit.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = participants.filter(p => p.status === "active").length;

  const handleAdd = () => {
    const cupsValidation = validateCUPS(newCups);
    if (!cupsValidation.valid) {
      setCupsError(cupsValidation.error || "CUPS inválido");
      return;
    }
    if (!newName.trim()) return;

    const newParticipant: Participant = {
      id: `p${Date.now()}`,
      name: newName,
      cups: newCups.toUpperCase().replace(/\s/g, ""),
      email: newEmail,
      unit: newUnit,
      beta: 0,
      potenciaContratada: parseFloat(newPotencia) || undefined,
      status: "pending",
      signatureState: "pending",
      entryDate: new Date().toISOString().slice(0, 10),
    };

    onParticipantsChange([...participants, newParticipant]);
    setShowAddForm(false);
    setNewName(""); setNewUnit(""); setNewEmail(""); setNewCups(""); setNewPotencia("");
    setCupsError("");
  };

  const toggleExit = (id: string) => {
    onParticipantsChange(
      participants.map(p =>
        p.id === id
          ? { ...p, status: (p.status === "exited" ? "active" : "exited") as Participant["status"], exitDate: p.status !== "exited" ? new Date().toISOString().slice(0, 10) : undefined }
          : p
      )
    );
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
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Importar Excel
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl mint-gradient text-white font-medium text-xs hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
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
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            Añadir participante
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-12 gap-2 px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-3">Nombre</div>
          <div className="col-span-4">CUPS</div>
          <div className="col-span-1 text-right">β</div>
          <div className="col-span-2 text-center">Estado</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {filtered.map((p, i) => {
          const initials = p.name.split(" ").map(n => n[0]).join("").slice(0, 2);
          const status = STATUS_CONFIG[p.status];

          return (
            <div
              key={p.id}
              className={`glass-card rounded-xl px-4 py-2.5 grid grid-cols-12 gap-2 items-center hover-lift animate-fade-in group ${
                p.status === "exited" ? "opacity-50" : ""
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.unit} · {p.email}</p>
                </div>
              </div>
              <div className="col-span-4">
                <span className="text-[10px] font-mono text-muted-foreground tracking-tight">{p.cups}</span>
              </div>
              <div className="col-span-1 text-right">
                <span className="text-xs font-mono font-semibold text-foreground">{(p.beta * 100).toFixed(1)}%</span>
              </div>
              <div className="col-span-2 flex justify-center">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded-lg hover:bg-secondary" title="Enviar email">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => toggleExit(p.id)}
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
        })}
      </div>
    </div>
  );
}
