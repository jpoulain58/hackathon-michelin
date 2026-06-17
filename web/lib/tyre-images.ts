const DIRECT: Record<string, string> = {
  "BI-165": "https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4xxh5ifhzwrhwxr/bi-165_3528706657283_tire_michelin_city-cargo-comp-line_20-x-2-point-40_a_main_1-30_nopad.webp?t=resize&height=700",
  "BI-106": "https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4xmrxzdyhjxsfsw/bi-106_3528709005609_tire_michelin_force-am-2-competition-line_29-x-2-point-60_a_main_1-30_nopad.webp?t=resize&height=700",
  "BI-129": "https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4qsbfckuqsxdijw/bi-129_3528708285576_tire_michelin_power-adventure_700-x-36c_a_main_1-30_nopad.webp?t=resize&height=700",
  "BI-153": "https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4quctxwzae3bhsa/bi-153_3528700749601_tire_michelin_power-protection-tlr_700-x-28c_a_main_1-30_nopad.webp?t=resize&height=700",
  "BI-36":  "https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4qcbrsf8fcx9nta/bi-36_3528701464046_tire_michelin_power-all-season_700-x-25c_a_main_1-30_nopad.webp?t=resize&height=700",
  "BI-24":  "https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4x3p93jq14am7go/bi-24_3528709052269_tire_michelin_force-am-performance-line_29-x-2-point-35_a_main_1-30_nopad.webp?t=resize&height=700",
};

const CATEGORY: Record<string, string> = {
  city:         DIRECT["BI-165"],
  "mtb-enduro": DIRECT["BI-106"],
  "mtb-trail":  DIRECT["BI-24"],
  gravel:       DIRECT["BI-129"],
  "road-race":  DIRECT["BI-153"],
  "road-all":   DIRECT["BI-36"],
};

function classify(cycleType: string, range: string): string | undefined {
  if (cycleType === "CITY") return "city";
  const r = range.toUpperCase();
  if (r.includes("GRAVEL") || r.includes("ADVENTURE") || r.includes("ALL SEASON")) {
    return r.includes("ALL SEASON") ? "road-all" : "gravel";
  }
  if (cycleType === "MTB") {
    return r.includes("ENDURO") || r.includes("DH") || r.includes("E-WILD") || r.includes("PILOT")
      ? "mtb-enduro"
      : "mtb-trail";
  }
  if (cycleType === "ROAD") return "road-race";
  return undefined;
}

export function getTyreImage(
  globalId?: string,
  cycleType?: string,
  range?: string,
): string | undefined {
  if (globalId && DIRECT[globalId]) return DIRECT[globalId];
  if (cycleType && range) {
    const cat = classify(cycleType, range);
    if (cat) return CATEGORY[cat];
  }
  return undefined;
}
