import { cookies } from "next/headers";
import AppSidebar from "@/components/layout/AppSidebar";
import Header from "@/components/layout/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReportButton } from "@/components/ReportButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
      <ReportButton />
    </SidebarProvider>
  );
}
