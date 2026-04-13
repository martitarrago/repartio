import { Community, Distribuidora, TxtGenerationResult, DISTRIBUIDORAS } from "./types/community";

/**
 * Mock TXT generator for the /communities section (SolShare UI).
 * This is NOT the production-compliant generator — that lives in
 * src/lib/generators/txtGenerator.ts and is used by /installations.
 */
export function generateDistributorTXT(community: Community): TxtGenerationResult {
  const errors: string[] = [];
  const activeParticipants = community.participants.filter(p => p.status !== "exited");

  const totalBeta = activeParticipants.reduce((sum, p) => sum + p.beta, 0);
  if (Math.abs(totalBeta - 1) > 0.001) {
    errors.push(`La suma de coeficientes β es ${(totalBeta * 100).toFixed(2)}% — debe ser 100%`);
  }

  activeParticipants.forEach(p => {
    if (p.cups.length !== 22) errors.push(`CUPS de ${p.name} no tiene 22 caracteres`);
    if (p.beta <= 0) errors.push(`${p.name} tiene coeficiente β = 0`);
  });

  if (!community.cau) errors.push("CAU de la instalación no definido");

  const lines: string[] = [];
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  const distLabel = DISTRIBUIDORAS.find(d => d.id === community.distribuidora)?.label ?? community.distribuidora;

  lines.push(`; Fichero de reparto de autoconsumo colectivo`);
  lines.push(`; Generado por Repartio — ${now.toLocaleString("es-ES")}`);
  lines.push(`; Distribuidora: ${distLabel}`);
  lines.push(`; CAU: ${community.cau}`);
  lines.push(`; Modalidad: Autoconsumo colectivo con excedentes`);
  lines.push(`; Tipo coeficientes: ${community.coeficientMode === "fixed" ? "Fijos" : "Variables por hora"}`);
  lines.push(``);
  lines.push(`CAU;${community.cau}`);
  lines.push(`FECHA_INICIO;${dateStr}`);
  lines.push(`TIPO_REPARTO;${community.coeficientMode === "fixed" ? "FIJO" : "VARIABLE"}`);
  lines.push(`POTENCIA_INSTALACION;${community.potenciaInstalada}`);
  lines.push(``);

  if (community.coeficientMode === "fixed") {
    lines.push(`CUPS;COEFICIENTE_BETA`);
    activeParticipants.forEach(p => {
      lines.push(`${p.cups};${p.beta.toFixed(6)}`);
    });
  } else {
    lines.push(`; Formato variable: CUPS;H0001;H0002;...;H8760`);
    const hourHeaders = Array.from({ length: 24 }, (_, i) => `H${String(i + 1).padStart(4, "0")}`);
    lines.push(`CUPS;${hourHeaders.join(";")}`);
    activeParticipants.forEach(p => {
      const hourlyBetas = Array.from({ length: 24 }, () => p.beta.toFixed(6));
      lines.push(`${p.cups};${hourlyBetas.join(";")}`);
    });
  }

  lines.push(``);
  lines.push(`; Fin del fichero`);
  lines.push(`; Total participantes: ${activeParticipants.length}`);
  lines.push(`; Suma coeficientes: ${(totalBeta * 100).toFixed(4)}%`);

  return {
    content: lines.join("\n"),
    distribuidora: community.distribuidora,
    cau: community.cau,
    generatedAt: now.toISOString(),
    isValid: errors.length === 0,
    errors,
  };
}

export function downloadTXT(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
