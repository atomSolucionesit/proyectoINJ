import Link from "next/link";
import { cacheLife } from "next/cache";
import { siteConfig } from "@/config/site";

async function anioActual() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const anio = await anioActual();

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-6 text-sm">
        <p>
          © {anio} {siteConfig.nombre}
        </p>
        <Link href="/login" className="hover:underline">
          Acceso al panel
        </Link>
      </div>
    </footer>
  );
}
