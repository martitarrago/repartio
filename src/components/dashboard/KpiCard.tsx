"use client";

import { useEffect, useState } from "react";
import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  trend?: string;
  delay?: number;
}

export function KpiCard({ title, value, suffix = "", prefix = "", icon: Icon, trend, delay = 0 }: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 600;
      const steps = 25;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover-lift">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground flex-1">{title}</span>
        {trend && (
          <span className="text-[11px] font-medium text-primary">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">
        {prefix}{displayValue.toLocaleString("es-ES")}{suffix}
      </p>
    </div>
  );
}
