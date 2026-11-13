import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { borrarArchivo, listarArchivosVencidos } from "@/lib/biblioteca/datos";

// Borra los archivos vencidos (los que eligió el profesor y los "solo para imprimir").
// Lo ejecuta Vercel Cron todos los días (ver vercel.json) mandando `Authorization: Bearer CRON_SECRET`.
// Aunque no corra, los archivos vencidos ya no aparecen en la biblioteca.
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const vencidos = await listarArchivosVencidos();
  if (vencidos.length > 0) {
    await del(vencidos.map((a) => a.pathname));
    for (const archivo of vencidos) await borrarArchivo(archivo.id);
  }

  return NextResponse.json({ borrados: vencidos.length });
}
