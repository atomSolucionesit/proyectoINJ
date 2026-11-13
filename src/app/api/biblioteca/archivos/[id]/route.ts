import { get } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesion } from "@/lib/auth/dal";
import { obtenerArchivo } from "@/lib/biblioteca/datos";
import { puedeVerArchivo } from "@/lib/biblioteca/acceso";

// Los archivos son privados en Vercel Blob: solo se descargan pasando por acá, con sesión y permiso.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/biblioteca/archivos/[id]">) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const encontrado = await obtenerArchivo((await ctx.params).id);
  const archivo = encontrado && puedeVerArchivo(sesion, encontrado) ? encontrado : null;
  const blob = archivo && (await get(archivo.pathname, { access: "private" }));
  if (!archivo || !blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const extension = archivo.pathname.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
  const nombre = encodeURIComponent(archivo.nombre + extension);
  const modo = request.nextUrl.searchParams.has("descargar") ? "attachment" : "inline";

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Content-Length": String(blob.blob.size),
      "Content-Disposition": `${modo}; filename*=UTF-8''${nombre}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
