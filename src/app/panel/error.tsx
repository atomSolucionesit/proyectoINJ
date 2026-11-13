"use client"; // Los error boundaries tienen que ser componentes de cliente

import { useEffect } from "react";
import Link from "next/link";

/** Si una pantalla del panel se rompe, se muestra esto dentro del panel (el menú sigue funcionando). */
export default function ErrorPanel({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <h1 className="text-xl font-bold text-slate-900">Algo salió mal en esta pantalla</h1>
      <p className="mt-2 text-sm text-slate-600">Probá de nuevo. Si sigue pasando, volvé al inicio y avisanos qué estabas haciendo.</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={() => retry()} className="rounded-xl bg-blue-800 px-5 py-3 text-sm font-bold text-white hover:bg-blue-900">
          Reintentar
        </button>
        <Link href="/panel" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
