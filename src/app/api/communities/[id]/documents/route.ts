import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase";

const BUCKET = "documentos";

async function ensureBucket() {
  const supabase = createServiceClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 20 * 1024 * 1024, // 20 MB
      allowedMimeTypes: ["application/pdf", "text/plain", "application/octet-stream"],
    });
  }
}

// GET /api/communities/[id]/documents — lista documentos de la comunidad
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId } = await params;

  const instalacion = await prisma.instalacion.findFirst({
    where: { id: instalacionId, organizacionId },
  });
  if (!instalacion) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const documentos = await prisma.documento.findMany({
    where: { instalacionId },
    orderBy: { creadoEn: "desc" },
  });

  // Generate signed URLs for download
  const supabase = createServiceClient();
  const docs = await Promise.all(
    documentos.map(async d => {
      let url = d.storageUrl;
      if (d.storagePath) {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(d.storagePath, 3600); // 1h
        if (data?.signedUrl) url = data.signedUrl;
      }
      return {
        id: d.id,
        nombre: d.nombreFichero,
        tipo: d.tipo,
        tamano: d.tamanoBytes ?? 0,
        mimeType: d.mimeType ?? "application/octet-stream",
        url,
        creadoEn: d.creadoEn,
        autor: "Sistema",
      };
    })
  );

  return NextResponse.json(docs);
}

// POST /api/communities/[id]/documents — sube un documento
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId } = await params;

  const instalacion = await prisma.instalacion.findFirst({
    where: { id: instalacionId, organizacionId },
  });
  if (!instalacion) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "FormData inválido" }, { status: 400 });

  const file = formData.get("file") as File | null;
  const tipo = formData.get("tipo") as string | null;

  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

  const tiposValidos = ["ACUERDO_REPARTO", "TXT_DISTRIBUIDOR", "CIE", "AUTORIZACION_GESTOR", "CERTIFICADO_CAU", "OTRO"];
  const tipoDoc = tiposValidos.includes(tipo ?? "") ? tipo! : "OTRO";

  try {
    await ensureBucket();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storagePath = `${organizacionId}/${instalacionId}/${Date.now()}_${file.name}`;

    const supabase = createServiceClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);

    const documento = await prisma.documento.create({
      data: {
        instalacionId,
        tipo: tipoDoc as any,
        nombreFichero: file.name,
        storagePath,
        storageUrl: urlData?.signedUrl ?? "",
        tamanoBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        creadoPorId: session.user!.id!,
      },
    });

    return NextResponse.json({ id: documento.id, nombre: documento.nombreFichero }, { status: 201 });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}

// DELETE /api/communities/[id]/documents?docId=xxx
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;
  const { id: instalacionId } = await params;

  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");
  if (!docId) return NextResponse.json({ error: "docId requerido" }, { status: 400 });

  const documento = await prisma.documento.findFirst({
    where: { id: docId, instalacionId },
    include: { instalacion: { select: { organizacionId: true } } },
  });

  if (!documento || documento.instalacion.organizacionId !== organizacionId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (documento.storagePath) {
    const supabase = createServiceClient();
    await supabase.storage.from(BUCKET).remove([documento.storagePath]);
  }

  await prisma.documento.delete({ where: { id: docId } });

  return NextResponse.json({ ok: true });
}
