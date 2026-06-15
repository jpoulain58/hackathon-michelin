import { test, expect } from "vitest";
import { recommend, loadTyres, DISCIPLINES, PRIORITIES } from "../src/index.js";

const tyres = loadTyres();

test("le catalogue anonymise se charge et exclut les chambres a air", () => {
  expect(tyres.length).toBeGreaterThan(0);
  expect(tyres.every((p) => String(p.productType).toUpperCase() !== "TUBE")).toBe(true);
});

test("recommend renvoie un classement non vide, trie par score decroissant", () => {
  const res = recommend(tyres, { discipline: "road", priority: "speed", limit: 5 });
  expect(res.length).toBeGreaterThan(0);
  expect(res.length).toBeLessThanOrEqual(5);
  for (let i = 1; i < res.length; i++) {
    expect(res[i - 1].score).toBeGreaterThanOrEqual(res[i].score);
  }
  expect(typeof res[0].score).toBe("number");
  expect(Array.isArray(res[0].why)).toBe(true);
});

test("la discipline route privilegie un pneu route en tete", () => {
  const [top] = recommend(tyres, { discipline: "road", priority: "speed" });
  expect(top.product.cycleType).toBe("ROAD");
});

test("chaque profil valide produit au moins une reco", () => {
  for (const d of Object.keys(DISCIPLINES)) {
    for (const p of Object.keys(PRIORITIES)) {
      const res = recommend(tyres, { discipline: d, priority: p, limit: 3 });
      expect(res.length, `aucune reco pour ${d}/${p}`).toBeGreaterThan(0);
    }
  }
});

test("un profil invalide leve une erreur explicite", () => {
  expect(() => recommend(tyres, { discipline: "moto", priority: "speed" })).toThrow(/Discipline inconnue/);
  expect(() => recommend(tyres, { discipline: "road", priority: "fly" })).toThrow(/Priorite inconnue/);
});

test("la priorite anti-crevaison remonte les technologies de renfort", () => {
  const res = recommend(tyres, { discipline: "gravel", priority: "puncture", limit: 5 });
  expect(res.length).toBeGreaterThan(0);
  // au moins une raison mentionne la techno mise en avant
  const hasReason = res.some((r) => r.why.some((w) => /anti-crevaison|techno/.test(w)));
  expect(hasReason, "aucune justification anti-crevaison dans le top 5").toBe(true);
});
