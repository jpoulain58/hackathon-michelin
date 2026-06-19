export type Evenement = {
  id: string;
  kind: "strava" | "concours";
  badge: string;
  title: string;
  summary: string;
  reward: string;
  dateRange: string;
  description: string;
  rules: string[];
  member:
    | { type: "leaderboard"; entries: { rank: number; name: string; km: number }[] }
    | { type: "tickets"; ticketsIssued: number; note: string };
};

export const EVENEMENTS: Evenement[] = [
  {
    id: "challenge-strava",
    kind: "strava",
    badge: "Challenge Strava",
    title: "Challenge des Kilometres de Juin",
    summary:
      "Roule un maximum de km en juin et grimpe dans le classement des membres du Club.",
    reward: "1 an de pneus Michelin offerts",
    dateRange: "Du 1er au 30 juin 2026",
    description:
      "Connecte ton compte Strava, roule comme tu le fais deja, et chaque kilometre est comptabilise automatiquement dans le classement du Club. A la fin du mois, le rider en tete du classement remporte 1 an de pneus Michelin offerts (4 pneus au choix, livres chez toi).",
    rules: [
      "Ouvert a tous les membres du Club Trust Wheels avec un compte Strava connecte.",
      "Seules les sorties velo enregistrees entre le 1er et le 30 juin 2026 comptent.",
      "Le classement est mis a jour automatiquement depuis ton historique Strava.",
      "Le gagnant est contacte par email dans les 7 jours suivant la fin du challenge.",
    ],
    member: {
      type: "leaderboard",
      entries: [
        { rank: 1, name: "Camille R.", km: 482 },
        { rank: 2, name: "Thomas L.", km: 451 },
        { rank: 3, name: "Sarah B.", km: 397 },
        { rank: 4, name: "Yanis M.", km: 360 },
        { rank: 5, name: "Julie P.", km: 312 },
        { rank: 6, name: "Hugo D.", km: 288 },
      ],
    },
  },
  {
    id: "jeu-concours",
    kind: "concours",
    badge: "Jeu concours",
    title: "Grand Tirage Trust Wheels",
    summary:
      "Participe gratuitement et tente de gagner une cagnotte de 500 € a depenser comme tu veux.",
    reward: "500 € a gagner",
    dateRange: "Du 1er au 30 juin 2026",
    description:
      "Chaque membre du Club Trust Wheels participe automatiquement au tirage au sort mensuel. Plus tu es actif sur la plateforme (avis publies, pneus suivis dans ton Garage, sorties enregistrees), plus tu recois de tickets de participation. Un tirage au sort designe un gagnant en fin de mois, qui remporte une cagnotte de 500 €.",
    rules: [
      "Ouvert a tous les membres du Club Trust Wheels, sans obligation d'achat.",
      "1 ticket de participation offert a l'inscription, des tickets bonus pour chaque action sur la plateforme.",
      "Le tirage au sort a lieu le dernier jour du mois.",
      "Le gagnant est contacte par email et dispose de 14 jours pour reclamer son lot.",
    ],
    member: {
      type: "tickets",
      ticketsIssued: 1248,
      note: "Tu participes automatiquement avec tes tickets en cours. Continue a etre actif sur la plateforme pour en gagner davantage.",
    },
  },
];

export function getEvenement(id: string): Evenement | undefined {
  return EVENEMENTS.find((e) => e.id === id);
}
