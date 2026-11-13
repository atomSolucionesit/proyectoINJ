"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/** Botón de envío que pide confirmación antes de una acción que no se puede deshacer. */
export function BotonConfirmar({
  mensaje,
  children,
  className,
  "aria-label": ariaLabel,
}: {
  mensaje: string;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(mensaje)) e.preventDefault();
      }}
      className={cn("disabled:opacity-50", className)}
    >
      {children}
    </button>
  );
}

/** Botón de envío que se deshabilita mientras la acción está en curso. */
export function BotonEnviar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn("disabled:cursor-wait disabled:opacity-60", className)}>
      {children}
    </button>
  );
}
