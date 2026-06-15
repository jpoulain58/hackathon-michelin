export interface Product {
  brand: string;
  productType: string;
  cycleType: string;
  segment: string;
  range: string;
  designation: string;
  use: string[];
  terrainTypes: string[];
  tpi?: string;
  weightG?: number;
  pressure?: { minBar?: number; maxBar?: number; minPsi?: number; maxPsi?: number };
  technologies?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface Discipline {
  label: string;
  cycleType: string;
  uses: string[];
  terrain: string[];
  avoid?: string[];
  kw?: string[];
}

export interface Priority {
  label: string;
  kw?: string[];
  segment?: string[];
  tech?: string;
  lightWeight?: boolean;
  highTpi?: boolean;
}

export interface Profile {
  discipline: string;
  priority: string;
  ebike?: boolean;
  limit?: number;
}

export interface Reco {
  product: Product;
  score: number;
  why: string[];
}

export declare const DISCIPLINES: Record<string, Discipline>;
export declare const PRIORITIES: Record<string, Priority>;
export declare function scoreProduct(p: Product, disc: Discipline, prio: Priority, ebike?: boolean): { score: number; why: string[] };
export declare function recommend(products: Product[], profile: Profile): Reco[];
export declare function loadCatalog(opts?: { path?: string }): Product[];
export declare function loadTyres(opts?: { path?: string }): Product[];
export declare const SAMPLE_PATH: string;
