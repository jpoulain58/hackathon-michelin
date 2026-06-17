import { test, expect } from "vitest";
import { TyresService } from "../src/tyres/tyres.service";

const svc = new TyresService();

test("le service charge un catalogue non vide", () => {
  expect(svc.count()).toBeGreaterThan(0);
});

test("options expose disciplines et priorites avec labels", () => {
  const { disciplines, priorities } = svc.options();
  expect(disciplines.length).toBeGreaterThanOrEqual(4);
  expect(priorities.length).toBeGreaterThanOrEqual(5);
  expect(disciplines.every((d) => d.key && d.label)).toBe(true);
});

test("recommend renvoie un classement trie avec justification", () => {
  const items = svc.recommend({ discipline: "road", priority: "speed", limit: 5 });
  expect(items.length).toBeGreaterThan(0);
  expect(items.length).toBeLessThanOrEqual(5);
  for (let i = 1; i < items.length; i++) {
    expect(items[i - 1].score).toBeGreaterThanOrEqual(items[i].score);
  }
  expect(items[0].id).toMatch(/michelin/);
  expect(items[0].productType).toBeTruthy();
  expect(Array.isArray(items[0].why)).toBe(true);
});

test("recommend rejette une discipline invalide (BadRequest)", () => {
  expect(() => svc.recommend({ discipline: "moto", priority: "speed" })).toThrow(/inconnue/i);
});

test("list filtre par discipline (cycleType correspondant)", () => {
  const items = svc.list({ discipline: "mtb", limit: 10 });
  expect(items.length).toBeGreaterThan(0);
  expect(items.every((p) => p.cycleType === "MTB")).toBe(true);
});

test("list peut retrouver des pneus precis par ids", () => {
  const source = svc.recommend({ discipline: "gravel", priority: "puncture", limit: 3 });
  const ids = source.slice(0, 2).map((p) => p.id);
  const items = svc.list({ ids });
  expect(items.map((p) => p.id)).toEqual(ids);
  expect(items.every((p) => p.range.startsWith("MICHELIN"))).toBe(true);
});
