import { test, expect } from "vitest";
import { CommunityService } from "../src/community/community.service";

const svc = new CommunityService();

test("les compteurs collectifs sont positifs", () => {
  const s = svc.stats();
  expect(s.ridersCount).toBeGreaterThan(0);
  expect(s.totalKm).toBeGreaterThan(0);
  expect(s.verifiedReviews).toBeGreaterThan(0);
});

test("tous les avis sont verifies (km > 0) et tries par km decroissant", () => {
  const items = svc.reviews();
  expect(items.length).toBeGreaterThan(0);
  expect(items.every((r) => r.verifiedKm > 0 && r.verifiedRides > 0)).toBe(true);
  for (let i = 1; i < items.length; i++) {
    expect(items[i - 1].verifiedKm).toBeGreaterThanOrEqual(items[i].verifiedKm);
  }
});

test("le filtre par modele de pneu fonctionne", () => {
  const items = svc.reviews({ tyre: "power cup" });
  expect(items.length).toBeGreaterThan(0);
  expect(items.every((r) => r.tyre.toUpperCase().includes("POWER CUP"))).toBe(true);
});

test("les pneus des pros sont exposes", () => {
  const items = svc.pros();
  expect(items.length).toBeGreaterThan(0);
  expect(items.every((p) => p.name && p.tyre)).toBe(true);
});
