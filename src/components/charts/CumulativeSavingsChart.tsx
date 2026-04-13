"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { month: "Ene", acumulado: 520 },
  { month: "Feb", acumulado: 1130 },
  { month: "Mar", acumulado: 1880 },
  { month: "Abr", acumulado: 2770 },
  { month: "May", acumulado: 3790 },
  { month: "Jun", acumulado: 4970 },
  { month: "Jul", acumulado: 6220 },
  { month: "Ago", acumulado: 7420 },
  { month: "Sep", acumulado: 8370 },
  { month: "Oct", acumulado: 9090 },
  { month: "Nov", acumulado: 9670 },
  { month: "Dic", acumulado: 10160 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-lg px-3 py-2 text-xs">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-primary">&euro;{payload[0].value.toLocaleString("es-ES")}</p>
      </div>
    );
  }
  return null;
}

export function CumulativeSavingsChart() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-heading font-semibold mb-1 text-foreground">Ahorro acumulado</h3>
      <p className="text-xs text-muted-foreground mb-4">Evolución del ahorro total en euros</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 9%, 91%)" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220, 5%, 46%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220, 5%, 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="acumulado"
              stroke="hsl(160, 84%, 45%)"
              strokeWidth={2.5}
              fill="url(#savingsGrad)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
