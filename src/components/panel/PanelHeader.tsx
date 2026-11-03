import Link from "next/link";

export function PanelHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <span className="text-sm text-slate-500">Gestión institucional</span>
      <Link href="/" className="text-sm hover:underline">
        Ver sitio
      </Link>
    </header>
  );
}
