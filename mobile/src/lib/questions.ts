export type Answers = Record<number, string>;

export interface QuestionOption {
  id: string;
  label: string;
  photo?: string;
  gamme?: string;
}

export interface Question {
  id: number;
  question: string;
  description: string;
  options?: QuestionOption[];
  optionsByBikeType?: Record<string, QuestionOption[]>;
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Quel type de vélo as-tu ?",
    description:
      "Pas tous les pneus s'adaptent à tous les vélos. Dis-nous quel est le tien pour qu'on te montre uniquement ce qui monte dessus.",
    options: [
      { id: "route", label: "Vélo de route", photo: "bike-road" },
      { id: "gravel", label: "Gravel bike", photo: "bike-gravel" },
      { id: "vtt", label: "VTT", photo: "trail" },
      { id: "urbain", label: "Vélo urbain / Trekking", photo: "city-bike" },
    ],
  },
  {
    id: 2,
    question: "Tu roules plutôt pour quoi ?",
    description:
      "Enchaîner les kilomètres entre amis, viser le chrono, ou juste aller au boulot sans crevaison ? Ton objectif change tout au pneu dont tu as besoin.",
    optionsByBikeType: {
      route: [
        { id: "competition", label: "La compétition", photo: "peloton" },
        { id: "endurance", label: "Les longues sorties", photo: "hero-road" },
        { id: "loisir", label: "La balade et le plaisir", photo: "community-duo" },
        { id: "cyclocross", label: "Le cyclocross", photo: "trail" },
      ],
      gravel: [
        { id: "gravel_versatile", label: "L'aventure et l'exploration", photo: "road-forest" },
        { id: "gravel_speed", label: "La performance sur pistes", photo: "bike-gravel" },
        { id: "bikepacking", label: "Le bikepacking / longue distance", photo: "community-duo" },
      ],
      vtt: [
        { id: "xc", label: "Le cross-country (XC)", photo: "trail" },
        { id: "trail", label: "Le trail / all-mountain", photo: "trail" },
        { id: "enduro", label: "L'enduro", photo: "trail" },
        { id: "dh", label: "La descente (DH)", photo: "trail" },
      ],
      urbain: [
        { id: "quotidien", label: "Le quotidien", photo: "city-rider" },
        { id: "loisir", label: "La balade et le plaisir", photo: "city-bike" },
      ],
    },
  },
  {
    id: 3,
    question: "Tu roules sur quel type de chemin ?",
    description:
      "La route lisse du dimanche, les chemins de terre du week-end, ou les deux ? Le terrain, c'est ce qui détermine la forme du pneu et son accroche.",
    options: [
      { id: "asphalte", label: "Asphalte", photo: "road-sunny" },
      { id: "gravier", label: "Gravier / pistes", photo: "bike-gravel" },
      { id: "foret", label: "Chemins forestiers", photo: "road-forest" },
      { id: "singletrack", label: "Sentiers techniques", photo: "trail" },
      { id: "descente", label: "Descentes engagées", photo: "trail" },
    ],
  },
  {
    id: 4,
    question: "Tu sors même quand il pleut ?",
    description:
      "Certains pneus sont taillés pour le beau temps, d'autres pour tenir en toute saison. Dis-nous dans quelles conditions tu roules le plus souvent.",
    options: [
      { id: "sec", label: "Surtout par temps sec", photo: "road-sunny" },
      { id: "toutes_saisons", label: "Par tous les temps", photo: "community-duo" },
      { id: "pluie", label: "Souvent sous la pluie", photo: "rain-cycling" },
    ],
  },
  {
    id: 5,
    question: "Qu'est-ce qui compte le plus pour toi ?",
    description:
      "On ne peut pas tout avoir dans un seul pneu. Qu'est-ce que tu ne veux surtout pas sacrifier ?",
    options: [
      { id: "vitesse", label: "Aller vite", photo: "peloton" },
      { id: "anti_crevaison", label: "Ne pas crever", photo: "city-rider" },
      { id: "grip", label: "Accrocher dans les virages", photo: "trail" },
      { id: "longevite", label: "Rouler longtemps", photo: "road-forest" },
    ],
  },
  {
    id: 6,
    question: "Tu as quel budget par pneu ?",
    description:
      "Un bon pneu n'a pas forcément besoin d'être hors de prix. On a des options pour tous les budgets — dis-nous où tu te situes.",
    options: [
      { id: "access", label: "Moins de 30 €", gamme: "Access" },
      { id: "performance", label: "30 – 60 €", gamme: "Performance" },
      { id: "competition", label: "60 – 90 €", gamme: "Competition" },
      { id: "racing", label: "+ de 90 €", gamme: "Racing" },
    ],
  },
  {
    id: 7,
    question: "Avec ou sans chambre à air ?",
    description:
      "Si tu ne sais pas ce qu'est le tubeless, reste sur chambre à air — c'est plus simple à gérer. Si tu veux crevaison zéro et plus de confort, le tubeless vaut le coup.",
    options: [
      { id: "chambre_air", label: "Avec chambre à air" },
      { id: "tubeless", label: "Tubeless" },
      { id: "unknown", label: "Je ne sais pas encore" },
    ],
  },
];

const DISCIPLINE_MAP: Record<string, string> = {
  route: "road",
  gravel: "gravel",
  vtt: "mtb",
  urbain: "city",
};

const PRIORITY_MAP: Record<string, string> = {
  vitesse: "speed",
  anti_crevaison: "puncture",
  grip: "grip",
  longevite: "durability",
};

export function answersToApiParams(answers: Answers) {
  return {
    discipline: DISCIPLINE_MAP[answers[1]] ?? "road",
    priority: PRIORITY_MAP[answers[5]] ?? "speed",
    ebike: false,
    limit: 5,
  };
}

export function getOptions(q: Question, answers: Answers): QuestionOption[] {
  if (q.options) return q.options;
  if (q.optionsByBikeType) {
    const bikeType = answers[1] ?? "route";
    return q.optionsByBikeType[bikeType] ?? q.optionsByBikeType["route"] ?? [];
  }
  return [];
}
