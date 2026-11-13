"use client";

import { useEffect, useState } from "react";
import { EncabezadoPagina, EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { asistenciaDelDia, guardarAsistencia, materiasParaAsistencia, useAlmacen, useUsuario } from "@/lib/mvp/almacen";
import type { Curso, EstadoAsistencia, Usuario } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";

/**
 * Asistencia del día para el profesor, pensada para usarse sin explicación:
 * 1) tocar el curso, 2) la materia (si da más de una), 3) tocar "Ausente" en los que faltaron y guardar.
 * Todos arrancan como presentes. Lo marcado en cada curso se conserva al cambiar de curso hasta guardarlo.
 */

/** Fecha de hoy en la hora local ("2026-11-12"). */
function hoy() {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  return ahora.toISOString().slice(0, 10);
}

const fechaLarga = (fecha: string) =>
  new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${fecha}T12:00:00.000Z`));

type Carga = { marcas: Record<string, EstadoAsistencia>; yaTomada: boolean } | { error: string };

export function AsistenciaProfesor() {
  const yo = useUsuario();
  const { cursos, usuarios } = useAlmacen();
  const fecha = hoy();

  // La API ya le manda al profesor solo los cursos donde da alguna materia.
  const misCursos = cursos.filter((c) => materiasParaAsistencia(yo, c).length > 0);
  const alumnosDe = (curso: Curso) =>
    usuarios.filter((u) => u.rol === "alumno" && u.cursoId === curso.id).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const [cursoId, setCursoId] = useState<string | null>(null);
  const [materiaElegida, setMateriaElegida] = useState<string | null>(null);
  const [cargas, setCargas] = useState<Record<string, Carga>>({});
  const [cambios, setCambios] = useState<Record<string, Record<string, EstadoAsistencia>>>({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ error: string } | { ok: string } | null>(null);
  const [reintento, setReintento] = useState(0);

  // Si da clases en un solo curso, ya queda elegido.
  const curso = misCursos.find((c) => c.id === cursoId) ?? (misCursos.length === 1 ? misCursos[0] : undefined);
  const materias = curso ? materiasParaAsistencia(yo, curso) : [];
  const materia = materiaElegida && materias.includes(materiaElegida) ? materiaElegida : materias.length === 1 ? materias[0] : null;
  const clave = curso && materia ? `${curso.id}|${materia}|${fecha}` : null;
  const carga = clave ? cargas[clave] : undefined;

  useEffect(() => {
    if (!curso || !materia || !clave || (cargas[clave] && !("error" in cargas[clave]))) return;
    let vigente = true;
    void asistenciaDelDia(curso.id, materia, fecha).then((resultado) => {
      if (!vigente) return;
      const nueva: Carga =
        "error" in resultado
          ? resultado
          : { marcas: Object.fromEntries(resultado.registros.map((r) => [r.alumnoId, r.estado])), yaTomada: resultado.registros.length > 0 };
      setCargas((anteriores) => ({ ...anteriores, [clave]: nueva }));
    });
    return () => {
      vigente = false;
    };
    // `cargas` no va en las dependencias: solo se pide al cambiar de curso/materia o al reintentar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curso?.id, materia, clave, fecha, reintento]);

  if (misCursos.length === 0) {
    return (
      <>
        <EncabezadoPagina titulo="Asistencia" />
        <EstadoVacio icono="cursos" titulo="Todavía no tenés cursos asignados" descripcion="Pedile a la administración que te asigne tus materias y cursos." />
      </>
    );
  }

  const sinGuardar = (c: Curso) => Object.keys(cambios).some((k) => k.startsWith(`${c.id}|`) && Object.keys(cambios[k]).length > 0);

  function elegirCurso(id: string) {
    setCursoId(id);
    setMateriaElegida(null);
    setMensaje(null);
  }

  function elegirMateria(m: string) {
    setMateriaElegida(m);
    setMensaje(null);
  }

  return (
    <>
      <EncabezadoPagina titulo="Tomar asistencia" descripcion={`Hoy es ${fechaLarga(fecha)}.`} />

      <div className="space-y-6">
        {/* Paso 1: curso */}
        <Paso numero={1} titulo="Tocá el curso">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {misCursos.map((c) => {
              const elegido = curso?.id === c.id;
              const cantidad = alumnosDe(c).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => elegirCurso(c.id)}
                  aria-pressed={elegido}
                  className={cn(
                    "flex min-h-20 items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-colors",
                    elegido ? "border-blue-800 bg-blue-800 text-white shadow-md" : "border-slate-300 bg-white text-slate-900 hover:border-blue-400 hover:bg-blue-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                      elegido ? "border-white bg-white text-blue-800" : "border-slate-300",
                    )}
                  >
                    {elegido && <Icono nombre="check" className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xl font-bold">{c.nombre}</span>
                    <span className={cn("block text-base", elegido ? "text-blue-100" : "text-slate-500")}>
                      {cantidad} {cantidad === 1 ? "alumno" : "alumnos"}
                      {sinGuardar(c) && <span className="ml-2 font-semibold text-amber-500">• sin guardar</span>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Paso>

        {/* Paso 2: materia (solo si da más de una en ese curso) */}
        {curso && materias.length > 1 && (
          <Paso numero={2} titulo="Tocá la materia">
            <div className="flex flex-wrap gap-3">
              {materias.map((m) => {
                const elegida = materia === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => elegirMateria(m)}
                    aria-pressed={elegida}
                    className={cn(
                      "min-h-14 rounded-2xl border-2 px-6 text-lg font-bold transition-colors",
                      elegida ? "border-blue-800 bg-blue-800 text-white" : "border-slate-300 bg-white text-slate-900 hover:border-blue-400 hover:bg-blue-50",
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </Paso>
        )}

        {/* Paso final: la lista */}
        {curso && materia && clave && (
          <Paso numero={materias.length > 1 ? 3 : 2} titulo={`Marcá a los que faltaron — ${curso.nombre}, ${materia}`}>
            <Lista
              alumnos={alumnosDe(curso)}
              carga={carga}
              cambios={cambios[clave] ?? {}}
              guardando={guardando}
              mensaje={mensaje}
              onReintentar={() => setReintento((r) => r + 1)}
              onMarcar={(alumnoId, estado) => {
                setMensaje(null);
                setCambios((anteriores) => ({ ...anteriores, [clave]: { ...anteriores[clave], [alumnoId]: estado } }));
              }}
              onTodosPresentes={(alumnos) => {
                setMensaje(null);
                setCambios((anteriores) => ({ ...anteriores, [clave]: Object.fromEntries(alumnos.map((a) => [a.id, "presente" as const])) }));
              }}
              onGuardar={async (registros) => {
                setGuardando(true);
                const resultado = await guardarAsistencia(curso.id, { materia, fecha, registros });
                setGuardando(false);
                if ("error" in resultado) return setMensaje(resultado);
                const ausentes = registros.filter((r) => r.estado === "ausente").length;
                setMensaje({
                  ok: `¡Listo! Se guardó la asistencia de ${curso.nombre} (${materia}): ${registros.length - ausentes} presentes y ${ausentes} ${ausentes === 1 ? "ausente" : "ausentes"}.`,
                });
                setCargas((anteriores) => ({
                  ...anteriores,
                  [clave]: { marcas: Object.fromEntries(registros.map((r) => [r.alumnoId, r.estado])), yaTomada: true },
                }));
                setCambios((anteriores) => {
                  const resto = { ...anteriores };
                  delete resto[clave];
                  return resto;
                });
              }}
            />
          </Paso>
        )}
      </div>
    </>
  );
}

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-3 text-lg font-bold text-slate-900 sm:text-xl">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 text-base font-extrabold text-white">{numero}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Lista({
  alumnos,
  carga,
  cambios,
  guardando,
  mensaje,
  onReintentar,
  onMarcar,
  onTodosPresentes,
  onGuardar,
}: {
  alumnos: Usuario[];
  carga: Carga | undefined;
  cambios: Record<string, EstadoAsistencia>;
  guardando: boolean;
  mensaje: { error: string } | { ok: string } | null;
  onReintentar: () => void;
  onMarcar: (alumnoId: string, estado: EstadoAsistencia) => void;
  onTodosPresentes: (alumnos: Usuario[]) => void;
  onGuardar: (registros: { alumnoId: string; estado: EstadoAsistencia }[]) => Promise<void>;
}) {
  if (alumnos.length === 0) {
    return <EstadoVacio icono="alumnos" titulo="Este curso no tiene alumnos" descripcion="Pedile a la administración que los agregue al curso." />;
  }
  if (!carga) {
    return (
      <Tarjeta className="p-8 text-center">
        <p className="text-lg text-slate-600">Cargando la lista…</p>
      </Tarjeta>
    );
  }
  if ("error" in carga) {
    return (
      <Tarjeta className="p-6 text-center">
        <p className="text-lg font-medium text-red-700">{carga.error}</p>
        <button type="button" onClick={onReintentar} className="mt-4 min-h-12 rounded-xl bg-blue-800 px-6 text-lg font-bold text-white hover:bg-blue-900">
          Probar de nuevo
        </button>
      </Tarjeta>
    );
  }

  // Sin marca: presente. Si alguien había quedado "tarde" (desde Cursos), se respeta mientras no se cambie.
  const estadoDe = (id: string): EstadoAsistencia => cambios[id] ?? carga.marcas[id] ?? "presente";
  const ausentes = alumnos.filter((a) => estadoDe(a.id) === "ausente").length;
  const presentes = alumnos.length - ausentes;
  const hayCambios = Object.keys(cambios).length > 0;

  return (
    <Tarjeta className="overflow-hidden">
      <div className="space-y-3 border-b border-slate-200 bg-blue-50/60 px-4 py-4 sm:px-6">
        <p className="flex items-start gap-2 text-base text-slate-800 sm:text-lg">
          <Icono nombre="alerta" className="mt-1 h-5 w-5 shrink-0 text-blue-800" />
          <span>
            Todos empiezan como <strong className="text-emerald-700">PRESENTES</strong>. Tocá <strong className="text-red-700">AUSENTE</strong> en los alumnos que
            faltaron y después tocá <strong>Guardar</strong> abajo de todo.
          </span>
        </p>
        {carga.yaTomada && !hayCambios && (
          <p className="rounded-xl bg-white px-3 py-2 text-base font-semibold text-blue-900">
            ✔ La asistencia de hoy ya está guardada. Si te equivocaste, podés corregirla y guardar de nuevo.
          </p>
        )}
      </div>

      <ul className="divide-y divide-slate-200">
        {alumnos.map((alumno, i) => {
          const estado = estadoDe(alumno.id);
          const falto = estado === "ausente";
          return (
            <li key={alumno.id} className={cn("flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6", falto && "bg-red-50")}>
              <p className="min-w-0 flex-1 text-lg font-semibold text-slate-900 sm:text-xl">
                <span className="mr-2 text-slate-400">{i + 1}.</span>
                {alumno.nombre}
                {estado === "tarde" && <span className="ml-2 text-sm font-medium text-amber-700">(llegó tarde)</span>}
              </p>
              <div role="radiogroup" aria-label={`Asistencia de ${alumno.nombre}`} className="grid shrink-0 grid-cols-2 gap-2 sm:w-80">
                <BotonEstado
                  elegido={!falto}
                  onClick={() => onMarcar(alumno.id, "presente")}
                  icono="check"
                  texto="Presente"
                  colorElegido="border-emerald-600 bg-emerald-600 text-white"
                />
                <BotonEstado
                  elegido={falto}
                  onClick={() => onMarcar(alumno.id, "ausente")}
                  icono="cerrar"
                  texto="Ausente"
                  colorElegido="border-red-600 bg-red-600 text-white"
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-4 border-t border-slate-200 bg-slate-50 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg text-slate-800">
            <strong className="text-emerald-700">{presentes}</strong> {presentes === 1 ? "presente" : "presentes"} ·{" "}
            <strong className="text-red-700">{ausentes}</strong> {ausentes === 1 ? "ausente" : "ausentes"}
          </p>
          {ausentes > 0 && (
            <button
              type="button"
              onClick={() => onTodosPresentes(alumnos)}
              className="min-h-12 rounded-xl border-2 border-slate-300 bg-white px-4 text-base font-semibold text-slate-700 hover:bg-slate-100"
            >
              Poner a todos presentes
            </button>
          )}
        </div>

        {mensaje && "error" in mensaje && <p className="rounded-xl bg-red-100 px-4 py-3 text-lg font-semibold text-red-800">{mensaje.error}</p>}
        {mensaje && "ok" in mensaje && (
          <p className="flex items-start gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-lg font-semibold text-emerald-900">
            <Icono nombre="check" className="mt-0.5 h-6 w-6 shrink-0" />
            {mensaje.ok}
          </p>
        )}

        <button
          type="button"
          disabled={guardando}
          onClick={() => void onGuardar(alumnos.map((a) => ({ alumnoId: a.id, estado: estadoDe(a.id) })))}
          className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-blue-800 px-6 text-xl font-bold text-white shadow-md transition-all hover:bg-blue-900 active:scale-[0.99] disabled:opacity-60"
        >
          <Icono nombre="check" className="h-6 w-6" />
          {guardando ? "Guardando…" : "Guardar asistencia"}
        </button>
      </div>
    </Tarjeta>
  );
}

function BotonEstado({
  elegido,
  onClick,
  icono,
  texto,
  colorElegido,
}: {
  elegido: boolean;
  onClick: () => void;
  icono: "check" | "cerrar";
  texto: string;
  colorElegido: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={elegido}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 px-3 text-lg font-bold transition-colors",
        elegido ? colorElegido : "border-slate-300 bg-white text-slate-500 hover:bg-slate-100",
      )}
    >
      <Icono nombre={icono} className="h-6 w-6" />
      {texto}
    </button>
  );
}
