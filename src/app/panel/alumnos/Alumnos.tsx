"use client";

import { EncabezadoPagina, EstadoVacio, Tarjeta } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { puede, roles } from "@/lib/auth/permisos";
import { useAlmacen, useUsuario } from "@/lib/mvp/almacen";
import type { Curso, Usuario } from "@/lib/mvp/tipos";

type Vista =
  | { tipo: "todos"; alumnos: Usuario[] }
  | { tipo: "hijos"; hijos: Usuario[] }
  | { tipo: "propia"; yo: Usuario };

/**
 * Admin: todos los alumnos. Profesores: los de sus cursos. Padres: sus hijos.
 * Alumnos y bibliotecaria: solo su propia ficha.
 */
function vistaPara(yo: Usuario, usuarios: Usuario[], cursos: Curso[]): Vista {
  const porNombre = (x: Usuario, y: Usuario) => x.nombre.localeCompare(y.nombre);
  if (puede(yo.rol, "alumnos:ver-todos")) {
    // La API ya le manda a cada profesor solo sus cursos.
    const misCursos = new Set(cursos.map((c) => c.id));
    const alumnos = usuarios.filter((u) => u.rol === "alumno" && (yo.rol !== "profesor" || (u.cursoId && misCursos.has(u.cursoId))));
    return { tipo: "todos", alumnos: alumnos.sort((x, y) => (x.curso ?? "~").localeCompare(y.curso ?? "~") || porNombre(x, y)) };
  }
  if (yo.rol === "padre") return { tipo: "hijos", hijos: usuarios.filter((u) => u.padreId === yo.id).sort(porNombre) };
  return { tipo: "propia", yo };
}

export function Alumnos() {
  const yo = useUsuario();
  const { usuarios, cursos } = useAlmacen();
  const vista = vistaPara(yo, usuarios, cursos);
  const nombreDe = (id: string | null) => usuarios.find((u) => u.id === id)?.nombre ?? null;
  const cursoDe = (alumno: Usuario) => cursos.find((c) => c.id === alumno.cursoId);

  if (vista.tipo === "todos") {
    const { alumnos } = vista;
    return (
      <>
        <EncabezadoPagina titulo="Alumnos" descripcion={`${alumnos.length} alumnos registrados.`} />
        {alumnos.length > 0 ? (
          <Tarjeta className="divide-y divide-slate-100 overflow-hidden">
            {alumnos.map((alumno) => (
              <div key={alumno.id} className="flex items-center gap-3 p-4">
                <Avatar nombre={alumno.nombre} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{alumno.nombre}</p>
                  <p className="truncate text-xs text-slate-500">
                    {alumno.email}
                    {alumno.padreId && ` • Tutor: ${nombreDe(alumno.padreId)}`}
                  </p>
                </div>
                {alumno.curso && (
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">{alumno.curso}</span>
                )}
              </div>
            ))}
          </Tarjeta>
        ) : (
          <EstadoVacio icono="alumnos" titulo="Todavía no hay alumnos" descripcion="Cada profesor agrega a sus alumnos desde su curso, en la sección Cursos." />
        )}
      </>
    );
  }

  if (vista.tipo === "hijos") {
    return (
      <>
        <EncabezadoPagina titulo="Mis hijos" descripcion="Información de los alumnos a tu cargo. Solo lectura." />
        {vista.hijos.length > 0 ? (
          <div className="space-y-4">
            {vista.hijos.map((hijo) => (
              <Ficha key={hijo.id} usuario={hijo} padre={nombreDe(hijo.padreId)} curso={cursoDe(hijo)} />
            ))}
          </div>
        ) : (
          <EstadoVacio icono="alumnos" titulo="No hay alumnos vinculados" descripcion="Pedile a la escuela que vincule a tus hijos con tu cuenta." />
        )}
      </>
    );
  }

  return (
    <>
      <EncabezadoPagina titulo="Mi información" descripcion="Tus datos registrados en la escuela. Solo lectura." />
      <Ficha usuario={vista.yo} padre={nombreDe(vista.yo.padreId)} curso={cursoDe(vista.yo)} />
    </>
  );
}

function Avatar({ nombre }: { nombre: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold uppercase text-blue-900">
      {nombre.charAt(0)}
    </span>
  );
}

function Ficha({ usuario, padre, curso }: { usuario: Usuario; padre: string | null; curso?: Curso }) {
  const datos: [string, string | null][] = [
    ["Email", usuario.email],
    ["Rol", roles[usuario.rol]],
    ["DNI", usuario.dni],
    ["Curso", usuario.curso],
    ["Tutor/a", padre],
  ];

  return (
    <Tarjeta className="overflow-hidden">
      <div className="flex items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-950 p-5 text-white">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xl font-bold uppercase text-amber-300">
          {usuario.nombre.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{usuario.nombre}</p>
          {usuario.curso && <p className="text-sm text-blue-200">{usuario.curso}</p>}
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-4 p-5 text-sm sm:grid-cols-2">
        {datos
          .filter(([, valor]) => valor)
          .map(([titulo, valor]) => (
            <div key={titulo}>
              <dt className="text-slate-500">{titulo}</dt>
              <dd className="font-semibold text-slate-900">{valor}</dd>
            </div>
          ))}
      </dl>
      {curso && curso.docentes.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-700">Profesores de {curso.nombre}</p>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {curso.docentes.map((d) => (
              <li key={d.id} className="flex justify-between gap-3 py-1.5">
                <span className="text-slate-500">{d.materia}</span>
                <span className="text-right font-semibold text-slate-900">{d.profesorNombre}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        <Icono nombre="configuracion" className="h-4 w-4" />
        Si algún dato está mal, pedí a la escuela que lo corrija.
      </p>
    </Tarjeta>
  );
}
