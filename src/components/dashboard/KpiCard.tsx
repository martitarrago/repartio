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
    <div className="group relative rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/15">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <p className="font-heading text-[28px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
          {prefix}{displayValue.toLocaleString("es-ES")}{suffix}
        </p>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 tabular-nums">{trend}</span>
        )}
      </div>
    </div>
  );
}
