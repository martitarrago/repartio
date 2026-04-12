"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Trash2, Download } from "lucide-react";

interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  subidoEn: string;
  url: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentosTab({ instalacionId }: { instalacionId: string }) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    // Placeholder: en el futuro se subirán a Vercel Blob / almacenamiento cloud
    Array.from(files).forEach((file) => {
      const doc: Documento = {
        id: Math.random().toString(36).slice(2),
        nombre: file.name,
        tipo: file.type || "application/octet-stream",
        tamano: file.size,
        subidoEn: new Date().toISOString(),
        url: URL.createObjectURL(file),
      };
      setDocumentos((prev) => [...prev, doc]);
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function eliminar(id: string) {
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[#18181B]">Documentación de la comunidad</h3>
        <p className="mt-0.5 text-2xs text-[#A1A1AA]">
          Sube contratos, autorizaciones, planos, actas u otros documentos relacionados con esta instalación.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center transition-colors ${
          dragging
            ? "border-[#18181B] bg-[#F4F4F5]"
            : "border-[#E4E4E7] hover:border-[#A1A1AA] hover:bg-white/50"
        }`}
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F4F5]">
          <Upload className="h-5 w-5 text-[#71717A]" />
        </div>
        <p className="text-sm font-medium text-[#18181B]">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="mt-1 text-2xs text-[#A1A1AA]">
          PDF, Word, Excel, imágenes — máx. 10 MB por archivo
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {documentos.length > 0 && (
        <div
          className="rounded-lg bg-white overflow-hidden"
          style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F4F4F5]">
                <th className="px-4 py-2.5 text-left text-2xs font-medium uppercase tracking-widest text-[#A1A1AA]">Nombre</th>
                <th className="px-4 py-2.5 text-left text-2xs font-medium uppercase tracking-widest text-[#A1A1AA]">Tamaño</th>
                <th className="px-4 py-2.5 text-left text-2xs font-medium uppercase tracking-widest text-[#A1A1AA]">Subido</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {documentos.map((doc) => (
                <tr key={doc.id} className="border-b border-[#F4F4F5] last:border-0 hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-[#A1A1AA]" />
                      <span className="truncate max-w-xs text-[#18181B]">{doc.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#71717A]">{formatBytes(doc.tamano)}</td>
                  <td className="px-4 py-3 text-[#71717A]">
                    {new Date(doc.subidoEn).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={doc.url}
                        download={doc.nombre}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => eliminar(doc.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {documentos.length === 0 && (
        <p className="text-center text-2xs text-[#A1A1AA]">
          No hay documentos subidos todavía.
        </p>
      )}
    </div>
  );
}
