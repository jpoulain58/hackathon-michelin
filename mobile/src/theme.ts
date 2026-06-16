/**
 * Design tokens releves sur les maquettes Figma "Michelin Trust Wheels".
 * Charte : bleu Michelin (#27509B), jaune Michelin (#FFD100), fond blanc.
 */

export const colors = {
  // Marque
  navy: "#27509B", // bleu primaire (boutons, titres, onglet actif)
  navyDark: "#16213F", // bleu profond (bouton Garmin, cartes sombres)
  yellow: "#FFD100", // jaune Michelin (soulignement logo, "Club starter")
  strava: "#FC5200", // orange Strava

  // Statut / accents
  green: "#1E9E5A", // score, avis verifie, avantages
  greenSoft: "#E7F5EC",

  // Texte
  text: "#16213F", // titres
  textBody: "#374151", // paragraphes
  textMuted: "#6B7280", // sous-titres
  textFaint: "#9AA3B2", // meta discrete

  // Surfaces
  white: "#FFFFFF",
  bg: "#FFFFFF",
  bgSoft: "#F5F7FA",
  chipBg: "#EAF0FA",
  border: "#E6E9EF",
  dotEmpty: "#D7DCE5",

  // Pneu (donut)
  tyre: "#1A1A1A",
  overlay: "rgba(11,18,32,0.55)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const font = {
  title: 28,
  h2: 20,
  h3: 16,
  body: 14,
  small: 12,
  tiny: 11,
} as const;

export const shadow = {
  card: {
    shadowColor: "#0B1220",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
