/* eslint-disable @next/next/no-img-element */
/** Lockup co-marque : logo officiel Michelin + nom du produit. */
export function Brand() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/michelin-logo.jpg" alt="Michelin" className="h-10 w-auto" />
      <span className="border-l border-michelin-gray-line pl-2.5 text-sm font-semibold text-michelin-navy">
        Trust Wheels
      </span>
    </span>
  );
}
