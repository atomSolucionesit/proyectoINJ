import Link from "next/link";
import { siteConfig } from "@/config/site";
import { navegacionSitio } from "@/config/navegacion";

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-bold">
          {siteConfig.nombre}
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm">
          {navegacionSitio.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.titulo}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
