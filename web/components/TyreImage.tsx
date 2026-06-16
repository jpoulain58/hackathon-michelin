export type TyreKind = "road" | "gravel" | "mtb" | "city";

export const KIND_LABEL: Record<TyreKind, string> = {
  road: "Route",
  gravel: "Gravel",
  mtb: "VTT",
  city: "Ville",
};

/** Deduit le type de pneu d'un produit du catalogue. */
export function tyreKind(p: { cycleType?: string; use?: string[]; terrainTypes?: string[] }): TyreKind {
  const cycle = (p.cycleType || "").toUpperCase();
  const blob = `${(p.use || []).join(" ")} ${(p.terrainTypes || []).join(" ")}`.toUpperCase();
  if (cycle === "MTB") return "mtb";
  if (/GRAVEL|CYCLOCROSS|ADVENTURE|OFFROAD/.test(blob)) return "gravel";
  if (cycle === "CITY") return "city";
  return "road";
}

/** Deduit le type depuis un libelle (nom de pneu ou terrain). */
export function kindFromText(text: string): TyreKind {
  const t = text.toUpperCase();
  if (/VTT|MTB|FORCE|WILD|ENDURO|AM\b/.test(t)) return "mtb";
  if (/GRAVEL|ADVENTURE|CYCLOCROSS/.test(t)) return "gravel";
  if (/VILLE|CITY|URBAN/.test(t)) return "city";
  return "road";
}

const CX = 64;
const CY = 64;

function rotated(n: number) {
  return Array.from({ length: n }, (_, i) => (i * 360) / n);
}

/**
 * Illustration de pneu (vue de face), a la charte Michelin. La bande de
 * roulement varie selon la discipline : crampons (VTT), petits pavés (gravel),
 * gorges fines (route), pointillé (ville).
 */
export function TyreImage({ kind, className }: { kind: TyreKind; className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} role="img" aria-label={`Pneu ${KIND_LABEL[kind]}`}>
      <defs>
        <radialGradient id={`rub-${kind}`} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#3a3d42" />
          <stop offset="70%" stopColor="#17181b" />
          <stop offset="100%" stopColor="#050506" />
        </radialGradient>
      </defs>

      {/* Pneu (caoutchouc) */}
      <circle cx={CX} cy={CY} r={58} fill={`url(#rub-${kind})`} />
      {/* Bande de roulement selon discipline */}
      {kind === "mtb" &&
        rotated(16).map((a) => (
          <rect key={a} x={CX - 5} y={CY - 60} width={10} height={15} rx={2} fill="#0c0c0d" transform={`rotate(${a} ${CX} ${CY})`} />
        ))}
      {kind === "gravel" &&
        rotated(30).map((a) => (
          <rect key={a} x={CX - 2} y={CY - 59} width={4} height={10} rx={1.5} fill="#0e0e10" transform={`rotate(${a} ${CX} ${CY})`} />
        ))}
      {kind === "road" && (
        <>
          <circle cx={CX} cy={CY} r={52} fill="none" stroke="#34373c" strokeWidth={1.4} />
          <circle cx={CX} cy={CY} r={46} fill="none" stroke="#34373c" strokeWidth={1.4} />
        </>
      )}
      {kind === "city" && (
        <circle cx={CX} cy={CY} r={51} fill="none" stroke="#3a3d42" strokeWidth={3} strokeDasharray="1.5 7" strokeLinecap="round" />
      )}

      {/* Accent jaune Michelin */}
      <path d="M 30 22 A 58 58 0 0 1 98 22" fill="none" stroke="#FCE500" strokeWidth={4} strokeLinecap="round" opacity={0.95} />

      {/* Flanc + jante */}
      <circle cx={CX} cy={CY} r={40} fill="#ffffff" />
      <circle cx={CX} cy={CY} r={38} fill="none" stroke="#27509B" strokeWidth={2.5} />
      {/* Rayons */}
      {rotated(6).map((a) => (
        <line key={a} x1={CX} y1={CY - 12} x2={CX} y2={CY - 35} stroke="#C9D2E3" strokeWidth={2} transform={`rotate(${a} ${CX} ${CY})`} />
      ))}
      {/* Moyeu */}
      <circle cx={CX} cy={CY} r={10} fill="#E5E5E5" stroke="#27509B" strokeWidth={1.5} />
    </svg>
  );
}
