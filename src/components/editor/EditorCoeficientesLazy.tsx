"use client";

import dynamic from "next/dynamic";

// dynamic con ssr: false solo puede usarse en Client Components
export const EditorCoeficientesLazy = dynamic(
  () =>
    import("@/components/editor/EditorCoeficientesContainer").then(
      (m) => m.EditorCoeficientesContainer
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Cargando editor...
      </div>
    ),
    ssr: false,
  }
);
