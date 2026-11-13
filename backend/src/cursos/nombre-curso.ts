import type { Curso } from "../generated/prisma/client";

/** Ej. "3° Año A". */
export function nombreCurso(curso: Pick<Curso, "anio" | "division">) {
  return `${curso.anio}° Año ${curso.division}`;
}
