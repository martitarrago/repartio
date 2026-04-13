"use client";

import { Search, ArrowUpDown, Building2, Plus } from "lucide-react";
import { CommunityCard, type ProjectStatus } from "@/components/dashboard/CommunityCard";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { validateProject, validateAllocationSum, type Community } from "@/lib/types/community";

type Filter = "todos" | "problemas" | "borrador" | "validado" | "activas";
type SortBy = "issues" | "status" | "progress";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "problemas", label: "Problemas" },
  { id: "borrador", label: "Borrador" },
  { id: "validado", label: "Validado" },
  { id: "activas", label: "Activas" },
];

const STATUS_ORDER: ProjectStatus[] = ["borrador", "validado", "activo"];

function deriveStatus(c: Community): ProjectStatus {
  if (c.phase === "activo" || c.phase === "enviado") return "activo";
  const issues = validateProject(c);
  const errors = issues.filter(i => i.type === "error");
  const active = c.participants.filter(p => p.status !== "exited");
  const allSigned = active.length > 0 && active.every(p => p.signatureState === "signed");
  const alloc = validateAllocationSum(c.participants);
  const hasTxt = c.documents.txt;
  if (errors.length === 0 && allSigned && alloc.valid && hasTxt) return "validado";
  return "borrador";
}

export default function CommunitiesPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [sortBy, setSortBy] = useState<SortBy>("status");

  useEffect(() => {
    fetch("/api/communities")
      .then(r => r.json())
      .then(data => { setCommunities(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const communitiesData = useMemo(() =>
    communities.map(c => {
      const issues = validateProject(c);
      const active = c.participants.filter(p => p.status !== "exited");
      const projectStatus = deriveStatus(c);
      return {
        id: c.id,
        name: c.name,
        address: `${c.address}, ${c.city}`,
        participants: active.length,
        power: c.potenciaInstalada,
        distributed: Math.round(active.reduce((s, p) => s + p.beta, 0) * 100),
        projectStatus,
        gestorEnabled: c.gestorEnabled,
        distribuidora: c.distribuidora,
        cau: c.cau,
        issues: issues.filter(i => i.type === "error").length,
        warnings: issues.filter(i => i.type === "warning").length,
      };
    }),
    [communities]
  );

  const filtered = useMemo(() => {
    let result = communitiesData.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      c.cau.toLowerCase().includes(search.toLowerCase())
    );

    switch (filter) {
      case "problemas": result = result.filter(c => c.issues > 0); break;
      case "borrador": result = result.filter(c => c.projectStatus === "borrador"); break;
      case "validado": result = result.filter(c => c.projectStatus === "validado"); break;
      case "activas": result = result.filter(c => c.projectStatus === "activo"); break;
    }

    switch (sortBy) {
      case "issues": result.sort((a, b) => b.issues - a.issues); break;
      case "status": result.sort((a, b) => STATUS_ORDER.indexOf(a.projectStatus) - STATUS_ORDER.indexOf(b.projectStatus)); break;
      case "progress": result.sort((a, b) => b.distributed - a.distributed); break;
    }

    return result;
  }, [communitiesData, search, filter, sortBy]);

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-foreground">Comunidades</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Cargando..." : `${communitiesData.length} instalaciones de autoconsumo`}
          </p>
        </div>
        <button
          onClick={() => router.push("/communities/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva comunidad
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, dirección o CAU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-card border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none"
            >
              <option value="status">Por estado</option>
              <option value="issues">Por incidencias</option>
              <option value="progress">Por progreso</option>
            </select>
          </div>
        </div>

        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((community, i) => (
            <div key={community.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <CommunityCard {...community} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold text-foreground text-sm mb-1">
            {search || filter !== "todos" ? "Sin resultados" : "Crea tu primera comunidad"}
          </h3>
          <p className="text-muted-foreground text-xs max-w-sm">
            {search || filter !== "todos"
              ? "No hay comunidades que coincidan con los filtros."
              : "Registra tu primera instalación de autoconsumo colectivo."}
          </p>
          {!search && filter === "todos" && (
            <button
              onClick={() => router.push("/communities/new")}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nueva comunidad
            </button>
          )}
        </div>
      )}
    </div>
  );
}
