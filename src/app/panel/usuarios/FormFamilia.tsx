"use client";

import { useState } from "react";
import { Icono } from "@/components/panel/Icono";
import { crearFamilia, useAlmacen } from "@/lib/mvp/almacen";
import type { DatosPersona, Sexo } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";

const campo =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:py-2.5 sm:text-sm";

type Hijo = DatosPersona & { clave: number; cursoId: string };

const personaVacia = (): DatosPersona => ({ nombre: "", dni: "", telefono: "", email: "", password: "", sexo: "" });
let siguienteClave = 1;
const hijoVacio = (): Hijo => ({ ...personaVacia(), cursoId: "", clave: siguienteClave++ });

/** Alta de un tutor/a junto con sus hijos/as: se crean todas las cuentas en un solo paso y quedan vinculadas. */
export function FormFamilia() {
  const { cursos } = useAlmacen();
  const [tutor, setTutor] = useState<DatosPersona>(personaVacia);
  const [hijos, setHijos] = useState<Hijo[]>(() => [hijoVacio()]);
  const [estado, setEstado] = useState<{ error: string } | { ok: string } | null>(null);
  const [pending, setPending] = useState(false);

  const cambiarHijo = (clave: number, cambios: Partial<Hijo>) => setHijos((hs) => hs.map((h) => (h.clave === clave ? { ...h, ...cambios } : h)));

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Los botones Mujer/Varón no son campos del formulario: se revisan acá.
    if (!tutor.sexo) return setEstado({ error: "Tutor/a: elegí mujer o varón." });
    const sinSexo = hijos.findIndex((h) => !h.sexo);
    if (sinSexo >= 0) return setEstado({ error: `${hijos.length === 1 ? "Hijo/a" : `Hijo/a ${sinSexo + 1}`}: elegí mujer o varón.` });

    setPending(true);
    setEstado(null);
    const resultado = await crearFamilia({ tutor, hijos: hijos.map((h) => ({ nombre: h.nombre, dni: h.dni, telefono: h.telefono, email: h.email, password: "", sexo: h.sexo, cursoId: h.cursoId })) });
    setPending(false);
    setEstado(resultado);
    if ("ok" in resultado) {
      setTutor(personaVacia());
      setHijos([hijoVacio()]);
    }
  }

  const tituloTutor = tutor.sexo === "F" ? "Datos de la madre / tutora" : tutor.sexo === "M" ? "Datos del padre / tutor" : "Datos del tutor/a";

  return (
    <form onSubmit={enviar} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Icono nombre="usuarios" className="h-4 w-4 text-blue-800" />
          {tituloTutor}
        </legend>
        <CamposPersona datos={tutor} onCambio={(c) => setTutor((t) => ({ ...t, ...c }))} />
      </fieldset>

      {hijos.map((hijo, i) => {
        const titulo = `${hijo.sexo === "F" ? "Hija" : hijo.sexo === "M" ? "Hijo" : "Hijo/a"}${hijos.length > 1 ? ` ${i + 1}` : ""}`;
        return (
          <fieldset key={hijo.clave} className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-3">
            <legend className="sr-only">{titulo}</legend>
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Icono nombre="alumnos" className="h-4 w-4 text-blue-800" />
                {titulo} <span className="font-normal text-slate-500">(cuenta de alumno/a)</span>
              </p>
              {hijos.length > 1 && (
                <button
                  type="button"
                  aria-label={`Quitar ${titulo}`}
                  onClick={() => setHijos((hs) => hs.filter((h) => h.clave !== hijo.clave))}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Icono nombre="eliminar" className="h-4 w-4" />
                </button>
              )}
            </div>
            <CamposPersona datos={hijo} onCambio={(c) => cambiarHijo(hijo.clave, c)} />
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Curso <span className="font-normal text-slate-400">(opcional)</span>
              </span>
              <select value={hijo.cursoId} onChange={(e) => cambiarHijo(hijo.clave, { cursoId: e.target.value })} className={campo}>
                <option value="">Sin curso por ahora</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
        );
      })}

      <button
        type="button"
        onClick={() => setHijos((hs) => [...hs, hijoVacio()])}
        disabled={hijos.length >= 10}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 px-4 py-2.5 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-50 disabled:opacity-50"
      >
        <Icono nombre="agregar" className="h-4 w-4" />
        Agregar otro hijo/a
      </button>

      <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-900">
        Todas las cuentas ingresan con su <strong>nombre completo</strong> y la contraseña <strong>pasodeloslibres</strong>.
      </p>

      {estado && "error" in estado && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{estado.error}</p>}
      {estado && "ok" in estado && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{estado.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:opacity-60"
      >
        <Icono nombre="agregar" className="h-4 w-4" />
        {pending ? "Creando…" : hijos.length === 1 ? "Crear tutor/a e hijo/a" : `Crear tutor/a y ${hijos.length} hijos/as`}
      </button>
    </form>
  );
}

/** Nombre y apellido, DNI, teléfono, email y el botón Mujer / Varón. Se ingresa con el nombre completo y la contraseña única. */
function CamposPersona({ datos, onCambio }: { datos: DatosPersona; onCambio: (cambios: Partial<DatosPersona>) => void }) {
  return (
    <>
      <SelectorSexo valor={datos.sexo} onCambio={(sexo) => onCambio({ sexo })} />
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Nombre y apellido completos</span>
        <input required maxLength={120} autoComplete="off" value={datos.nombre} onChange={(e) => onCambio({ nombre: e.target.value })} className={campo} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">DNI</span>
          <input
            required
            inputMode="numeric"
            maxLength={12}
            placeholder="45123456"
            autoComplete="off"
            value={datos.dni}
            onChange={(e) => onCambio({ dni: e.target.value })}
            className={campo}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Teléfono</span>
          <input
            required
            type="tel"
            inputMode="tel"
            maxLength={20}
            placeholder="3772 41-2345"
            autoComplete="off"
            value={datos.telefono}
            onChange={(e) => onCambio({ telefono: e.target.value })}
            className={campo}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Gmail / email</span>
        <input
          required
          type="email"
          placeholder="nombre@gmail.com"
          autoComplete="off"
          value={datos.email}
          onChange={(e) => onCambio({ email: e.target.value })}
          className={campo}
        />
      </label>
    </>
  );
}

export function SelectorSexo({ valor, onCambio }: { valor: Sexo | ""; onCambio: (s: Sexo) => void }) {
  const opciones: { sexo: Sexo; titulo: string; elegido: string }[] = [
    { sexo: "F", titulo: "Mujer", elegido: "border-pink-500 bg-pink-50 text-pink-900" },
    { sexo: "M", titulo: "Varón", elegido: "border-blue-600 bg-blue-50 text-blue-900" },
  ];
  return (
    <div role="radiogroup" aria-label="Sexo" className="grid grid-cols-2 gap-2">
      {opciones.map((o) => (
        <button
          key={o.sexo}
          type="button"
          role="radio"
          aria-checked={valor === o.sexo}
          onClick={() => onCambio(o.sexo)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors",
            valor === o.sexo ? o.elegido : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
          )}
        >
          {valor === o.sexo && <Icono nombre="check" className="h-4 w-4" />}
          {o.titulo}
        </button>
      ))}
    </div>
  );
}
