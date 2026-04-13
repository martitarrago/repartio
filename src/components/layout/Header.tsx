import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function Header() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="h-4" />
    </header>
  );
}
