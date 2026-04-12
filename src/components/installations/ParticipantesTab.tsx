"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Users,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Participante } from "@/types/editor";

// ─── Esquema ──────────────────────────────────────────────────────────────────

const esquemaParticipante = z.object({
  cups: z
    .string()
    .length(22, "El CUPS debe tener exactamente 22 caracteres")
    .regex(/^ES/i, "El CUPS debe comenzar por 'ES'"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  descripcion: z.string().max(200).optional(),
});

type FormParticipante = z.infer<typeof esquemaParticipante>;

// ─── Validación por fila ─────────────────────────────────────────────────────

function validarParticipante(p: Participante): { valido: boolean; mensaje: string } {
  if (!p.cups || p.cups.length !== 22) {
    return { valido: false, mensaje: "CUPS debe tener 22 caracteres" };
  }
  if (!/^ES/i.test(p.cups)) {
    return { valido: false, mensaje: "CUPS debe empezar por ES" };
  }
  if (!p.nombre || p.nombre.length < 2) {
    return { valido: false, mensaje: "Nombre demasiado corto" };
  }
  return { valido: true, mensaje: "Válido" };
}

// ─── Componente ──────────────────────────────────────────────────────────────

interface ParticipantesTabProps {
  instalacionId: string;
  participantesIniciales: Participante[];
  soloLectura?: boolean;
}

export function ParticipantesTab({
  instalacionId,
  participantesIniciales,
  soloLectura = false,
}: ParticipantesTabProps) {
  const [participantes, setParticipantes] =
    useState<Participante[]>(participantesIniciales);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState<Participante | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormParticipante>({
    resolver: zodResolver(esquemaParticipante),
  });

  function abrirDialogoNuevo() {
    setEditando(null);
    reset({ cups: "", nombre: "", descripcion: "" });
    setDialogoAbierto(true);
  }

  function abrirDialogoEditar(participante: Participante) {
    setEditando(participante);
    reset({
      cups: participante.cups,
      nombre: participante.nombre,
      descripcion: participante.descripcion ?? "",
    });
    setDialogoAbierto(true);
  }

  async function onSubmit(data: FormParticipante) {
    setGuardando(true);
    setError(null);
    try {
      if (editando) {
        const res = await fetch(
          `/api/installations/${instalacionId}/participants/${editando.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        if (!res.ok) throw new Error((await res.json()).message);
        const updated = await res.json();
        setParticipantes((prev) =>
          prev.map((p) => (p.id === editando.id ? { ...p, ...updated } : p))
        );
      } else {
        const res = await fetch(
          `/api/installations/${instalacionId}/participants`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, orden: participantes.length }),
          }
        );
        if (!res.ok) throw new Error((await res.json()).message);
        const nuevo = await res.json();
        setParticipantes((prev) => [...prev, nuevo]);
      }
      setDialogoAbierto(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (!eliminandoId) return;
    try {
      await fetch(
        `/api/installations/${instalacionId}/participants/${eliminandoId}`,
        { method: "DELETE" }
      );
      setParticipantes((prev) => prev.filter((p) => p.id !== eliminandoId));
    } catch {
      setError("Error al eliminar el participante");
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Participantes</h3>
          <p className="text-sm text-muted-foreground">
            {participantes.length} consumidor{participantes.length !== 1 ? "es" : ""} en
            esta instalación
          </p>
        </div>
        {!soloLectura && (
          <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={abrirDialogoNuevo}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir participante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editando ? "Editar participante" : "Nuevo participante"}
                </DialogTitle>
                <DialogDescription>
                  {editando
                    ? "Modifica los datos del participante"
                    : "Añade un consumidor a la instalación de autoconsumo"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="cups">
                    CUPS <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cups"
                    placeholder="ES0000000000000000AA"
                    className="font-mono uppercase"
                    maxLength={22}
                    {...register("cups")}
                    aria-invalid={!!errors.cups}
                  />
                  {errors.cups && (
                    <p className="text-xs text-destructive">{errors.cups.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    22 caracteres. Lo encontrarás en la factura eléctrica.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre / identificación <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Piso 1A — García López"
                    {...register("nombre")}
                    aria-invalid={!!errors.nombre}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-destructive">{errors.nombre.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Notas (opcional)</Label>
                  <Input
                    id="descripcion"
                    placeholder="Información adicional..."
                    {...register("descripcion")}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogoAbierto(false)}
                    disabled={guardando}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={guardando}>
                    <Save className="mr-2 h-4 w-4" />
                    {guardando ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabla */}
      {participantes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">Sin participantes</p>
          <p className="text-xs text-muted-foreground mt-1">
            Añade los consumidores que forman parte de esta comunidad
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>CUPS</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="w-24">Estado</TableHead>
                {!soloLectura && (
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {participantes.map((p, i) => {
                const validacion = validarParticipante(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {p.cups}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.descripcion ?? "—"}
                    </TableCell>
                    <TableCell>
                      {validacion.valido ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Válido</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-destructive" title={validacion.mensaje}>
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Revisar</span>
                        </div>
                      )}
                    </TableCell>
                    {!soloLectura && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => abrirDialogoEditar(p)}
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setEliminandoId(p.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Alerta de coeficientes */}
      {participantes.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Al modificar participantes, los coeficientes existentes pueden quedar
            desactualizados. Revisa el reparto en la pestaña{" "}
            <strong>Coeficientes</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Diálogo de confirmación de eliminar */}
      <AlertDialog
        open={!!eliminandoId}
        onOpenChange={(open) => !open && setEliminandoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar participante?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también todos los coeficientes asignados a este
              participante. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
