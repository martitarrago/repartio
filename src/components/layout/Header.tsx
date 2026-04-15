import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <SidebarTrigger className="-ml-1 h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex-1" />
    </header>
  );
}
