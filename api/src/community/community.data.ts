/**
 * Donnees seed de la communaute Michelin Trust Wheels (compteurs collectifs,
 * pneus des pros). Les avis riders sont stockes en base (table `reviews`,
 * cf. supabase/reviews.sql) et servis par les routes API, pas par ce module.
 */

export interface CommunityStats {
  ridersCount: number;
  monthKm: number;
  totalKm: number;
}

export interface ProCompetition {
  name: string;
  tyre: string;
  date?: string;
  result?: string;
  productId?: number;
}

export interface ProRider {
  slug: string;
  name: string;
  discipline: string;
  team: string;
  tyre: string;
  productId?: number;
  image: string;
  bio?: string;
  competitions: ProCompetition[];
}

export const COMMUNITY_STATS: CommunityStats = {
  ridersCount: 12300,
  monthKm: 2_400_000,
  totalKm: 48_200_000,
};

export const PRO_RIDERS: ProRider[] = [
  {
    slug: "pauline-ferrand-prevot",
    name: "Pauline Ferrand-Prevot",
    discipline: "VTT XC / Gravel",
    team: "Ineos Grenadiers",
    tyre: "MICHELIN Power Gravel",
    productId: 507,
    image:
      "https://www.lequipe.fr/_medias/img-photo-jpg/pauline-ferrand-prevot-a-remporte-le-tour-de-france-pour-sa-premiere-participation-r-gomez-presse-sp/1500000002248555/0:0,2000:1333-828-552-75/1cd4f.jpg",
    bio:
      "Multiple championne du monde, elle alterne XC et gravel longue distance.",
    competitions: [
      {
        name: "Championnats du monde XC 2024",
        tyre: "MICHELIN Power Gravel",
        date: "Aout 2024",
        productId: 507,
        result: "Championne du monde",
      },
      {
        name: "UCI Gravel World Series",
        tyre: "MICHELIN Power Gravel",
        date: "Mai 2024",
        result: "Top 3",
      },
      {
        name: "Coupe du monde XCO",
        tyre: "MICHELIN Force XC3",
        date: "Juin 2024",
        result: "Podium",
      },
    ],
  },
  {
    slug: "julian-alaphilippe",
    name: "Julian Alaphilippe",
    discipline: "Route",
    team: "Tudor Pro Cycling",
    tyre: "MICHELIN Power Cup",
    productId: 524,
    image:
      "https://www.lequipe.fr/_medias/img-photo-jpg/julian-alaphilippe-lors-de-la-course-en-ligne-des-jo-de-paris-le-3-aout-dernier-g-van-gansen-photonews-presse-sports/1500000002037422/293:60,1549:1316-828-828-75/5904d",
    bio: "Puncheur explosif, deux fois champion du monde sur route.",
    competitions: [
      {
        name: "Tour de France 2025",
        tyre: "MICHELIN Power Cup",
        date: "Juillet 2025",
        productId: 524,
        result: "Etape gagnee",
      },
      {
        name: "Liege-Bastogne-Liege",
        tyre: "MICHELIN Power Cup",
        date: "Avril 2025",
        result: "Top 10",
      },
      {
        name: "Criterium du Dauphine",
        tyre: "MICHELIN Power Cup S",
        date: "Juin 2025",
        result: "Top 5",
      },
    ],
  },
  {
    slug: "mathieu-van-der-poel",
    name: "Mathieu van der Poel",
    discipline: "Route / Cyclocross",
    team: "Alpecin-Deceuninck",
    tyre: "MICHELIN Power Cup S",
    productId: 472,
    image:
      "https://cdn-s-www.lalsace.fr/images/5e9ee8db-0484-479f-942e-95b02fd77299/NW_raw/mathieu-van-der-poel-photo-sipa-1767283641.jpg",
    bio: "Le plus polyvalent du peloton : route, cyclocross et VTT.",
    competitions: [
      {
        name: "Tour des Flandres 2025",
        tyre: "MICHELIN Power Cup S",
        date: "Mars 2025",
        productId: 472,
        result: "Vainqueur",
      },
      {
        name: "Championnats du monde de cyclocross",
        tyre: "MICHELIN Power Cup S",
        date: "Fevrier 2025",
        result: "Champion du monde",
      },
      {
        name: "Paris-Roubaix",
        tyre: "MICHELIN Power Cup",
        date: "Avril 2025",
        result: "Podium",
      },
    ],
  },
  {
    slug: "nino-schurter",
    name: "Nino Schurter",
    discipline: "VTT Cross-Country",
    team: "Scott-SRAM MTB Racing",
    tyre: "MICHELIN Force XC3",
    productId: 745,
    image:
      "https://bnj.blob.core.windows.net/assets/Htdocs/Images/IF_Content_480/20250816170123071.jpg?puid=51209d1f-6b73-4986-b901-5b0240ac5e9d",
    bio: "Legende du XC, recordman de titres mondiaux.",
    competitions: [
      {
        name: "Coupe du monde XCO - Nove Mesto",
        tyre: "MICHELIN Force XC3",
        date: "Mai 2024",
        productId: 745,
        result: "Vainqueur",
      },
      {
        name: "Championnats du monde XC 2024",
        tyre: "MICHELIN Force XC3",
        date: "Aout 2024",
        result: "Podium",
      },
      {
        name: "Marathon des VTT Engadine",
        tyre: "MICHELIN Power Gravel",
        date: "Aout 2024",
        result: "Top 5",
      },
    ],
  },
  {
    slug: "loic-bruni",
    name: "Loic Bruni",
    discipline: "VTT Descente",
    team: "Specialized Gravity",
    tyre: "MICHELIN Wild Enduro Front",
    productId: 695,
    image: "https://magura.com/wp-content/uploads/2026/01/WC52D3-1.jpg",
    bio: "Champion du monde de descente, expert des terrains les plus engages.",
    competitions: [
      {
        name: "Coupe du monde DH - Fort William",
        tyre: "MICHELIN Wild Enduro Front",
        date: "Mai 2024",
        productId: 695,
        result: "Vainqueur",
      },
      {
        name: "Championnats du monde DH 2024",
        tyre: "MICHELIN Wild Enduro Front",
        date: "Septembre 2024",
        result: "Vice-champion",
      },
      {
        name: "Crankworx",
        tyre: "MICHELIN Wild Enduro Rear",
        date: "Juillet 2024",
        result: "Top 3",
      },
    ],
  },
  {
    slug: "annemiek-van-vleuten",
    name: "Annemiek van Vleuten",
    discipline: "Route",
    team: "Movistar Team",
    tyre: "MICHELIN PRO5 TLR",
    productId: 537,
    image:
      "https://www.226ers.com/cdn/shop/articles/Annemiek_Van_Vleuten_vencedora_giro_italia.jpg?v=1747642479",
    bio: "Specialiste des courses par etapes et du contre-la-montre.",
    competitions: [
      {
        name: "Tour de France Femmes",
        tyre: "MICHELIN PRO5 TLR",
        date: "Aout 2024",
        productId: 537,
        result: "Vainqueur",
      },
      {
        name: "Championnats du monde CLM",
        tyre: "MICHELIN PRO5 TLR",
        date: "Septembre 2024",
        result: "Championne du monde",
      },
      {
        name: "La Vuelta Femenina",
        tyre: "MICHELIN Power Cup",
        date: "Mai 2024",
        result: "Podium",
      },
    ],
  },
];
