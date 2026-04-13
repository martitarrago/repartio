"use client";

export function SolarOrb() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-32 h-32 rounded-full bg-accent/20 blur-2xl animate-pulse-solar" />
      <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 blur-xl animate-pulse-solar" style={{ animationDelay: "0.5s" }} />
      <div className="relative w-20 h-20 rounded-full mint-gradient shadow-lg shadow-accent/30 animate-pulse-solar flex items-center justify-center" style={{ animationDelay: "1s" }}>
        <div className="w-10 h-10 rounded-full bg-white/30 blur-sm" />
      </div>
      <div className="absolute w-2 h-2 rounded-full bg-accent/60 animate-float" style={{ top: "10%", right: "20%" }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-primary/40 animate-float" style={{ bottom: "15%", left: "15%", animationDelay: "1.5s" }} />
      <div className="absolute w-1 h-1 rounded-full bg-accent/50 animate-float" style={{ top: "30%", left: "10%", animationDelay: "2.5s" }} />
    </div>
  );
}
