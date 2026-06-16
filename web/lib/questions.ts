export type QuizPhase = "quiz" | "loading" | "results";
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
      { id: "route", label: "Vélo de route", photo: "/photos/bike-road.jpg" },
      { id: "gravel", label: "Gravel bike", photo: "/photos/bike-gravel.jpg" },
      { id: "vtt", label: "VTT", photo: "/photos/trail.jpg" },
      { id: "urbain", label: "Vélo urbain / Trekking", photo: "/photos/city-bike.jpg" },
    ],
  },
  {
    id: 2,
    question: "Tu roules plutôt pour quoi ?",
    description:
      "Enchaîner les kilomètres entre amis, viser le chrono, ou juste aller au boulot sans crevaison ? Ton objectif change tout au pneu dont tu as besoin.",
    optionsByBikeType: {
      route: [
        { id: "competition", label: "La compétition", photo: "/photos/peloton.jpg" },
        { id: "endurance", label: "Les longues sorties", photo: "/photos/hero-road.jpg" },
        { id: "loisir", label: "La balade et le plaisir", photo: "/photos/community-duo.jpg" },
        { id: "cyclocross", label: "Le cyclocross", photo: "/photos/trail.jpg" },
      ],
      gravel: [
        { id: "gravel_versatile", label: "L'aventure et l'exploration", photo: "/photos/road-forest.jpg" },
        { id: "gravel_speed", label: "La performance sur pistes", photo: "/photos/bike-gravel.jpg" },
        { id: "bikepacking", label: "Le bikepacking / longue distance", photo: "/photos/community-duo.jpg" },
      ],
      vtt: [
        { id: "xc", label: "Le cross-country (XC)", photo: "/photos/trail.jpg" },
        { id: "trail", label: "Le trail / all-mountain", photo: "/photos/trail.jpg" },
        { id: "enduro", label: "L'enduro", photo: "/photos/trail.jpg" },
        { id: "dh", label: "La descente (DH)", photo: "/photos/trail.jpg" },
      ],
      urbain: [
        { id: "quotidien", label: "Le quotidien", photo: "/photos/city-rider.jpg" },
        { id: "loisir", label: "La balade et le plaisir", photo: "/photos/city-bike.jpg" },
      ],
    },
  },
  {
    id: 3,
    question: "Tu roules sur quel type de chemin ?",
    description:
      "La route lisse du dimanche, les chemins de terre du week-end, ou les deux ? Le terrain, c'est ce qui détermine la forme du pneu et son accroche.",
    options: [
      { id: "asphalte", label: "Asphalte", photo: "/photos/road-sunny.jpg" },
      { id: "gravier", label: "Gravier / pistes", photo: "/photos/bike-gravel.jpg" },
      { id: "foret", label: "Chemins forestiers", photo: "/photos/road-forest.jpg" },
      { id: "singletrack", label: "Sentiers techniques", photo: "/photos/trail.jpg" },
      { id: "descente", label: "Descentes engagées", photo: "/photos/trail.jpg" },
    ],
  },
  {
    id: 4,
    question: "Tu sors même quand il pleut ?",
    description:
      "Certains pneus sont taillés pour le beau temps, d'autres pour tenir en toute saison. Dis-nous dans quelles conditions tu roules le plus souvent.",
    options: [
      { id: "sec", label: "Surtout par temps sec", photo: "/photos/road-sunny.jpg" },
      { id: "toutes_saisons", label: "Par tous les temps", photo: "/photos/community-duo.jpg" },
      { id: "pluie", label: "Souvent sous la pluie", photo: "/photos/rain-cycling.jpg" },
    ],
  },
  {
    id: 5,
    question: "Qu'est-ce qui compte le plus pour toi ?",
    description:
      "On ne peut pas tout avoir dans un seul pneu. Qu'est-ce que tu ne veux surtout pas sacrifier ?",
    options: [
      { id: "vitesse", label: "Aller vite", photo: "/photos/peloton.jpg" },
      { id: "anti_crevaison", label: "Ne pas crever", photo: "/photos/city-rider.jpg" },
      { id: "grip", label: "Accrocher dans les virages", photo: "/photos/trail.jpg" },
      { id: "longevite", label: "Rouler longtemps", photo: "/photos/road-forest.jpg" },
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
