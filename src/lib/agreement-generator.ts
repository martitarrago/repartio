import { Community } from "./types/community";

export function generateAgreementHTML(community: Community): string {
  const activeParticipants = community.participants.filter(p => p.status !== "exited");
  const totalBeta = activeParticipants.reduce((s, p) => s + p.beta, 0);
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

  const participantRows = activeParticipants.map((p, i) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #e5e5e5;text-align:center">${i + 1}</td>
      <td style="padding:8px 12px;border:1px solid #e5e5e5">${p.name}</td>
      <td style="padding:8px 12px;border:1px solid #e5e5e5">${p.unit}</td>
      <td style="padding:8px 12px;border:1px solid #e5e5e5;font-family:monospace;font-size:11px">${p.cups}</td>
      <td style="padding:8px 12px;border:1px solid #e5e5e5;text-align:right">${(p.beta * 100).toFixed(4)}%</td>
    </tr>
  `).join("");

  const signatureBlocks = activeParticipants.map(p => `
    <div style="width:45%;margin-bottom:40px">
      <p style="margin:0 0 40px;font-size:12px"><strong>${p.name}</strong><br/>Unidad: ${p.unit}<br/>CUPS: ${p.cups}</p>
      <div style="border-top:1px solid #333;padding-top:4px;font-size:11px">Firma</div>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Acuerdo de Reparto — ${community.name}</title>
  <style>
    @media print { body { margin: 0; } @page { margin: 2cm; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
    h2 { font-size: 15px; margin-top: 28px; border-bottom: 2px solid #222; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th { background: #f5f5f5; padding: 8px 12px; border: 1px solid #e5e5e5; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta { display: flex; justify-content: space-between; font-size: 13px; color: #555; margin: 16px 0; }
    .signatures { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 40px; }
    .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e5e5e5; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>ACUERDO DE REPARTO DE ENERGÍA</h1>
  <p style="text-align:center;color:#555;font-size:14px;margin-top:0">Autoconsumo Colectivo — RD 244/2019</p>

  <div class="meta">
    <span><strong>Comunidad:</strong> ${community.name}</span>
    <span><strong>Fecha:</strong> ${today}</span>
  </div>

  <h2>1. Datos de la Instalación</h2>
  <table>
    <tr><th style="width:35%">Campo</th><th>Valor</th></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e5e5e5"><strong>Dirección</strong></td><td style="padding:8px 12px;border:1px solid #e5e5e5">${community.address}, ${community.postalCode} ${community.city}</td></tr>
    ${community.cif ? `<tr><td style="padding:8px 12px;border:1px solid #e5e5e5"><strong>CIF</strong></td><td style="padding:8px 12px;border:1px solid #e5e5e5">${community.cif}</td></tr>` : ""}
    <tr><td style="padding:8px 12px;border:1px solid #e5e5e5"><strong>CAU</strong></td><td style="padding:8px 12px;border:1px solid #e5e5e5;font-family:monospace">${community.cau}</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e5e5e5"><strong>Potencia instalada</strong></td><td style="padding:8px 12px;border:1px solid #e5e5e5">${community.potenciaInstalada} kWp (${community.numPaneles} paneles)</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e5e5e5"><strong>Distribuidora</strong></td><td style="padding:8px 12px;border:1px solid #e5e5e5">${community.distribuidora.toUpperCase()}</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e5e5e5"><strong>Modalidad</strong></td><td style="padding:8px 12px;border:1px solid #e5e5e5">${community.modality.replace(/_/g, " ")}</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e5e5e5"><strong>Tipo conexión</strong></td><td style="padding:8px 12px;border:1px solid #e5e5e5">${community.connectionType === "red_interior" ? "Red interior" : "Red de distribución"}</td></tr>
  </table>

  <h2>2. Participantes y Coeficientes de Reparto</h2>
  <p style="font-size:13px">Los abajo firmantes acuerdan los siguientes coeficientes β de reparto de la energía generada por la instalación fotovoltaica comunitaria, con tipo de reparto <strong>${community.coeficientMode === "fixed" ? "fijo" : "variable por hora"}</strong>:</p>
  <table>
    <tr><th>#</th><th>Nombre</th><th>Unidad</th><th>CUPS</th><th style="text-align:right">Coeficiente β</th></tr>
    ${participantRows}
    <tr style="font-weight:bold;background:#f9f9f9">
      <td colspan="4" style="padding:8px 12px;border:1px solid #e5e5e5;text-align:right">TOTAL</td>
      <td style="padding:8px 12px;border:1px solid #e5e5e5;text-align:right">${(totalBeta * 100).toFixed(4)}%</td>
    </tr>
  </table>

  ${community.gestorEnabled ? `
  <h2>3. Gestor de Autoconsumo</h2>
  <p style="font-size:13px">En virtud del RDL 7/2026, los participantes designan como Gestor de Autoconsumo a:</p>
  <table>
    <tr><th>Nombre</th><th>NIF</th></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e5e5e5">${community.gestorName || "—"}</td><td style="padding:8px 12px;border:1px solid #e5e5e5">${community.gestorNif || "—"}</td></tr>
  </table>
  <p style="font-size:12px;color:#555">El Gestor queda autorizado para realizar trámites administrativos, modificaciones de coeficientes y representación ante la distribuidora en nombre del colectivo.</p>
  ` : ""}

  <h2>${community.gestorEnabled ? "4" : "3"}. Firmas</h2>
  <p style="font-size:13px">Los abajo firmantes manifiestan su conformidad con el presente acuerdo de reparto:</p>
  <div class="signatures">
    ${signatureBlocks}
  </div>

  <div class="footer">
    <p>Documento generado por Repartio · ${today}</p>
    <p>Este acuerdo se rige por el Real Decreto 244/2019 de condiciones administrativas, técnicas y económicas del autoconsumo de energía eléctrica.</p>
  </div>
</body>
</html>`;
}

export function downloadAgreementHTML(community: Community) {
  const html = generateAgreementHTML(community);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Acuerdo_Reparto_${community.name.replace(/\s+/g, "_")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printAgreement(community: Community) {
  const html = generateAgreementHTML(community);
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
