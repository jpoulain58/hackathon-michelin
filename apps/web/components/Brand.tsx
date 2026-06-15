/** Lockup texte "MICHELIN Trust Wheels" (en attendant le logo vectoriel officiel). */
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span
        className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-michelin-blue"}`}
      >
        MICHELIN
      </span>
      <span className={`text-sm font-semibold ${light ? "text-michelin-yellow" : "text-michelin-navy"}`}>
        Trust Wheels
      </span>
    </span>
  );
}
