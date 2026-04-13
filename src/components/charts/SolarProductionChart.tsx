"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { hour: "6h", production: 5 },
  { hour: "7h", production: 18 },
  { hour: "8h", production: 38 },
  { hour: "9h", production: 62 },
  { hour: "10h", production: 80 },
  { hour: "11h", production: 92 },
  { hour: "12h", production: 98 },
  { hour: "13h", production: 95 },
  { hour: "14h", production: 88 },
  { hour: "15h", production: 72 },
  { hour: "16h", production: 50 },
  { hour: "17h", production: 28 },
  { hour: "18h", production: 10 },
  { hour: "19h", production: 2 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-foreground text-background rounded-md px-2.5 py-1.5 text-xs shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-background/70">{payload[0].value} kWh</p>
      </div>
    );
  }
  return null;
}

export function SolarProductionChart() {
  return (
    <div className="border border-border rounded-lg p-5">
      <h3 className="font-medium text-sm text-foreground">Producción solar hoy</h3>
      <p className="text-xs text-muted-foreground mb-4">Energía generada por hora (kWh)</p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 9%, 91%)" />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(220, 5%, 46%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220, 5%, 46%)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="production"
              stroke="hsl(160, 84%, 39%)"
              strokeWidth={1.5}
              fill="url(#solarGrad)"
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
