import { siteConfig } from "@/config/site";

export default function InicioPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Bienvenidos a {siteConfig.nombre}</h1>
      <p className="mt-2 text-slate-600">
        Página principal: destacados, últimas noticias y próximos eventos.
      </p>
    </section>
  );
}
