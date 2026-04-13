"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { month: "Ene", ahorro: 520, produccion: 980 },
  { month: "Feb", ahorro: 610, produccion: 1100 },
  { month: "Mar", ahorro: 750, produccion: 1350 },
  { month: "Abr", ahorro: 890, produccion: 1580 },
  { month: "May", ahorro: 1020, produccion: 1820 },
  { month: "Jun", ahorro: 1180, produccion: 2100 },
  { month: "Jul", ahorro: 1250, produccion: 2250 },
  { month: "Ago", ahorro: 1200, produccion: 2180 },
  { month: "Sep", ahorro: 950, produccion: 1700 },
  { month: "Oct", ahorro: 720, produccion: 1280 },
  { month: "Nov", ahorro: 580, produccion: 1050 },
  { month: "Dic", ahorro: 490, produccion: 900 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p style={{ color: "hsl(160, 84%, 45%)" }}>Producción: {payload[0]?.value} kWh</p>
        <p style={{ color: "hsl(43, 96%, 61%)" }}>Ahorro: &euro;{payload[1]?.value}</p>
      </div>
    );
  }
  return null;
}

export function MonthlySavingsChart() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-heading font-semibold mb-1 text-foreground">Producción vs Ahorro mensual</h3>
      <p className="text-xs text-muted-foreground mb-4">Comparativa de los últimos 12 meses</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 9%, 91%)" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220, 5%, 46%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220, 5%, 46%)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="produccion" fill="hsl(160, 84%, 45%)" radius={[4, 4, 0, 0]} animationDuration={1000} />
            <Bar dataKey="ahorro" fill="hsl(43, 96%, 61%)" radius={[4, 4, 0, 0]} animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(160, 84%, 45%)" }} />
          Producción (kWh)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(43, 96%, 61%)" }} />
          Ahorro (&euro;)
        </div>
      </div>
    </div>
  );
}
