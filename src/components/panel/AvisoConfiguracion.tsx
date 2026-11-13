import type { ProblemaDb } from "@/lib/db";
import { Tarjeta } from "./ui";
import { Icono } from "./Icono";

const Codigo = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-amber-100 px-1">{children}</code>
);

/** Se muestra cuando la base de datos todavía no está configurada o no responde. */
export function AvisoConfiguracion({ problema }: { problema: ProblemaDb }) {
  return (
    <Tarjeta className="border-amber-200 bg-amber-50 p-5">
      <div className="flex gap-3">
        <Icono nombre="configuracion" className="mt-0.5 text-amber-700" />
        <div className="text-sm text-amber-900">
          {problema === "sin-configurar" ? (
            <>
              <p className="font-bold">Falta conectar la base de datos</p>
              <p className="mt-1">
                Esta sección necesita una base de datos. Completá <Codigo>DATABASE_URL</Codigo> en <Codigo>.env.local</Codigo>, corré{" "}
                <Codigo>npm run db:setup</Codigo> y reiniciá el servidor.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold">No se pudo conectar con la base de datos</p>
              <p className="mt-1">
                Revisá que <Codigo>DATABASE_URL</Codigo> sea correcta y que hayas corrido <Codigo>npm run db:setup</Codigo> para crear
                las tablas. El detalle del error está en la terminal donde corre <Codigo>npm run dev</Codigo>.
              </p>
            </>
          )}
        </div>
      </div>
    </Tarjeta>
  );
}
