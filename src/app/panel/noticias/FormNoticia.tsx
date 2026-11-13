"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EstadoVacio } from "@/components/panel/ui";
import { Icono } from "@/components/panel/Icono";
import { categoriasNoticias, esImagenSubida, urlImagen } from "@/lib/contenido";
import { guardarNoticia, useAlmacen } from "@/lib/mvp/almacen";
import { avisar } from "@/lib/mvp/avisos";
import type { NoticiaPanel } from "@/lib/mvp/tipos";
import { formatearTamano } from "@/lib/utils";

const campo =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:py-2.5 sm:text-sm";

/** Igual que en el backend (noticias/imagenes-noticias.ts). */
const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;
const tiposImagen = ["image/jpeg", "image/png", "image/webp"];

/** Página de edición: busca la noticia por el id de la dirección. */
export function EditarNoticia() {
  const { id } = useParams<{ id: string }>();
  const noticia = useAlmacen().noticias.find((n) => n.id === id);
  if (!noticia) {
    return (
      <EstadoVacio
        icono="noticias"
        titulo="Noticia no encontrada"
        descripcion="Puede que la hayan borrado."
        accion={{ titulo: "Volver a noticias", href: "/panel/noticias" }}
      />
    );
  }
  return <FormNoticia noticia={noticia} />;
}

/** Sin `noticia`: crea una nueva. Con `noticia`: la edita. */
export function FormNoticia({ noticia }: { noticia?: NoticiaPanel }) {
  const router = useRouter();
  const [publicada, setPublicada] = useState(noticia?.publicada ?? true);
  const [resumen, setResumen] = useState(noticia?.resumen ?? "");
  /** `undefined`: se deja la que tenía. `null`: sin imagen. */
  const [imagenNueva, setImagenNueva] = useState<{ archivo: File; vista: string } | null | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imagenActual = imagenNueva === undefined ? (noticia?.imagen ?? null) : null;
  const vistaPrevia = imagenNueva ? imagenNueva.vista : imagenActual ? urlImagen(imagenActual) : null;

  function elegir(archivo: File | undefined) {
    setError(null);
    if (!archivo) return;
    if (!tiposImagen.includes(archivo.type)) {
      setError("La imagen tiene que ser JPG, PNG o WebP.");
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
      setError(`La imagen pesa ${formatearTamano(archivo.size)} y el máximo es ${formatearTamano(TAMANO_MAXIMO_IMAGEN)}. Probá con una más liviana.`);
      return;
    }
    if (imagenNueva) URL.revokeObjectURL(imagenNueva.vista);
    setImagenNueva({ archivo, vista: URL.createObjectURL(archivo) });
  }

  function quitarImagen() {
    if (imagenNueva) URL.revokeObjectURL(imagenNueva.vista);
    setImagenNueva(null);
  }

  async function enviar(formData: FormData) {
    setError(null);
    setGuardando(true);
    const resultado = await guardarNoticia(
      noticia?.id ?? null,
      {
        titulo: String(formData.get("titulo") ?? ""),
        categoria: String(formData.get("categoria") ?? ""),
        resumen,
        contenido: String(formData.get("contenido") ?? ""),
        publicada,
      },
      // Al editar sin tocar la imagen se deja la que tenía; al crear, "sin imagen" es simplemente no mandar nada.
      imagenNueva === null ? (noticia?.imagen ? null : undefined) : imagenNueva?.archivo,
    );
    if ("error" in resultado) {
      setError(resultado.error);
      setGuardando(false);
      return;
    }
    avisar(resultado.ok, "exito");
    router.push("/panel/noticias");
  }

  return (
    <form action={enviar} className="space-y-5">
      {/* Imagen */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <input
          type="file"
          id="imagen"
          accept={tiposImagen.join(",")}
          onChange={(e) => {
            elegir(e.target.files?.[0]);
            // Permite volver a elegir la misma imagen después de un error.
            e.target.value = "";
          }}
          className="sr-only"
        />
        {vistaPrevia ? (
          <div>
            <div className="relative h-48 w-full bg-slate-100 sm:h-64">
              <Image
                src={vistaPrevia}
                alt="Imagen de la noticia"
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                unoptimized={!imagenActual || esImagenSubida(imagenActual)}
                className="object-cover"
              />
            </div>
            <div className="flex justify-end gap-1 p-2">
              <label htmlFor="imagen" className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">
                Cambiar imagen
              </label>
              <button type="button" onClick={quitarImagen} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <label htmlFor="imagen" className="flex cursor-pointer flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
              <Icono nombre="subir" className="h-7 w-7" />
            </span>
            <span className="font-bold text-slate-900">Agregar una foto</span>
            <span className="text-xs text-slate-500">
              Opcional • JPG, PNG o WebP hasta {formatearTamano(TAMANO_MAXIMO_IMAGEN)}. Si no ponés una, se muestra el logo.
            </span>
          </label>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-6">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Título</span>
          <input
            name="titulo"
            defaultValue={noticia?.titulo}
            required
            minLength={5}
            maxLength={160}
            placeholder="Ej: Acto por el Día de la Tradición"
            className={campo}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Categoría</span>
          <input
            name="categoria"
            defaultValue={noticia?.categoria ?? "Institucional"}
            required
            maxLength={40}
            list="categorias-noticias"
            className={campo}
          />
          <datalist id="categorias-noticias">
            {categoriasNoticias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Resumen</span>
          <textarea
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            required
            rows={2}
            maxLength={400}
            placeholder="Una o dos oraciones: es lo que se ve en el listado de noticias."
            className={campo}
          />
          <span className="mt-1 block text-right text-xs text-slate-400">{resumen.length}/400</span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Texto de la noticia</span>
          <textarea
            name="contenido"
            defaultValue={noticia?.contenido}
            required
            rows={10}
            maxLength={20000}
            placeholder="Dejá una línea en blanco entre párrafos."
            className={campo}
          />
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3">
          <input
            type="checkbox"
            checked={publicada}
            onChange={(e) => setPublicada(e.target.checked)}
            className="mt-0.5 h-5 w-5 accent-blue-800"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-900">Publicar en el sitio</span>
            <span className="block text-xs text-slate-500">
              {publicada ? "Se ve en el inicio y en la sección Noticias." : "Queda como borrador: solo se ve acá en el panel."}
            </span>
          </span>
        </label>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/panel/noticias"
          className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:py-2.5"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-900 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 sm:py-2.5"
        >
          <Icono nombre="check" className="h-4 w-4" />
          {guardando ? "Guardando…" : publicada ? (noticia?.publicada ? "Guardar cambios" : "Publicar") : "Guardar borrador"}
        </button>
      </div>
    </form>
  );
}
