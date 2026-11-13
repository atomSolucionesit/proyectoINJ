/**
 * Mini envoltorio de IndexedDB (la "base de datos" del navegador).
 * Se usa IndexedDB y no localStorage porque guarda archivos (Blob) y no tiene el límite de ~5 MB.
 */

const NOMBRE = "inj-mvp";
const VERSION = 1;

export type Tabla = "usuarios" | "archivos" | "reservas" | "blobs";

let conexion: Promise<IDBDatabase> | null = null;

function abrir() {
  conexion ??= new Promise((resolve, reject) => {
    const pedido = indexedDB.open(NOMBRE, VERSION);
    pedido.onupgradeneeded = () => {
      const base = pedido.result;
      for (const tabla of ["usuarios", "archivos", "reservas"] as const) {
        if (!base.objectStoreNames.contains(tabla)) base.createObjectStore(tabla, { keyPath: "id" });
      }
      // Los archivos en sí van aparte, guardados por el id del archivo.
      if (!base.objectStoreNames.contains("blobs")) base.createObjectStore("blobs");
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
  return conexion;
}

function promesa<T>(pedido: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function tabla(nombre: Tabla, modo: IDBTransactionMode) {
  return (await abrir()).transaction(nombre, modo).objectStore(nombre);
}

export async function todos<T>(nombre: Tabla): Promise<T[]> {
  return promesa((await tabla(nombre, "readonly")).getAll()) as Promise<T[]>;
}

export async function leer<T>(nombre: Tabla, id: string): Promise<T | undefined> {
  return promesa((await tabla(nombre, "readonly")).get(id)) as Promise<T | undefined>;
}

export async function guardar<T extends { id: string }>(nombre: Exclude<Tabla, "blobs">, valor: T) {
  await promesa((await tabla(nombre, "readwrite")).put(valor));
}

export async function guardarBlob(id: string, blob: Blob) {
  await promesa((await tabla("blobs", "readwrite")).put(blob, id));
}

export async function borrar(nombre: Tabla, id: string) {
  await promesa((await tabla(nombre, "readwrite")).delete(id));
}

export async function vaciar(nombre: Tabla) {
  await promesa((await tabla(nombre, "readwrite")).clear());
}
