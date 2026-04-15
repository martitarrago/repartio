import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/80 bg-white/70 px-4 backdrop-blur-xl">
      <SidebarTrigger className="h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
      <div className="flex-1" />
    </header>
  );
}
