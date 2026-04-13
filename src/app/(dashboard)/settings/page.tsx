"use client";

import { User, Bell, FileText, Mail, Phone } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold font-heading text-foreground">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Profile */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Perfil
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block">Nombre completo</label>
              <input type="text" defaultValue="" className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block">Empresa</label>
              <input type="text" defaultValue="" className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
              <input type="email" defaultValue="" className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</label>
              <input type="tel" defaultValue="" className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              Guardar cambios
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notificaciones
          </h2>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: "Nuevas firmas de participantes", desc: "Recibe un aviso cuando un vecino firma el acuerdo" },
            { label: "Cambios de estado", desc: "Cuando una comunidad avanza de fase" },
            { label: "Errores de validación", desc: "Alertas sobre coeficientes o documentos incorrectos" },
            { label: "Resumen semanal", desc: "Email con el progreso de todas tus comunidades" },
          ].map((item, i) => (
            <label key={i} className="flex items-start gap-3 py-2 cursor-pointer group">
              <input type="checkbox" defaultChecked={i < 3} className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary" />
              <div>
                <p className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Plantillas de documentos
          </h2>
        </div>
        <div className="p-5">
          <div className="space-y-2">
            {[
              { name: "Acuerdo de reparto", type: "PDF" },
              { name: "Fichero TXT distribuidora", type: "TXT" },
              { name: "Certificado de instalación", type: "PDF" },
            ].map((doc, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{doc.name}</span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{doc.type}</span>
                </div>
                <button className="text-xs text-primary hover:underline">Editar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
