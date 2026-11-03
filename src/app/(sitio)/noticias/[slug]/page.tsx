export default async function NoticiaPage({ params }: PageProps<"/noticias/[slug]">) {
  const { slug } = await params;

  return (
    <article>
      <h1 className="text-2xl font-bold">Noticia: {slug}</h1>
      <p className="mt-2 text-slate-600">Detalle de la noticia.</p>
    </article>
  );
}
