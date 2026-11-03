import Link from "next/link";
import Image from "next/image";

export default async function NoticiaPage({ params }: PageProps<"/noticias/[slug]">) {
  const { slug } = await params;
  const tituloFormateado = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-900">Inicio</Link>
          <span>/</span>
          <Link href="/noticias" className="hover:text-blue-900">Noticias</Link>
          <span>/</span>
          <span className="text-slate-800 truncate">{tituloFormateado}</span>
        </nav>

        {/* Encabezado del artículo */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 uppercase">
              Comunicado Institucional
            </span>
            <span className="text-xs text-slate-500">Publicado recientemente</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-blue-950 tracking-tight leading-tight">
            {tituloFormateado}
          </h1>
          <p className="text-base text-slate-600 font-medium">
            Información oficial y cobertura de actividades del Instituto Niño Jesús I-9 de Paso de los Libres, Corrientes.
          </p>
        </header>

        {/* Imagen destacada */}
        <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden shadow-lg bg-slate-900">
          <Image
            src="/images/hero-edificio.jpg"
            alt={tituloFormateado}
            fill
            className="object-cover"
          />
        </div>

        {/* Cuerpo del artículo */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
          <p>
            Desde el <strong>Instituto Niño Jesús I-9</strong> renovamos nuestro compromiso cotidiano con la excelencia educativa, la contención socioafectiva y los valores formativos en nuestra ciudad de Paso de los Libres.
          </p>
          <p>
            Cada una de las actividades pedagógicas, pastorales y comunitarias impulsadas en los niveles Inicial, Primario y Secundario persigue como fin prioritario el pleno desarrollo de las capacidades de nuestros alumnos, estimulando el pensamiento crítico, la curiosidad científica, la empatía y la solidaridad.
          </p>
          <div className="rounded-2xl bg-slate-50 border-l-4 border-amber-400 p-4 italic text-slate-600 text-sm">
            &ldquo;La educación con valores es el pilar que sostiene a las familias y construye el futuro de nuestra sociedad en Paso de los Libres.&rdquo;
          </div>
          <p>
            Invitamos a toda la comunidad escolar a mantenerse en contacto a través de nuestros canales oficiales, secretaría y el portal institucional para recibir notificaciones periódicas, circulares y fechas de interés.
          </p>
        </div>

        {/* Botón Volver */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-200">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            ← Volver al listado de noticias
          </Link>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-800 transition-colors"
          >
            Consultar a la escuela
          </Link>
        </div>

      </div>
    </div>
  );
}
