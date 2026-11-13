"use client";

import { useState } from "react";
import { Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { roles, type Rol } from "@/lib/auth/permisos";
import { editarUsuario, eliminarUsuario, useAlmacen, useUsuario } from "@/lib/mvp/almacen";
import type { Sexo, Usuario } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";
import { SelectorSexo } from "./FormFamilia";
import { NuevoUsuarioForm } from "./NuevoUsuarioForm";

const coloresRol = {
  admin: "bg-slate-100 text-slate-700",
  profesor: "bg-indigo-50 text-indigo-800",
  alumno: "bg-blue-50 text-blue-800",
  padre: "bg-emerald-50 text-emerald-800",
  bibliotecaria: "bg-amber-50 text-amber-800",
  preceptor: "bg-violet-50 text-violet-800",
} as const;

const ordenRol = Object.keys(roles);

const campo =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:text-sm";

/** "Madre"/"Padre", "Alumna"/"Alumno" según el sexo cargado; si no hay, el nombre del rol. */
function nombreRol(u: Usuario) {
  if (u.esSuperadmin) return "Superadministrador";
  if (u.rol === "padre" && u.sexo) return u.sexo === "F" ? "Madre" : "Padre";
  if (u.rol === "alumno" && u.sexo) return u.sexo === "F" ? "Alumna" : "Alumno";
  return roles[u.rol];
}

/** "3772412345" → "3772 41-2345" */
const mostrarTelefono = (t: string) => (t.length === 10 ? `${t.slice(0, 4)} ${t.slice(4, 6)}-${t.slice(6)}` : t);

/** Los DNI provisorios (90.000.001 en adelante) se pusieron a cuentas viejas que no tenían: hay que cambiarlos por el real. */
const esDniProvisorio = (dni: string | null | undefined) => (dni ?? "").replace(/\D/g, "").startsWith("9000");

type Filtro = "todos" | Rol;

/** Solo el administrador entra a esta sección: ve todas las cuentas con sus datos de acceso, las edita y las borra. */
export function Usuarios() {
  const yo = useUsuario();
  const { usuarios } = useAlmacen();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");

  const q = busqueda.trim().toLowerCase();
  const ordenados = [...usuarios]
    .filter((u) => filtro === "todos" || u.rol === filtro)
    .filter((u) => !q || [u.nombre, u.email, u.dni ?? "", u.dni?.replace(/\D/g, "") ?? ""].some((t) => t.toLowerCase().includes(q)))
    .sort((a, b) => ordenRol.indexOf(a.rol) - ordenRol.indexOf(b.rol) || a.nombre.localeCompare(b.nombre));
  const hijosDe = (id: string) => usuarios.filter((u) => u.padreId === id);
  const cantidad = (r: Rol) => usuarios.filter((u) => u.rol === r).length;
  const provisorios = usuarios.filter((u) => esDniProvisorio(u.dni)).length;

  const filtros: { valor: Filtro; titulo: string }[] = [
    { valor: "todos", titulo: `Todos (${usuarios.length})` },
    ...(Object.keys(roles) as Rol[]).filter((r) => cantidad(r) > 0).map((r) => ({ valor: r, titulo: `${roles[r]} (${cantidad(r)})` })),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
      <div className="space-y-3">
        <p className="flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-900">
          <Icono nombre="usuarios" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Cada persona ingresa al panel con su <strong>nombre completo</strong> y su <strong>contraseña</strong>. Tocá una cuenta para ver su contraseña o
            corregir sus datos.
          </span>
        </p>
        {provisorios > 0 && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
            {provisorios === 1 ? "Una cuenta tiene" : `${provisorios} cuentas tienen`} un DNI provisorio (empieza con 90.000). Cambialo por el DNI real.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <input
            type="search"
            placeholder="Buscar por nombre, DNI o email…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={campo.replace("mt-1 ", "")}
          />
          <div role="tablist" aria-label="Filtrar por rol" className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {filtros.map((f) => (
              <button
                key={f.valor}
                type="button"
                role="tab"
                aria-selected={filtro === f.valor}
                onClick={() => setFiltro(f.valor)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  filtro === f.valor ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {f.titulo}
              </button>
            ))}
          </div>
        </div>

        <Tarjeta className="divide-y divide-slate-100 overflow-hidden">
          {ordenados.length === 0 && <p className="p-4 text-sm text-slate-500">Ninguna cuenta coincide con la búsqueda.</p>}
          {ordenados.map((usuario) => {
            const hijos = hijosDe(usuario.id);
            const tutor = usuario.padreId ? usuarios.find((u) => u.id === usuario.padreId) : undefined;
            const estaAbierto = abierto === usuario.id;
            return (
              <div key={usuario.id}>
                <div className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    aria-expanded={estaAbierto}
                    onClick={() => setAbierto(estaAbierto ? null : usuario.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold uppercase text-slate-700">
                      {usuario.nombre.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-900">{usuario.nombre}</span>
                      <span className={cn("block truncate text-xs", esDniProvisorio(usuario.dni) ? "font-semibold text-amber-700" : "text-slate-500")}>
                        DNI {usuario.dni ?? "—"}
                        {usuario.curso && ` • ${usuario.curso}`}
                      </span>
                      {usuario.rol === "padre" && (
                        <span className="block truncate text-xs font-medium text-emerald-700">
                          {hijos.length > 0 ? `${hijos.length === 1 ? "Hijo/a" : "Hijos/as"}: ${hijos.map((h) => h.nombre).join(", ")}` : "Sin hijos vinculados"}
                        </span>
                      )}
                      {tutor && <span className="block truncate text-xs font-medium text-emerald-700">Tutor/a: {tutor.nombre}</span>}
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${coloresRol[usuario.rol]}`}>{nombreRol(usuario)}</span>
                    <Icono nombre="flecha" className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", estaAbierto && "rotate-90")} />
                  </button>
                  {usuario.id !== yo.id && usuario.rol !== "admin" && (
                    <button
                      type="button"
                      aria-label={`Eliminar a ${usuario.nombre}`}
                      onClick={() => confirm(`¿Eliminar la cuenta de ${usuario.nombre}?`) && void eliminarUsuario(usuario.id)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Icono nombre="eliminar" className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {estaAbierto && <FichaUsuario usuario={usuario} hijos={hijos} tutor={tutor} onVer={setAbierto} />}
              </div>
            );
          })}
        </Tarjeta>
      </div>

      <NuevoUsuarioForm />
    </div>
  );
}

/** Todos los datos de la cuenta, sus datos de acceso y la familia vinculada. Con "Editar" se corrigen. */
function FichaUsuario({ usuario, hijos, tutor, onVer }: { usuario: Usuario; hijos: Usuario[]; tutor?: Usuario; onVer: (id: string) => void }) {
  const [editando, setEditando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  async function copiarAcceso() {
    try {
      await navigator.clipboard.writeText(`Para ingresar al panel:\nNombre: ${usuario.nombre}\nContraseña: ${usuario.password ?? ""}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso para el portapapeles: los datos igual están a la vista.
    }
  }

  if (editando) return <EditarUsuario usuario={usuario} onListo={() => setEditando(false)} />;

  const filas: [string, React.ReactNode][] = [
    ["Rol", nombreRol(usuario)],
    [
      "DNI",
      <span key="dni" className={cn("tabular-nums", esDniProvisorio(usuario.dni) && "font-semibold text-amber-700")}>
        {usuario.dni ?? "—"}
        {esDniProvisorio(usuario.dni) && <span className="ml-2 text-xs font-medium">(provisorio, cambialo por el real)</span>}
      </span>,
    ],
    ["Email", usuario.email],
    ["Teléfono", usuario.telefono ? mostrarTelefono(usuario.telefono) : "Sin cargar"],
    ["Sexo", usuario.sexo === "F" ? "Mujer" : usuario.sexo === "M" ? "Varón" : "Sin cargar"],
    ...(usuario.rol === "alumno" ? ([["Curso", usuario.curso ?? "Sin curso"]] as [string, React.ReactNode][]) : []),
  ];

  return (
    <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 px-4 py-4">
      <div className="rounded-xl border border-blue-200 bg-white p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Datos para ingresar</p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-slate-500">Nombre completo</dt>
          <dd className="font-semibold text-slate-900">{usuario.nombre}</dd>
          <dt className="self-center text-slate-500">Contraseña</dt>
          <dd className="flex flex-wrap items-center gap-2">
            {usuario.esSuperadmin ? (
              <span className="text-slate-600">La de SUPERADMIN_PASSWORD, en el .env del servidor.</span>
            ) : usuario.password ? (
              <>
                <code className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-sm font-semibold text-slate-900">
                  {verPassword ? usuario.password : "••••••••"}
                </code>
                <button type="button" onClick={() => setVerPassword((v) => !v)} className="text-sm font-semibold text-blue-800 hover:underline">
                  {verPassword ? "Ocultar" : "Ver contraseña"}
                </button>
              </>
            ) : (
              <span className="text-amber-700">No se puede ver (se creó antes de este cambio). Poné una nueva con “Editar datos”.</span>
            )}
          </dd>
        </dl>
        {usuario.password && (
          <button type="button" onClick={() => void copiarAcceso()} className="mt-2 text-sm font-semibold text-blue-800 hover:underline">
            {copiado ? "✓ Copiado" : "Copiar datos de acceso"}
          </button>
        )}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        {filas.map(([titulo, valor]) => (
          <div key={titulo} className="contents">
            <dt className="text-slate-500">{titulo}</dt>
            <dd className="min-w-0 break-words text-slate-900">{valor}</dd>
          </div>
        ))}
      </dl>

      {(hijos.length > 0 || tutor) && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{tutor ? "Tutor/a" : hijos.length === 1 ? "Hijo/a" : "Hijos/as"}</p>
          <ul className="mt-1 space-y-1">
            {(tutor ? [tutor] : hijos).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onVer(p.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900">{p.nombre}</span>
                    <span className="block truncate text-xs text-slate-500">
                      DNI {p.dni ?? "—"}
                      {p.curso && ` • ${p.curso}`}
                      {p.telefono && ` • Tel. ${mostrarTelefono(p.telefono)}`}
                    </span>
                  </span>
                  <Icono nombre="flecha" className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!usuario.esSuperadmin && (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50 sm:w-auto"
        >
          <Icono nombre="configuracion" className="h-4 w-4" />
          Editar datos
        </button>
      )}
    </div>
  );
}

function EditarUsuario({ usuario, onListo }: { usuario: Usuario; onListo: () => void }) {
  const [datos, setDatos] = useState({
    nombre: usuario.nombre,
    dni: (usuario.dni ?? "").replace(/\D/g, ""),
    email: usuario.email,
    telefono: usuario.telefono ?? "",
    password: "",
  });
  const [sexo, setSexo] = useState<Sexo | "">(usuario.sexo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const cambiar = (c: Partial<typeof datos>) => setDatos((d) => ({ ...d, ...c }));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const r = await editarUsuario(usuario.id, { ...datos, sexo });
    setGuardando(false);
    if ("error" in r) return setError(r.error);
    onListo();
  }

  return (
    <form onSubmit={guardar} className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-4 py-4">
      <SelectorSexo valor={sexo} onCambio={setSexo} />
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Nombre y apellido completos</span>
        <input required maxLength={120} value={datos.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} className={campo} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">DNI</span>
          <input required inputMode="numeric" maxLength={12} value={datos.dni} onChange={(e) => cambiar({ dni: e.target.value })} className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Teléfono</span>
          <input type="tel" inputMode="tel" maxLength={20} value={datos.telefono} onChange={(e) => cambiar({ telefono: e.target.value })} className={campo} />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Email</span>
        <input required type="email" value={datos.email} onChange={(e) => cambiar({ email: e.target.value })} className={campo} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">
          Nueva contraseña <span className="font-normal text-slate-400">(dejala vacía para no cambiarla)</span>
        </span>
        <input
          type="text"
          minLength={6}
          maxLength={60}
          autoComplete="new-password"
          value={datos.password}
          onChange={(e) => cambiar({ password: e.target.value })}
          className={campo}
        />
      </label>
      <p className="text-xs text-slate-500">Si cambiás el nombre o la contraseña, la persona tiene que ingresar con los datos nuevos.</p>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onListo} className="rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="rounded-xl bg-blue-800 py-2.5 text-sm font-bold text-white hover:bg-blue-900 disabled:opacity-60">
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
