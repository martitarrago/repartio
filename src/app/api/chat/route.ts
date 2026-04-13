import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Build system prompt with community context
async function buildSystemPrompt(organizacionId: string): Promise<string> {
  const instalaciones = await prisma.instalacion.findMany({
    where: { organizacionId },
    include: {
      participantes: { where: { activo: true }, select: { nombre: true, estadoFirma: true, estadoParticipante: true } },
      conjuntos: {
        where: { estado: { in: ["PUBLICADO", "VALIDADO"] } },
        orderBy: { version: "desc" },
        take: 1,
        select: { estado: true },
      },
    },
    orderBy: { actualizadaEn: "desc" },
  });

  const resumen = instalaciones.map(i => {
    const activos = i.participantes.filter(p => p.estadoParticipante === "ACTIVO");
    const firmados = activos.filter(p => p.estadoFirma === "FIRMADO").length;
    const pendientes = activos.filter(p => p.estadoFirma === "PENDIENTE").length;
    const tieneCoefs = i.conjuntos.length > 0;
    return `- ${i.nombre} (CAU: ${i.cau}, Fase: ${i.fase}, ${activos.length} participantes, ${firmados} firmados / ${pendientes} pendientes${tieneCoefs ? ", coeficientes publicados" : ", sin coeficientes"})`;
  }).join("\n");

  return `Eres el asistente de Repartio, una plataforma para gestionar comunidades de autoconsumo colectivo solar en España (Real Decreto 244/2019).

El gestor tiene estas comunidades actualmente:
${resumen || "No hay comunidades aún."}

Tu función es ayudar al gestor a:
- Entender el estado de sus comunidades y qué pasos faltan
- Interpretar errores de validación (CUPS, CAU, coeficientes β)
- Conocer la normativa de autoconsumo colectivo española
- Saber qué documentos necesita entregar a cada distribuidora
- Resolver dudas sobre el proceso de alta con la distribuidora

Responde siempre en español, de forma concisa y directa. Si el gestor menciona una comunidad específica, usa el resumen de arriba para dar contexto real. No inventes datos que no estén en el resumen.`;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY no configurada. Añádela en .env y reinicia el servidor." },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const organizacionId = (session.user as any).organizacionId as string;

  const { messages } = await req.json().catch(() => ({ messages: [] }));
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mensajes requeridos" }, { status: 400 });
  }

  // Validate message format
  const validMessages = messages.filter(
    (m: any) => m && typeof m.role === "string" && typeof m.content === "string"
  );

  try {
    const systemPrompt = await buildSystemPrompt(organizacionId);

    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: validMessages.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content as string,
      })),
    });

    // Return as Server-Sent Events stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const data = JSON.stringify({ text: chunk.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e: any) {
    console.error("Chat error:", e);
    return NextResponse.json({ error: "Error al procesar el mensaje" }, { status: 500 });
  }
}
