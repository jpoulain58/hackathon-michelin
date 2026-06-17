/**
 * Données de démonstration calquées sur les maquettes Figma.
 * Couche isolée : à remplacer par des appels à l'API NestJS (@mtw/api)
 * — endpoints `tyres/recommend` et `community` — sans toucher aux écrans.
 */
import type {
  ClubPlan,
  CompareColumn,
  NewsItem,
  Review,
  Ride,
  Tyre,
} from "./types";
import { colors } from "./theme";

const mapImage = (lat: number, lon: number, zoom = 12, w = 640, h = 360) =>
  `https://maps.wikimedia.org/img/osm-intl,${zoom},${lat},${lon},${w}x${h}@2x.png`;

export const heroImage =
  "https://images.pexels.com/photos/10619491/pexels-photo-10619491.jpeg?auto=compress&cs=tinysrgb&w=1200";

export const ridesAnalysed = "1 240";

export const tyres: Tyre[] = [
  {
    id: "power-cup-tlr",
    name: "Michelin Power Cup TLR Competition Line",
    weight: "205 g",
    dimensions: "8 dimensions disponibles",
    matchScore: 94,
    bestChoice: true,
    categories: ["Route", "Performance"],
  },
  {
    id: "power-road-tlr",
    name: "Michelin Power Road TLR",
    weight: "215 g",
    dimensions: "6 dimensions disponibles",
    matchScore: 89,
    categories: ["Route", "Performance"],
  },
  {
    id: "power-gravel",
    name: "Michelin Power Gravel",
    weight: "320 g",
    dimensions: "5 dimensions disponibles",
    matchScore: 85,
    categories: ["Montagne"],
  },
  {
    id: "lithion-4",
    name: "Michelin Lithion 4",
    weight: "260 g",
    dimensions: "7 dimensions disponibles",
    matchScore: 81,
    categories: ["Route"],
  },
  {
    id: "dynamic-sport",
    name: "Michelin Dynamic Sport",
    weight: "290 g",
    dimensions: "4 dimensions disponibles",
    matchScore: 76,
    categories: ["Route"],
  },
];

export const compareColumns: CompareColumn[] = [
  {
    id: "power-cup",
    label: "Power Cup",
    tag: "TON MATCH",
    accent: colors.navy,
    rendement: 5,
    adherence: 5,
    antiCrevaison: 4,
    poids: "205 g",
    prix: "64,90 €",
    avis: "1 240",
  },
  {
    id: "gp5000",
    label: "GP5000",
    accent: colors.strava,
    rendement: 4,
    adherence: 4,
    antiCrevaison: 4,
    poids: "215 g",
    prix: "69,90 €",
    avis: "320",
  },
  {
    id: "pro-one",
    label: "Pro One",
    accent: colors.green,
    rendement: 4,
    adherence: 5,
    antiCrevaison: 5,
    poids: "240 g",
    prix: "59,90 €",
    avis: "210",
  },
];

export const compareRows: {
  key: keyof Pick<
    CompareColumn,
    "rendement" | "adherence" | "antiCrevaison" | "poids" | "prix" | "avis"
  >;
  label: string;
  kind: "dots" | "text";
}[] = [
  { key: "rendement", label: "Rendement", kind: "dots" },
  { key: "adherence", label: "Adhérence", kind: "dots" },
  { key: "antiCrevaison", label: "Anti-crevaison", kind: "dots" },
  { key: "poids", label: "Poids", kind: "text" },
  { key: "prix", label: "Prix indicatif", kind: "text" },
  { key: "avis", label: "Avis vérifiés", kind: "text" },
];

export const reviews: Review[] = [
  {
    id: "rev-1",
    author: "MR",
    product: "MICHELIN Power Cup · 700×25C",
    rating: 5,
    verified: true,
    text: "Rendement bluffant, usure minime après 3 000 km, je suis conquis.",
  },
  {
    id: "rev-2",
    author: "JL",
    product: "MICHELIN Power Gravel · 700×40C",
    rating: 4,
    verified: true,
    text: "Accroche impressionnante sur chemins humides, un poil bruyant sur route.",
  },
  {
    id: "rev-3",
    author: "SC",
    product: "MICHELIN Lithion 4 · 700×28C",
    rating: 4,
    verified: true,
    text: "Excellent rapport qualité/prix pour l'entraînement quotidien.",
  },
];

export const news: NewsItem[] = [
  {
    id: "news-1",
    title:
      "Le Tour de France commence dans 3 semaines, notre sélection de pneus pour l'évènement",
    image: "https://picsum.photos/seed/tourdefrance/1000/600",
  },
  {
    id: "news-2",
    title: "Nouveau : la gamme Power Cup passe au tubeless intégral",
    image: "https://picsum.photos/seed/tubeless/1000/600",
  },
  {
    id: "news-3",
    title: "5 conseils pour bien choisir la pression de tes pneus",
    image: "https://picsum.photos/seed/pression/1000/600",
  },
];

export const rides: Ride[] = [
  {
    id: "mandallaz",
    title: "Tour de la Mandallaz",
    distanceKm: "21,8 km",
    elevation: "511 m",
    duration: "3h30",
    tags: ["Loisir", "Montagne", "Débutant"],
    mapUrl: mapImage(45.955, 6.07),
    summary:
      "Une boucle vallonnée au-dessus du bassin annécien, alternant petites routes tranquilles et chemins roulants. Idéale pour une sortie matinale avec de beaux points de vue sur le lac.",
    startInstructions:
      "Départ du parking de la mairie de La Balme-de-Sillingy. Suivre le balisage jaune vers le sud, puis grimper progressivement par la route forestière jusqu'au col.",
    proTip: {
      author: "Pierrot",
      text: "La descente après le col est rapide et caillouteuse : garde une pression modérée pour le grip et anticipe les freinages.",
    },
    recommendedTyres: [tyres[0], tyres[2]],
  },
  {
    id: "semnoz",
    title: "Ascension du Semnoz",
    distanceKm: "33,4 km",
    elevation: "1 180 m",
    duration: "4h15",
    tags: ["Sportif", "Montagne"],
    mapUrl: mapImage(45.82, 6.095),
    summary:
      "Le grand classique des cyclistes annéciens : une montée régulière et exigeante jusqu'au sommet, récompensée par un panorama à 360 degrés.",
    startInstructions:
      "Départ depuis Annecy, direction Sévrier puis Quintal. La montée débute réellement après le hameau de Leschaux.",
    proTip: {
      author: "Pierrot",
      text: "Sur cette longue ascension, le rendement prime : un pneu léger te fera gagner de précieux watts.",
    },
    recommendedTyres: [tyres[0], tyres[1]],
  },
];

export const clubPlan: ClubPlan = {
  name: "Club starter",
  price: "9 €/mois",
  advantages: [
    "2 pneus Michelin offerts / an",
    "Chambres à air à volonté",
    "Accès prioritaire au Programme Testeur",
    "Mon Garage connecté : suivi d'usure de tes pneus",
    "Badge Testeur Michelin sur ton profil",
    "Actualités & sorties exclusives",
    "10 % de réduction chez nos revendeurs partenaires",
  ],
};
