import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  const organizacionId = (session?.user as any)?.organizacionId as string;

  let debugInfo = `orgId: ${organizacionId}\n`;

  try {
    const raw = await prisma.instalacion.findMany({
      where: { organizacionId },
      include: {
        _count: { select: { participantes: { where: { activo: true } } } },
        conjuntos: {
          where: { estado: { in: ["VALIDADO", "PUBLICADO"] } },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { actualizadaEn: "desc" },
    });
    debugInfo += `query ok: ${raw.length} instalaciones\n`;
    debugInfo += JSON.stringify(raw.map(i => ({ id: i.id, nombre: i.nombre, estado: i.estado })), null, 2);
  } catch (e: any) {
    debugInfo += `query error: ${e?.message ?? String(e)}`;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard Debug Step 2</h1>
      <pre className="mt-4 p-4 bg-white rounded border text-sm whitespace-pre-wrap">
        {debugInfo}
      </pre>
    </div>
  );
}
