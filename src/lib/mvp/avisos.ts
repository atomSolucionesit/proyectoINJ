"use client";

import { useSyncExternalStore } from "react";

/** Avisos cortos que aparecen abajo de la pantalla y se van solos (en vez de las ventanitas `alert`). */
export type Aviso = { id: number; tipo: "error" | "exito"; texto: string };

const DURACION = 6000;

let avisos: Aviso[] = [];
let siguienteId = 1;
const oyentes = new Set<() => void>();

function publicar(nuevos: Aviso[]) {
  avisos = nuevos;
  oyentes.forEach((avisar) => avisar());
}

export function cerrarAviso(id: number) {
  publicar(avisos.filter((a) => a.id !== id));
}

export function avisar(texto: string, tipo: Aviso["tipo"] = "error") {
  // Si el mismo aviso ya está en pantalla no se repite (ej. varios fallos seguidos de conexión).
  if (avisos.some((a) => a.texto === texto)) return;
  const id = siguienteId++;
  publicar([...avisos.slice(-2), { id, tipo, texto }]);
  setTimeout(() => cerrarAviso(id), DURACION);
}

const sinAvisos: Aviso[] = [];

export function useAvisos() {
  return useSyncExternalStore(
    (avisar) => {
      oyentes.add(avisar);
      return () => oyentes.delete(avisar);
    },
    () => avisos,
    () => sinAvisos,
  );
}
