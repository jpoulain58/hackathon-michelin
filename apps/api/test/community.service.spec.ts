import test from "node:test";
import assert from "node:assert/strict";
import { CommunityService } from "../src/community/community.service";

const svc = new CommunityService();

test("les compteurs collectifs sont positifs", () => {
  const s = svc.stats();
  assert.ok(s.ridersCount > 0);
  assert.ok(s.totalKm > 0);
  assert.ok(s.verifiedReviews > 0);
});

test("tous les avis sont verifies (km > 0) et tries par km decroissant", () => {
  const items = svc.reviews();
  assert.ok(items.length > 0);
  assert.ok(items.every((r) => r.verifiedKm > 0 && r.verifiedRides > 0));
  for (let i = 1; i < items.length; i++) {
    assert.ok(items[i - 1].verifiedKm >= items[i].verifiedKm);
  }
});

test("le filtre par modele de pneu fonctionne", () => {
  const items = svc.reviews({ tyre: "power cup" });
  assert.ok(items.length > 0);
  assert.ok(items.every((r) => r.tyre.toUpperCase().includes("POWER CUP")));
});

test("les pneus des pros sont exposes", () => {
  const items = svc.pros();
  assert.ok(items.length > 0);
  assert.ok(items.every((p) => p.name && p.tyre));
});
