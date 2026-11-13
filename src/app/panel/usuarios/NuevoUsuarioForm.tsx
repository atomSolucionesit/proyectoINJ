"use client";

import { useState } from "react";
import Link from "next/link";
import { crearUsuario } from "@/lib/mvp/almacen";
import { roles, rolesAsignables } from "@/lib/auth/permisos";
import { Icono } from "@/components/panel/Icono";
import type { Sexo } from "@/lib/mvp/tipos";
import { FormFamilia, SelectorSexo } from "./FormFamilia";

const campo =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:py-2.5 sm:text-sm";

export function NuevoUsuarioForm() {
  const [estado, setEstado] = useState<{ error: string } | { ok: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [rol, setRol] = useState<string>("profesor");
  const [sexo, setSexo] = useState<Sexo | "">("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = new FormData(form);
    const valor = (nombre: string) => String(datos.get(nombre) ?? "");
    setPending(true);
    const resultado = await crearUsuario({
      nombre: valor("nombre"),
      email: valor("email"),
      password: "",
      rol,
      dni: valor("dni"),
      telefono: valor("telefono"),
      sexo,
    });
    setPending(false);
    setEstado(resultado);
    if ("ok" in resultado) {
      form.reset();
      setSexo("");
    }
  }

  const encabezado = (
    <>
      <div>
        <h2 className="font-bold text-slate-900">Nueva cuenta</h2>
        <p className="mt-1 text-xs text-slate-500">
          {rol === "padre" ? (
            "Se crea la cuenta del tutor/a y, abajo, la de cada hijo/a. Quedan vinculados entre sí."
          ) : (
            <>
              Los alumnos se agregan con su tutor/a (eligiendo el rol Tutor/a) o desde su curso, en{" "}
              <Link href="/panel/cursos" className="font-semibold text-blue-800 hover:underline">
                Cursos
              </Link>
              .
            </>
          )}
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">Rol</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {rolesAsignables.map((r) => (
            <label
              key={r}
              className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold text-slate-600 has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-900"
            >
              <input type="radio" name="rol" value={r} checked={rol === r} onChange={() => (setRol(r), setEstado(null))} className="sr-only" />
              {roles[r]}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );

  if (rol === "padre") {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
        {encabezado}
        <FormFamilia />
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
      {encabezado}
      <SelectorSexo valor={sexo} onCambio={setSexo} />

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Nombre y apellido completos</span>
        <input name="nombre" required maxLength={120} className={campo} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Email</span>
        <input name="email" type="email" required autoComplete="off" className={campo} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">DNI</span>
          <input name="dni" required maxLength={12} inputMode="numeric" placeholder="30123456" autoComplete="off" className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Teléfono <span className="font-normal text-slate-400">(opcional)</span>
          </span>
          <input name="telefono" type="tel" maxLength={20} inputMode="tel" autoComplete="off" className={campo} />
        </label>
      </div>
      <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-900">
        Ingresa con su <strong>nombre completo</strong> y la contraseña <strong>pasodeloslibres</strong> (la misma para todas las cuentas).
      </p>

      {estado && "error" in estado && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{estado.error}</p>}
      {estado && "ok" in estado && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{estado.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:opacity-60"
      >
        <Icono nombre="agregar" className="h-4 w-4" />
        {pending ? "Creando…" : "Crear cuenta"}
      </button>
    </form>
  );
}
