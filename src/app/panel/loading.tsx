export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Cargando">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
    </div>
  );
}
