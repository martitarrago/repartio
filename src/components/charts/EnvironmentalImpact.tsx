"use client";

import { Leaf, TreePine, Droplets, Wind } from "lucide-react";

const metrics = [
  { icon: Leaf, value: "2.840 kg", label: "CO₂ evitado", description: "Equivalente a retirar 2 coches de la carretera", color: "text-primary" },
  { icon: TreePine, value: "142", label: "Árboles equivalentes", description: "La cantidad de árboles necesarios para absorber ese CO₂", color: "text-primary" },
  { icon: Droplets, value: "18.500 L", label: "Agua ahorrada", description: "Agua no usada en la generación de energía convencional", color: "text-accent" },
  { icon: Wind, value: "4.200 kWh", label: "Energía limpia", description: "Energía renovable producida y consumida localmente", color: "text-accent" },
];

export function EnvironmentalImpact() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-heading font-semibold mb-1 text-foreground">Impacto medioambiental</h3>
      <p className="text-xs text-muted-foreground mb-5">Tu contribución al planeta este año</p>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className={`w-10 h-10 rounded-xl bg-card flex items-center justify-center flex-shrink-0 ${m.color}`}>
              <m.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg text-foreground">{m.value}</p>
              <p className="text-xs font-medium text-foreground/80">{m.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{m.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
