import type { EstadoReserva as Estado } from "@/lib/mvp/tipos";
import { cn } from "@/lib/utils";

export const estadosReserva: Record<Estado, { titulo: string; descripcion: string; clases: string }> = {
  pendiente_pago: {
    titulo: "Pendiente de pago",
    descripcion: "Pagala para que la biblioteca empiece a imprimirla.",
    clases: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  pagada: {
    titulo: "Pagada",
    descripcion: "Pago confirmado. La biblioteca la está preparando.",
    clases: "bg-blue-50 text-blue-800 ring-blue-200",
  },
  lista: {
    titulo: "Lista para retirar",
    descripcion: "Ya está impresa. Retirala diciendo tu nombre y curso.",
    clases: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  retirada: {
    titulo: "Retirada",
    descripcion: "La impresión ya fue entregada.",
    clases: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  cancelada: {
    titulo: "Cancelada",
    descripcion: "Esta reserva fue cancelada.",
    clases: "bg-red-50 text-red-700 ring-red-200",
  },
};

export function EstadoReserva({ estado, className }: { estado: Estado; className?: string }) {
  const { titulo, clases } = estadosReserva[estado];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", clases, className)}>
      {titulo}
    </span>
  );
}
