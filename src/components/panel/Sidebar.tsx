import Link from "next/link";
import { navegacionPanel } from "@/config/navegacion";

export function Sidebar() {
  return (
    <aside className="w-full border-b bg-slate-900 text-slate-100 md:w-60 md:border-b-0 md:border-r">
      <div className="px-4 py-4 text-lg font-bold">Panel de control</div>
      <nav className="flex flex-wrap gap-1 px-2 pb-4 md:flex-col">
        {navegacionPanel.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded px-3 py-2 text-sm hover:bg-slate-800"
          >
            {item.titulo}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
