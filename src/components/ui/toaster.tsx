"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group bg-white border border-border shadow-card rounded-lg text-sm text-foreground",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          success: "border-l-4 border-l-[#16a34a]",
          error: "border-l-4 border-l-destructive",
          warning: "border-l-4 border-l-[#D97706]",
          info: "border-l-4 border-l-[#2563EB]",
        },
      }}
    />
  );
}

export { toast } from "sonner";
