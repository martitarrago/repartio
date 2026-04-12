import { auth } from "@/auth";

export default async function DashboardPage() {
  let debugInfo = "start";

  try {
    const session = await auth();
    debugInfo = `auth ok: ${session?.user?.email ?? "no session"}`;
  } catch (e: any) {
    debugInfo = `auth error: ${e?.message ?? String(e)}`;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard Debug</h1>
      <pre className="mt-4 p-4 bg-white rounded border text-sm">
        {debugInfo}
      </pre>
    </div>
  );
}
