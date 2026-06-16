export type LatLng = [number, number];

export interface TyreDetail {
  name: string;
  designation: string;
  weightG: number;
  dimensions: number;
}

export interface ProTip {
  author: string;
  text: string;
}

export interface Ride {
  id: string;
  name: string;
  km: number;
  dplus: number;
  duration: string;
  kcal: number;
  terrain: string;
  landscape: string;
  difficulty: "Débutant" | "Intermédiaire" | "Expert";
  best?: boolean;
  tyre: string;
  tyreDetail: TyreDetail;
  description: string;
  instructions: string;
  proTip: ProTip;
  pts: LatLng[];
}

/** Décodeur de polyline encodée Strava/Google (algorithme officiel). */
export function decodePolyline(str: string, precision = 5): LatLng[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coords: LatLng[] = [];
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / factor, lng / factor]);
  }
  return coords;
}

/** Génère une boucle de démo (à remplacer par decodePolyline(activity.map.summary_polyline)). */
export function loop(cLat: number, cLng: number, r: number, seed: number, n: number): LatLng[] {
  const pts: LatLng[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const wob = 1 + 0.25 * Math.sin(a * 3 + seed) + 0.12 * Math.cos(a * 5 + seed);
    pts.push([cLat + r * wob * Math.sin(a) * 0.9, cLng + r * wob * Math.cos(a)]);
  }
  return pts;
}

export const CENTER: LatLng = [45.7772, 3.087]; // Clermont-Ferrand (siège Michelin)

export const RIDES: Ride[] = [
  {
    id: "boucle-des-cretes",
    name: "Boucle des Crêtes",
    km: 42,
    dplus: 850,
    duration: "2h45",
    kcal: 1200,
    terrain: "Route",
    landscape: "Montagne",
    difficulty: "Intermédiaire",
    best: true,
    tyre: "MICHELIN Power Cup",
    tyreDetail: {
      name: "MICHELIN Power Cup TLR",
      designation: "Competition Line",
      weightG: 205,
      dimensions: 8,
    },
    description:
      "Une boucle emblématique qui serpente entre les villages du Massif Central, avec des panoramas sur la chaîne des Puys. Asphalte en bon état, montées régulières sans cassures brutales. Idéal pour un samedi matin en groupe.",
    instructions:
      "Départ depuis le parking de Orcines. Prendre la D941 direction Pontgibaud, puis suivre le balisage bleu jusqu'au col de Ceyssat. La montée est progressive sur les 8 premiers kilomètres.",
    proTip: {
      author: "Pierrot",
      text: "Sur la descente après le col, l'asphalte peut être mouillé même par beau temps. Je garde 6 bars à l'arrière pour rester collé dans les virages en épingle. Le Power Cup TLR ne m'a jamais lâché ici.",
    },
    pts: loop(45.79, 3.1, 0.05, 1, 80),
  },
  {
    id: "gravel-du-cezallier",
    name: "Gravel du Cézallier",
    km: 58,
    dplus: 600,
    duration: "3h30",
    kcal: 1650,
    terrain: "Gravel",
    landscape: "Plateau",
    difficulty: "Intermédiaire",
    tyre: "MICHELIN Power Gravel",
    tyreDetail: {
      name: "MICHELIN Power Gravel",
      designation: "Competition Line",
      weightG: 330,
      dimensions: 4,
    },
    description:
      "Le Cézallier à gravel, c'est un plateau volcanique sauvage avec des pistes agricoles bien tassées et quelques portions d'asphalte en liaison. Paysages de landes et troupeaux garantis.",
    instructions:
      "Départ de Massiac. Prendre la D585 sur 4 km puis bifurquer sur la piste en terre. Suivre les balises orange tout au long du parcours.",
    proTip: {
      author: "Sophie",
      text: "Par temps sec, les pistes sont rapides et tu peux descendre la pression à 2,8 bars pour plus de confort. Par temps humide, reste sur 3,2 et évite les talwegs — l'argile volcanique est traître.",
    },
    pts: loop(45.74, 3.02, 0.07, 3, 90),
  },
  {
    id: "sortie-club-dimanche",
    name: "Sortie club du dimanche",
    km: 90,
    dplus: 1200,
    duration: "4h30",
    kcal: 2500,
    terrain: "Route",
    landscape: "Montagne",
    difficulty: "Expert",
    tyre: "MICHELIN Power Road TLR",
    tyreDetail: {
      name: "MICHELIN Power Road TLR",
      designation: "Racing Line",
      weightG: 280,
      dimensions: 6,
    },
    description:
      "La sortie longue du club tous les dimanches. Un tour complet autour du Puy-de-Dôme avec enchaînement de bosses et un final exigeant sur les routes de la Limagne.",
    instructions:
      "Rendez-vous 8h30 devant la Maison du Vélo, Clermont-Ferrand. Sortie en peloton — respecter les feux et signaler les obstacles. Neutralisé sur les 5 premiers km en ville.",
    proTip: {
      author: "Marc",
      text: "Le secteur de la Côte des Gardes au km 67 fait mal aux jambes après 3h d'effort. Relâche un peu avant pour mieux relancer au sommet. Le Power Road TLR absorbe bien les pavés du final.",
    },
    pts: loop(45.8, 3.13, 0.09, 5, 110),
  },
  {
    id: "ascension-puy-de-dome",
    name: "Ascension du Puy de Dôme",
    km: 35,
    dplus: 1600,
    duration: "2h15",
    kcal: 1400,
    terrain: "Route",
    landscape: "Montagne",
    difficulty: "Expert",
    tyre: "MICHELIN Power Cup",
    tyreDetail: {
      name: "MICHELIN Power Cup TLR",
      designation: "Competition Line",
      weightG: 205,
      dimensions: 8,
    },
    description:
      "Le mythe. L'ascension par la route Nationale depuis Royat jusqu'au sommet, puis retour par les Côtes de Clermont. Un dossard imaginaire à chaque montée.",
    instructions:
      "Départ de Royat-Chamalières. La montée commence vraiment dès le km 4. Prévoir un coupe-vent pour le sommet — il fait en moyenne 8°C de moins qu'en bas.",
    proTip: {
      author: "Pierrot",
      text: "La section à 12% entre le km 8 et km 11 est psychologique autant que physique. Reste assis, cadence haute, et ne regarde pas le sommet. À la descente, attention à la limite de vitesse sur la RD68.",
    },
    pts: loop(45.77, 2.96, 0.04, 7, 70),
  },
  {
    id: "single-foret-vtt",
    name: "Single forêt VTT",
    km: 28,
    dplus: 700,
    duration: "2h30",
    kcal: 900,
    terrain: "VTT",
    landscape: "Forêt",
    difficulty: "Intermédiaire",
    tyre: "MICHELIN Force AM",
    tyreDetail: {
      name: "MICHELIN Force AM",
      designation: "Competition Line",
      weightG: 860,
      dimensions: 5,
    },
    description:
      "Un single track fluide qui traverse la forêt de la Comté. Des berms naturels, quelques drops optionnels et des zones de pédalage récupération. Parfait pour progresser en trail.",
    instructions:
      "Parking de la Comté, accès par la D120. Commencer par la montée verte (20 min) avant d'attaquer le single en descente. Le trail est balisé rouge — éviter les journées humides.",
    proTip: {
      author: "Julie",
      text: "Ce trail pardonne beaucoup en termes de trajectoires. Profites-en pour travailler ton regard loin devant. Le Force AM en 2.4 est mon choix ici — tu n'as pas besoin d'un pneu plus agressif.",
    },
    pts: loop(45.75, 3.12, 0.045, 9, 75),
  },
];
