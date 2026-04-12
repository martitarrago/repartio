import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAF9F7]">
      <TopBar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
