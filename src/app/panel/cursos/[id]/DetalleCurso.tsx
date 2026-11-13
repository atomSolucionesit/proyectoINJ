"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { puede } from "@/lib/auth/permisos";
import {
  agregarAlumnoACurso,
  asignarDocente,
  crearAlumno,
  eliminarCurso,
  materiasParaAsistencia,
  puedeManejarAlumnos,
  quitarAlumnoDeCurso,
  quitarDocente,
  useAlmacen,
  useUsuario,
} from "@/lib/mvp/almacen";
import type { Curso, Usuario } from "@/lib/mvp/tipos";
import { campo } from "../Cursos";
import { Planilla } from "./asistencia/TomarAsistencia";

/** Sugerencias para el campo materia (se puede escribir cualquier otra). */
const materiasComunes = [
  "Matemática",
  "Lengua y Literatura",
  "Historia",
  "Geografía",
  "Biología",
  "Física",
  "Química",
  "Inglés",
  "Educación Física",
  "Formación Ética y Ciudadana",
  "Tecnología",
  "Educación Artística",
  "Catequesis",
];

const porNombre = (a: Usuario, b: Usuario) => a.nombre.localeCompare(b.nombre);

export function DetalleCurso() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const yo = useUsuario();
  const { cursos, usuarios } = useAlmacen();
  const curso = cursos.find((c) => c.id === id);

  if (!curso) {
    return (
      <EstadoVacio
        icono="cursos"
        titulo="Curso no encontrado"
        descripcion="Puede que lo hayan borrado."
        accion={{ titulo: "Volver a cursos", href: "/panel/cursos" }}
      />
    );
  }

  const gestiona = puede(yo.rol, "cursos:gestionar");
  const alumnos = usuarios.filter((u) => u.rol === "alumno" && u.cursoId === curso.id).sort(porNombre);
  const materiasAsistencia = materiasParaAsistencia(yo, curso);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-indigo-950 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Curso</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{curso.nombre}</h1>
        <p className="mt-2 text-sm text-blue-100">
          {alumnos.length} alumnos • {curso.docentes.length} materias
        </p>
      </div>

      {/* Lo primero al entrar: la lista para tomar asistencia y poner positivos y negativos. */}
      {materiasAsistencia.length > 0 && alumnos.length > 0 && (
        <Planilla key={curso.id} cursoId={curso.id} cursoNombre={curso.nombre} materias={materiasAsistencia} alumnos={alumnos} embebida />
      )}

      <Materias curso={curso} usuarios={usuarios} gestiona={gestiona} />
      <Alumnos curso={curso} alumnos={alumnos} usuarios={usuarios} puedeManejar={puedeManejarAlumnos(yo, curso)} esProfesor={yo.rol === "profesor"} />

      {gestiona && (
        <button
          type="button"
          onClick={async () => {
            if (!confirm(`¿Borrar ${curso.nombre}? Los alumnos quedan sin curso y se quitan las materias asignadas.`)) return;
            if (await eliminarCurso(curso.id)) router.push("/panel/cursos");
          }}
          className="w-full rounded-xl py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Borrar curso
        </button>
      )}
    </div>
  );
}

