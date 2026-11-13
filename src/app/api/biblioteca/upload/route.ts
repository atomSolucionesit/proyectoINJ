import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth/dal";
import { bibliotecaConfig } from "@/config/biblioteca";

// El navegador sube el archivo directo a Vercel Blob; esta ruta solo entrega el permiso (token).
// Así no hay límite de tamaño del servidor de Next.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  // El aviso de "subida completada" lo manda Vercel (sin cookie) y handleUpload verifica su firma.
  if (body.type === "blob.generate-client-token" && !(await obtenerSesion())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const respuesta = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("biblioteca/")) throw new Error("Ruta inválida");
        return {
          allowedContentTypes: [...bibliotecaConfig.tiposPermitidos],
          maximumSizeInBytes: bibliotecaConfig.tamanoMaximo,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(respuesta);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
