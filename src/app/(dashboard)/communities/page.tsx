"use client";

import { Search, ArrowUpDown, Building2, Plus } from "lucide-react";
import { CommunityCard, type ProjectStatus } from "@/components/dashboard/CommunityCard";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { validateProject, validateAllocationSum, type Community } from "@/lib/types/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion";

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
    <FadeIn className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Comunidades
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Cargando…" : `${communitiesData.length} instalaciones de autoconsumo`}
          </p>
        </div>
        <Button onClick={() => router.push("/communities/new")}>
          <Plus className="h-3.5 w-3.5" /> Nueva comunidad
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, dirección o CAU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="h-9 rounded-md border border-border bg-white px-2.5 text-xs text-foreground shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/10"
            >
              <option value="status">Por estado</option>
              <option value="issues">Por incidencias</option>
              <option value="progress">Por progreso</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                filter === f.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((community) => (
            <StaggerItem key={community.id}>
              <CommunityCard {...community} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white/40 py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="mb-1 font-heading text-base font-semibold text-foreground">
            {search || filter !== "todos" ? "Sin resultados" : "Crea tu primera comunidad"}
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {search || filter !== "todos"
              ? "No hay comunidades que coincidan con los filtros."
              : "Registra tu primera instalación de autoconsumo colectivo."}
          </p>
          {!search && filter === "todos" && (
            <Button onClick={() => router.push("/communities/new")} className="mt-5">
              <Plus className="h-3.5 w-3.5" /> Nueva comunidad
            </Button>
          )}
        </div>
      )}
    </FadeIn>
  );
}
