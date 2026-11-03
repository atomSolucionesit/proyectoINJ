import { Header } from "@/components/sitio/Header";
import { Footer } from "@/components/sitio/Footer";

export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
