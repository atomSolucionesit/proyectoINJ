import { Suspense } from "react";
import { Header } from "@/components/sitio/Header";
import { Footer } from "@/components/sitio/Footer";

export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-amber-400 selection:text-blue-950">
      <Suspense fallback={<header className="h-24 bg-white border-b border-slate-200" />}>
        <Header />
      </Suspense>
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
