"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { permisoParaRuta, puede } from "@/lib/auth/permisos";
import { reintentar, useSesion } from "@/lib/mvp/almacen";
import { Sidebar } from "./Sidebar";
import { PanelHeader } from "./PanelHeader";
import { MobileNav } from "./MobileNav";
import { Avisos } from "./Avisos";
import { Icono } from "./Icono";

/**
 * Estructura del panel + control de acceso:
 * sin sesión → login (con aviso si venció); sección sin permiso → inicio del panel con aviso;
 * sin conexión con el servidor → pantalla para reintentar (o un aviso arriba si ya había datos).
 */
export function PanelShell({ children }: { children: React.ReactNode }) {
  const { listo, usuario, sinConexion, sesionVencida } = useSesion();
  const pathname = usePathname();
  const router = useRouter();

  const permiso = permisoParaRuta(pathname);
  const permitido = !!usuario && (!permiso || puede(usuario.rol, permiso));
  // Sin conexión y sin datos todavía: no se sabe si hay sesión, así que no se manda al login.
  const esperandoServidor = listo && !usuario && sinConexion && !sesionVencida;

  useEffect(() => {
    if (!listo || esperandoServidor) return;
    if (!usuario) router.replace(`/login?redirect=${encodeURIComponent(pathname)}${sesionVencida ? "&vencida=1" : ""}`);
    else if (!permitido) router.replace("/panel?denegado=1");
  }, [listo, usuario, permitido, pathname, router, esperandoServidor, sesionVencida]);

  if (esperandoServidor) return <SinConexion />;
  if (!listo || !usuario || !permitido) return <EsqueletoPanel />;

  return (
    <div className="flex flex-1 bg-slate-50">
      <Sidebar rol={usuario.rol} />
      <div className="flex min-w-0 flex-1 flex-col">
        <PanelHeader usuario={usuario} />
        {sinConexion && (
          <p role="status" className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
            Sin conexión con el servidor. Lo que ves puede no estar actualizado; se reintenta solo.
          </p>
        )}
        {/* pb extra en celular para que la barra inferior no tape el contenido */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <MobileNav rol={usuario.rol} />
      <Avisos />
    </div>
  );
}

function SinConexion() {
  const [reintentando, setReintentando] = useState(false);

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="max-w-sm text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Icono nombre="alerta" className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-900">No se pudo conectar con el servidor</h1>
        <p className="mt-2 text-sm text-slate-600">
          Revisá tu conexión a internet. Si estás probando en tu compu, fijate que el backend esté corriendo (
          <code className="rounded bg-slate-200 px-1">npm run start:dev</code> en la carpeta <code className="rounded bg-slate-200 px-1">backend</code>).
          Se vuelve a intentar solo cada pocos segundos.
        </p>
        <button
          type="button"
          disabled={reintentando}
          onClick={async () => {
            setReintentando(true);
            await reintentar();
            setReintentando(false);
          }}
          className="mt-6 rounded-xl bg-blue-800 px-5 py-3 text-sm font-bold text-white hover:bg-blue-900 disabled:opacity-60"
        >
          {reintentando ? "Reintentando…" : "Reintentar"}
        </button>
      </div>
    </div>
  );
}

export function EsqueletoPanel() {
  return (
    <div className="flex flex-1 bg-slate-50" aria-label="Cargando">
      <div className="hidden w-64 shrink-0 bg-blue-950 lg:block" />
      <div className="flex-1">
        <div className="h-16 border-b border-slate-200/80 bg-white" />
        <div className="mx-auto max-w-6xl animate-pulse space-y-4 px-4 pt-6 sm:px-6 lg:px-8">
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="h-40 rounded-3xl bg-slate-200/70" />
        </div>
      </div>
    </div>
  );
}
