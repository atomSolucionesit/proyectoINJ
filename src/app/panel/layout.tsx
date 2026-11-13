import type { Metadata } from "next";
import { Suspense } from "react";
import { EsqueletoPanel, PanelShell } from "@/components/panel/PanelShell";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel" },
  robots: { index: false, follow: false },
};

// El panel se arma en el navegador (la sesión está en la pestaña y los datos vienen de la API): no se prerenderiza.
export const instant = false;

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return (
    <Suspense fallback={<EsqueletoPanel />}>
      <PanelShell>{children}</PanelShell>
    </Suspense>
  );
}
