import type { Metadata } from "next";
import { Sidebar } from "@/components/panel/Sidebar";
import { PanelHeader } from "@/components/panel/PanelHeader";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <PanelHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