function Materias({ curso, usuarios, gestiona }: { curso: Curso; usuarios: Usuario[]; gestiona: boolean }) {
  const profesores = usuarios.filter((u) => u.rol === "profesor").sort(porNombre);
  const [estado, setEstado] = useState<{ error: string } | { ok: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = new FormData(form);
    setPending(true);
    const resultado = await asignarDocente(curso.id, String(datos.get("profesor") ?? ""), String(datos.get("materia") ?? ""));
    setPending(false);
    setEstado(resultado);
    if ("ok" in resultado) form.reset();
  }

  return (
    <Tarjeta className="overflow-hidden">
      <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 font-bold text-slate-900 sm:px-5">
        <Icono nombre="docentes" className="h-5 w-5 text-blue-800" />
        Materias y profesores
      </h2>

      {curso.docentes.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {curso.docentes.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{d.materia}</p>
                <p className="truncate text-xs text-slate-500">{d.profesorNombre}</p>
              </div>
              {gestiona && (
                <button
                  type="button"
                  aria-label={`Quitar ${d.materia}`}
                  onClick={() => void quitarDocente(curso.id, d.id)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Icono nombre="eliminar" className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-4 text-sm text-slate-500 sm:px-5">Todavía no hay materias asignadas.</p>
      )}

      {gestiona && (
        <form onSubmit={enviar} className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          {profesores.length === 0 ? (
            <p className="text-sm text-slate-600">Primero creá las cuentas de los profesores en la sección Usuarios.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Materia</span>
                  <input name="materia" required maxLength={80} list="materias" placeholder="Ej: Matemática" className={`mt-1 ${campo}`} />
                  <datalist id="materias">
                    {materiasComunes.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Profesor</span>
                  <select name="profesor" required defaultValue="" className={`mt-1 ${campo}`}>
                    <option value="" disabled>
                      Elegí un profesor
                    </option>
                    {profesores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:opacity-60 sm:w-auto sm:py-2.5"
              >
                <Icono nombre="agregar" className="h-4 w-4" />
                {pending ? "Asignando…" : "Asignar materia"}
              </button>
            </>
          )}
          {estado && "error" in estado && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{estado.error}</p>}
          {estado && "ok" in estado && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{estado.ok}</p>}
        </form>
      )}
    </Tarjeta>
  );
}

function Alumnos({
  curso,
  alumnos,
  usuarios,
  puedeManejar,
  esProfesor,
}: {
  curso: Curso;
  alumnos: Usuario[];
  usuarios: Usuario[];
  puedeManejar: boolean;
  esProfesor: boolean;
}) {
  const [modo, setModo] = useState<"nuevo" | "existente">("nuevo");

  return (
    <Tarjeta className="overflow-hidden">
      <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 font-bold text-slate-900 sm:px-5">
        <Icono nombre="alumnos" className="h-5 w-5 text-blue-800" />
        Alumnos
      </h2>

      {alumnos.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {alumnos.map((alumno) => (
            <li key={alumno.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold uppercase text-blue-900">
                {alumno.nombre.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{alumno.nombre}</p>
                <p className="truncate text-xs text-slate-500">{alumno.email}</p>
              </div>
              {puedeManejar && (
                <button
                  type="button"
                  aria-label={`Quitar a ${alumno.nombre} del curso`}
                  onClick={() => confirm(`¿Quitar a ${alumno.nombre} de ${curso.nombre}?`) && void quitarAlumnoDeCurso(curso.id, alumno.id)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Icono nombre="eliminar" className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-4 text-sm text-slate-500 sm:px-5">Todavía no hay alumnos en este curso.</p>
      )}

      {puedeManejar ? (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1 text-sm font-semibold">
            {(
              [
                ["nuevo", "Alumno nuevo"],
                ["existente", "Ya tiene cuenta"],
              ] as const
            ).map(([valor, titulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setModo(valor)}
                className={modo === valor ? "rounded-lg bg-white py-2 text-blue-900 shadow-xs" : "rounded-lg py-2 text-slate-600"}
              >
                {titulo}
              </button>
            ))}
          </div>
          {modo === "nuevo" ? <NuevoAlumno curso={curso} usuarios={usuarios} /> : <AlumnoExistente curso={curso} usuarios={usuarios} />}
        </div>
      ) : (
        esProfesor && (
          <p className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 sm:px-5">
            Para agregar alumnos a este curso tenés que dar alguna materia acá.
          </p>
        )
      )}
    </Tarjeta>
  );
}

/** Crea la cuenta del alumno ya anotado en este curso. */
function NuevoAlumno({ curso, usuarios }: { curso: Curso; usuarios: Usuario[] }) {
  const padres = usuarios.filter((u) => u.rol === "padre").sort(porNombre);
  const [estado, setEstado] = useState<{ error: string } | { ok: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = new FormData(form);
    const valor = (nombre: string) => String(datos.get(nombre) ?? "");
    setPending(true);
    const resultado = await crearAlumno(curso.id, {
      nombre: valor("nombre"),
      email: valor("email"),
      password: "",
      dni: valor("dni"),
      padreId: valor("padre_id"),
    });
    setPending(false);
    setEstado(resultado);
    if ("ok" in resultado) form.reset();
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Nombre y apellido</span>
          <input name="nombre" required maxLength={120} className={`mt-1 ${campo}`} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input name="email" type="email" required autoComplete="off" className={`mt-1 ${campo}`} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            DNI
          </span>
          <input name="dni" required maxLength={12} inputMode="numeric" placeholder="45123456" autoComplete="off" className={`mt-1 ${campo}`} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Tutor/a <span className="font-normal text-slate-400">(opcional)</span>
          </span>
          <select name="padre_id" defaultValue="" className={`mt-1 ${campo}`}>
            <option value="">Sin vincular</option>
            {padres.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:opacity-60 sm:w-auto sm:py-2.5"
      >
        <Icono nombre="agregar" className="h-4 w-4" />
        {pending ? "Creando…" : `Agregar a ${curso.nombre}`}
      </button>
      {estado && "error" in estado && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{estado.error}</p>}
      {estado && "ok" in estado && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{estado.ok}</p>}
    </form>
  );
}

/** Anota a un alumno que ya tiene cuenta (por ejemplo, si se cambia de curso). */
function AlumnoExistente({ curso, usuarios }: { curso: Curso; usuarios: Usuario[] }) {
  const [elegido, setElegido] = useState("");
  const [pending, setPending] = useState(false);
  // Primero los que no tienen curso; los de otro curso se pueden cambiar a este.
  const otros = usuarios
    .filter((u) => u.rol === "alumno" && u.cursoId !== curso.id)
    .sort((a, b) => Number(!!a.cursoId) - Number(!!b.cursoId) || porNombre(a, b));

  if (otros.length === 0) return <p className="text-sm text-slate-600">No hay alumnos en otros cursos. Usá &quot;Alumno nuevo&quot;.</p>;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        if (await agregarAlumnoACurso(curso.id, elegido)) setElegido("");
        setPending(false);
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <label className="block flex-1">
        <span className="text-sm font-semibold text-slate-700">Alumno</span>
        <select required value={elegido} onChange={(e) => setElegido(e.target.value)} className={`mt-1 ${campo}`}>
          <option value="" disabled>
            Elegí un alumno
          </option>
          {otros.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
              {a.curso ? ` (hoy en ${a.curso})` : " (sin curso)"}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending || !elegido}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:opacity-60 sm:py-2.5"
      >
        <Icono nombre="agregar" className="h-4 w-4" />
        {pending ? "Agregando…" : "Pasar a este curso"}
      </button>
    </form>
  );
}
