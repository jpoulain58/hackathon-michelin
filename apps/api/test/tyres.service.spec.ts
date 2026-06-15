import test from "node:test";
import assert from "node:assert/strict";
import { TyresService } from "../src/tyres/tyres.service";

const svc = new TyresService();

test("le service charge un catalogue non vide", () => {
  assert.ok(svc.count() > 0);
});

test("options expose disciplines et priorites avec labels", () => {
  const { disciplines, priorities } = svc.options();
  assert.ok(disciplines.length >= 4);
  assert.ok(priorities.length >= 5);
  assert.ok(disciplines.every((d) => d.key && d.label));
});

test("recommend renvoie un classement trie avec justification", () => {
  const items = svc.recommend({ discipline: "road", priority: "speed", limit: 5 });
  assert.ok(items.length > 0 && items.length <= 5);
  for (let i = 1; i < items.length; i++) {
    assert.ok(items[i - 1].score >= items[i].score);
  }
  assert.ok(Array.isArray(items[0].why));
});

test("recommend rejette une discipline invalide (BadRequest)", () => {
  assert.throws(() => svc.recommend({ discipline: "moto", priority: "speed" }), /inconnue/i);
});

test("list filtre par discipline (cycleType correspondant)", () => {
  const items = svc.list({ discipline: "mtb", limit: 10 });
  assert.ok(items.length > 0);
  assert.ok(items.every((p) => p.cycleType === "MTB"));
});
