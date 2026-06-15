"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { recommend, loadTyres, DISCIPLINES, PRIORITIES } = require("../src");

const tyres = loadTyres();

test("le catalogue anonymise se charge et exclut les chambres a air", () => {
  assert.ok(tyres.length > 0, "le catalogue ne doit pas etre vide");
  assert.ok(tyres.every((p) => String(p.productType).toUpperCase() !== "TUBE"));
});

test("recommend renvoie un classement non vide, trie par score decroissant", () => {
  const res = recommend(tyres, { discipline: "road", priority: "speed", limit: 5 });
  assert.ok(res.length > 0 && res.length <= 5);
  for (let i = 1; i < res.length; i++) {
    assert.ok(res[i - 1].score >= res[i].score, "scores non tries");
  }
  assert.ok(typeof res[0].score === "number");
  assert.ok(Array.isArray(res[0].why));
});

test("la discipline route privilegie un pneu route en tete", () => {
  const [top] = recommend(tyres, { discipline: "road", priority: "speed" });
  assert.equal(top.product.cycleType, "ROAD");
});

test("chaque profil valide produit au moins une reco", () => {
  for (const d of Object.keys(DISCIPLINES)) {
    for (const p of Object.keys(PRIORITIES)) {
      const res = recommend(tyres, { discipline: d, priority: p, limit: 3 });
      assert.ok(res.length > 0, `aucune reco pour ${d}/${p}`);
    }
  }
});

test("un profil invalide leve une erreur explicite", () => {
  assert.throws(() => recommend(tyres, { discipline: "moto", priority: "speed" }), /Discipline inconnue/);
  assert.throws(() => recommend(tyres, { discipline: "road", priority: "fly" }), /Priorite inconnue/);
});

test("la priorite anti-crevaison remonte les technologies de renfort", () => {
  const res = recommend(tyres, { discipline: "gravel", priority: "puncture", limit: 5 });
  assert.ok(res.length > 0);
  // au moins une raison mentionne la techno mise en avant
  const hasReason = res.some((r) => r.why.some((w) => /anti-crevaison|techno/.test(w)));
  assert.ok(hasReason, "aucune justification anti-crevaison dans le top 5");
});
