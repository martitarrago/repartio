"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type TableMeta,
  type RowData,
} from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { EntradaConstante, ErrorValidacion } from "@/types/editor";
import { calcularSuma, parsearValor, TOLERANCIA_SUMA } from "@/lib/validators/coeficientes";
import { cn } from "@/lib/utils/cn";

// ─── TableMeta augmentation ───────────────────────────────────────────────────

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    actualizarCelda: (
      rowIndex: number,
      columnId: string,
      value: string
    ) => void;
    eliminarFila: (rowIndex: number) => void;
    erroresPorParticipante: Map<string, string>;
  }
}

// ─── Celda editable ───────────────────────────────────────────────────────────

interface CeldaEditableProps {
  valor: string;
  onCambio: (valor: string) => void;
  tieneError: boolean;
  placeholder?: string;
  tipo?: "texto" | "numero";
  soloLectura?: boolean;
}

function CeldaEditable({
  valor,
  onCambio,
  tieneError,
  placeholder = "0,000000",
  tipo = "numero",
  soloLectura = false,
}: CeldaEditableProps) {
  const [valorLocal, setValorLocal] = useState(valor);

  const handleBlur = () => {
    if (valorLocal !== valor) {
      onCambio(valorLocal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      if (valorLocal !== valor) {
        onCambio(valorLocal);
      }
    }
  };

  return (
    <input
      type="text"
      value={valorLocal}
      onChange={(e) => setValorLocal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      readOnly={soloLectura}
      placeholder={placeholder}
      inputMode={tipo === "numero" ? "decimal" : "text"}
      className={cn(
        "w-full rounded-sm border bg-transparent px-2 py-1 text-sm font-mono transition-colors",
        "focus:outline-none focus:ring-1 focus:ring-primary",
        tieneError
          ? "border-destructive bg-destructive/5 text-destructive"
          : "border-transparent hover:border-input focus:border-input",
        soloLectura && "cursor-default"
      )}
    />
  );
}

// ─── Columnas ─────────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<EntradaConstante>();

function buildColumns(soloLectura: boolean) {
  return [
    columnHelper.display({
      id: "orden",
      header: "#",
      size: 40,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {row.index + 1}
        </span>
      ),
    }),
    columnHelper.accessor("cups", {
      header: "CUPS",
      size: 200,
      cell: ({ getValue, row, table }) => {
        const tieneError =
          table.options.meta?.erroresPorParticipante.has(
            row.original.participanteId
          ) ?? false;
        return (
          <CeldaEditable
            valor={getValue()}
            onCambio={(v) => table.options.meta?.actualizarCelda(row.index, "cups", v)}
            tieneError={false}
            tipo="texto"
            placeholder="ES0000000000000000AA"
            soloLectura={soloLectura}
          />
        );
      },
    }),
    columnHelper.accessor("nombre", {
      header: "Nombre / descripción",
      cell: ({ getValue, row, table }) => (
        <CeldaEditable
          valor={getValue()}
          onCambio={(v) => table.options.meta?.actualizarCelda(row.index, "nombre", v)}
          tieneError={false}
          tipo="texto"
          placeholder="Piso 1A"
          soloLectura={soloLectura}
        />
      ),
    }),
    columnHelper.accessor("valor", {
      header: "Coeficiente β",
      size: 140,
      cell: ({ getValue, row, table }) => {
        const tieneError =
          table.options.meta?.erroresPorParticipante.has(
            row.original.participanteId
          ) ?? false;
        return (
          <CeldaEditable
            valor={getValue()}
            onCambio={(v) =>
              table.options.meta?.actualizarCelda(row.index, "valor", v)
            }
            tieneError={tieneError}
            tipo="numero"
            placeholder="0,000000"
            soloLectura={soloLectura}
          />
        );
      },
    }),
    ...(soloLectura
      ? []
      : [
          columnHelper.display({
            id: "acciones",
            header: "",
            size: 48,
            cell: ({ row, table }) => (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => table.options.meta?.eliminarFila(row.index)}
                title="Eliminar fila"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ),
          }),
        ]),
  ];
}

// ─── Botón de distribución igualitaria ───────────────────────────────────────

function distribuirIgualitariamente(
  entradas: EntradaConstante[]
): EntradaConstante[] {
  const n = entradas.length;
  if (n === 0) return entradas;

  const valorBase = Math.floor((1 / n) * 1e6) / 1e6;
  const residuo = parseFloat(
    (1 - valorBase * (n - 1)).toFixed(6)
  );

  return entradas.map((entrada, i) => ({
    ...entrada,
    valor: (i === n - 1 ? residuo : valorBase).toFixed(6).replace(".", ","),
  }));
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface TablaConstanteProps {
  entradas: EntradaConstante[];
  onCambio: (entradas: EntradaConstante[]) => void;
  errores?: ErrorValidacion[];
  soloLectura?: boolean;
}

export function TablaConstante({
  entradas,
  onCambio,
  errores = [],
  soloLectura = false,
}: TablaConstanteProps) {
  // Mapa de participanteId → mensaje de error
  const erroresPorParticipante = useMemo(() => {
    const map = new Map<string, string>();
    for (const err of errores) {
      if (err.participanteId) {
        map.set(err.participanteId, err.mensaje);
      }
    }
    return map;
  }, [errores]);

  const actualizarCelda = useCallback(
    (rowIndex: number, columnId: string, value: string) => {
      const nuevasEntradas = [...entradas];
      nuevasEntradas[rowIndex] = {
        ...nuevasEntradas[rowIndex],
        [columnId]: value,
      };
      onCambio(nuevasEntradas);
    },
    [entradas, onCambio]
  );

  const eliminarFila = useCallback(
    (rowIndex: number) => {
      onCambio(entradas.filter((_, i) => i !== rowIndex));
    },
    [entradas, onCambio]
  );

  const columns = useMemo(
    () => buildColumns(soloLectura),
    [soloLectura]
  );

  const meta: TableMeta<EntradaConstante> = {
    actualizarCelda,
    eliminarFila,
    erroresPorParticipante,
  };

  const table = useReactTable({
    data: entradas,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });

  const suma = calcularSuma(entradas.map((e) => e.valor));
  const sumaValida = Math.abs(suma - 1) <= TOLERANCIA_SUMA;
  const porcentaje = Math.min(100, Math.round(suma * 100));

  return (
    <div className="space-y-3">
      {/* Acciones */}
      {!soloLectura && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCambio(distribuirIgualitariamente(entradas))}
            disabled={entradas.length === 0}
            title="Distribuir el 100% en partes iguales entre todos los participantes"
          >
            Distribuir a partes iguales
          </Button>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No hay participantes. Añádelos en la pestaña Participantes.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const tieneError = erroresPorParticipante.has(
                  row.original.participanteId
                );
                return (
                  <TableRow
                    key={row.id}
                    className={cn(tieneError && "bg-destructive/5")}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-1.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>

          {/* Footer con suma */}
          {entradas.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={columns.length - (soloLectura ? 1 : 2)}
                  className="text-right text-xs font-medium text-muted-foreground"
                >
                  Suma total:
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={porcentaje}
                      className={cn(
                        "h-1.5 flex-1",
                        sumaValida
                          ? "[&>div]:bg-yellow-500"
                          : "[&>div]:bg-destructive"
                      )}
                    />
                    <Badge
                      variant={sumaValida ? "default" : "destructive"}
                      className="shrink-0 font-mono text-xs"
                    >
                      {suma > 0 ? suma.toFixed(6).replace(".", ",") : "—"}
                    </Badge>
                  </div>
                </TableCell>
                {!soloLectura && <TableCell />}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
