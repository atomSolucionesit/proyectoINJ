"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { puede } from "@/lib/auth/permisos";
import { subirArchivo, useUsuario } from "@/lib/mvp/almacen";
import { aceptarArchivos, bibliotecaConfig, errorTipoArchivo, tipoDeArchivo } from "@/config/biblioteca";
import { Icono } from "@/components/panel/Icono";
import { cn, formatearTamano } from "@/lib/utils";

const campo =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:py-2.5 sm:text-sm";

/** Profesores eligen si queda en la biblioteca y por cuánto tiempo; el resto solo sube para imprimir. */
export function SubirArchivoForm() {
  const router = useRouter();
  const puedePublicar = puede(useUsuario().rol, "biblioteca:publicar");
  const [destino, setDestino] = useState<"biblioteca" | "impresion">(puedePublicar ? "biblioteca" : "impresion");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function elegir(file: File | undefined) {
    setError(null);
    if (!file) return;
    // Windows a veces no informa el tipo (ej. Word sin Office instalado): se reconoce por la extensión.
    if (!tipoDeArchivo(file.name, file.type)) {
      setError(errorTipoArchivo(file.name));
      return;
    }
    if (file.size === 0) {
      setError("El archivo está vacío. Revisá que se haya guardado bien y elegilo de nuevo.");
      return;
    }
    if (file.size > bibliotecaConfig.tamanoMaximo) {
      setError(
        `El archivo pesa ${formatearTamano(file.size)} y el máximo es ${formatearTamano(bibliotecaConfig.tamanoMaximo)}. Probá comprimirlo o dividirlo.`,
      );
      return;
    }
    setArchivo(file);
    setNombre((actual) => actual || file.name.replace(/\.[^.]+$/, ""));
  }

  async function enviar(formData: FormData) {
    if (!archivo) {
      setError("Elegí un archivo para subir.");
      return;
    }
    setError(null);
    setSubiendo(true);
    const resultado = await subirArchivo(archivo, {
      nombre: String(formData.get("nombre") ?? ""),
      descripcion: String(formData.get("descripcion") ?? ""),
      categoria: String(formData.get("categoria") ?? "otros"),
      destino,
      duracion: String(formData.get("duracion") ?? ""),
    });
    if ("error" in resultado) {
      setError(resultado.error);
      setSubiendo(false);
      return;
    }
    router.push(resultado.visibilidad === "biblioteca" ? "/panel/biblioteca" : `/panel/biblioteca/imprimir/${resultado.id}`);
  }

  return (
    <form action={enviar} className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          elegir(e.dataTransfer.files[0]);
        }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed bg-white p-6 text-center transition-colors",
          arrastrando ? "border-blue-500 bg-blue-50" : "border-slate-300",
        )}
      >
        <input
          type="file"
          accept={aceptarArchivos}
          onChange={(e) => {
            elegir(e.target.files?.[0]);
            // Permite volver a elegir el mismo archivo después de un error.
            e.target.value = "";
          }}
          className="sr-only"
          id="archivo"
        />
        {archivo ? (
          <div className="flex items-center gap-3 text-left">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
              <Icono nombre="archivo" className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{archivo.name}</p>
              <p className="text-xs text-slate-500">{formatearTamano(archivo.size)}</p>
            </div>
            {!subiendo && (
              <label htmlFor="archivo" className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">
                Cambiar
              </label>
            )}
          </div>
        ) : (
          <label htmlFor="archivo" className="flex cursor-pointer flex-col items-center gap-3 py-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
              <Icono nombre="subir" className="h-7 w-7" />
            </span>
            <span className="font-bold text-slate-900">Tocá para elegir un archivo</span>
            <span className="text-xs text-slate-500">
              <span className="hidden sm:inline">o arrastralo acá • </span>PDF, Word, PowerPoint, Excel o imágenes • hasta{" "}
              {formatearTamano(bibliotecaConfig.tamanoMaximo)}
            </span>
          </label>
        )}

      </div>

      {puedePublicar ? (
        <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <legend className="sr-only">¿Para qué es el archivo?</legend>
          {(
            [
              ["biblioteca", "Publicar en la biblioteca", "Lo ven todos y lo pueden imprimir."],
              ["impresion", "Solo para imprimir", `Solo vos y la biblioteca. Se borra a los ${bibliotecaConfig.diasArchivoImpresion} días.`],
            ] as const
          ).map(([valor, titulo, texto]) => (
            <label
              key={valor}
              className="cursor-pointer rounded-2xl border-2 border-slate-200 bg-white p-4 has-checked:border-blue-600 has-checked:bg-blue-50"
            >
              <input type="radio" name="destino" value={valor} checked={destino === valor} onChange={() => setDestino(valor)} className="sr-only" />
              <span className="block font-bold text-slate-900">{titulo}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{texto}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="flex gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
          <Icono nombre="imprimir" className="mt-0.5" />
          <span>
            El archivo es <strong>solo para imprimir</strong>: no queda publicado en la biblioteca, lo ven vos y la bibliotecaria, y se
            borra solo a los {bibliotecaConfig.diasArchivoImpresion} días.
          </span>
        </p>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-6">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Nombre</span>
          <input
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            maxLength={200}
            placeholder="Ej: Apunte de Historia - Unidad 3"
            className={campo}
          />
        </label>

        {destino === "biblioteca" && (
          <>
            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">¿Cuánto tiempo queda publicado?</legend>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {bibliotecaConfig.duraciones.map((d) => (
                  <label
                    key={d.nombre}
                    className="cursor-pointer rounded-xl border border-slate-200 px-2 py-2.5 text-center text-sm font-semibold text-slate-600 has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-900"
                  >
                    <input type="radio" name="duracion" value={d.dias ?? ""} defaultChecked={d.dias === null} className="sr-only" />
                    {d.nombre}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">Pasado ese tiempo el archivo se borra automáticamente.</p>
            </fieldset>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Categoría</span>
              <select name="categoria" defaultValue="apuntes" className={campo}>
                {bibliotecaConfig.categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Descripción <span className="font-normal text-slate-400">(opcional)</span>
              </span>
              <textarea name="descripcion" rows={3} maxLength={1000} className={campo} />
            </label>
          </>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/panel/biblioteca"
          className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:py-2.5"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={subiendo}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 sm:py-2.5"
        >
          <Icono nombre="subir" className="h-4 w-4" />
          {subiendo ? "Subiendo…" : destino === "impresion" ? "Subir y elegir copias" : "Publicar archivo"}
        </button>
      </div>
    </form>
  );
}
