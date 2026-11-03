export default async function EditarNoticiaPage({ params }: PageProps<"/panel/noticias/[id]">) {
  const { id } = await params;

  return (
    <section>
      <h1 className="text-2xl font-bold">Editar noticia #{id}</h1>
      <p className="mt-2 text-slate-600">Formulario de edición de noticia.</p>
    </section>
  );
}
