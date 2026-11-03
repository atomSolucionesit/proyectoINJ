import type { Metadata } from "next";

export const metadata: Metadata = { title: "Institucional" };

export default function InstitucionalPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Institucional</h1>
      <p className="mt-2 text-slate-600">Historia, misión, visión y autoridades.</p>
    </section>
  );
}
