"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site";
import { roles } from "@/lib/auth/permisos";
import { cuentasDemo, iniciarSesion, MOSTRAR_CUENTAS_DEMO } from "@/lib/mvp/almacen";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const parametros = useSearchParams();
  const destino = parametros.get("redirect") ?? "";
  const vencida = parametros.get("vencida") === "1";
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const resultado = await iniciarSesion(nombre, password);
    if ("error" in resultado) {
      setError(resultado.error);
      setPending(false);
      return;
    }
    // Solo se permite volver a rutas internas del panel.
    router.push(destino.startsWith("/panel") ? destino : "/panel");
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <form onSubmit={ingresar} className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col items-center gap-2 text-center">
          <Image src="/images/logo.png" alt={siteConfig.nombre} width={96} height={96} loading="eager" className="h-24 w-24 object-contain" />
          <p className="text-sm font-extrabold uppercase tracking-tight text-blue-950">{siteConfig.nombre}</p>
        </div>
        <h1 className="text-center text-xl font-bold">Acceso al panel</h1>
        {vencida && !error && (
          <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">Tu sesión terminó. Volvé a iniciar sesión.</p>
        )}
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Nombre y apellido completos
          <input
            name="nombre"
            required
            autoComplete="name"
            placeholder="Ej. Sofía Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded border px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Contraseña
          <span className="relative">
            <input
              name="password"
              type={verPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border py-2 pl-3 pr-11 font-normal"
            />
            {/* Mostrar u ocultar lo que se escribió, para revisar la contraseña antes de ingresar. */}
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={verPassword}
              title={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r text-slate-500 hover:text-slate-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {verPassword && <path d="M3 3l18 18" />}
              </svg>
            </button>
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>

      {/* MVP: accesos rápidos para probar cada rol */}
      {/* Solo en la demo: en producción (NEXT_PUBLIC_MOSTRAR_CUENTAS_DEMO sin definir o en 0) no aparecen. */}
      {MOSTRAR_CUENTAS_DEMO && (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cuentas de prueba</p>
        <div className="mt-2 grid grid-cols-1 gap-1.5">
          {cuentasDemo.map((cuenta) => (
            <button
              key={cuenta.nombre}
              type="button"
              onClick={() => {
                setNombre(cuenta.nombre);
                setPassword(cuenta.password);
              }}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100"
            >
              <span className="font-medium text-slate-800">{roles[cuenta.rol]}</span>
              <span className="text-right text-xs text-slate-500">
                {cuenta.nombre}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Tocá una cuenta para completar los datos. Contraseña de todas: <code className="rounded bg-slate-100 px-1">{cuentasDemo[0]?.password}</code>
        </p>
      </div>
      )}
    </div>
  );
}
