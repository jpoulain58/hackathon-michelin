import { test, expect } from "vitest";
import { CommunityService } from "../src/community/community.service";

const svc = new CommunityService();

test("les compteurs collectifs sont positifs", () => {
  const s = svc.stats();
  expect(s.ridersCount).toBeGreaterThan(0);
  expect(s.totalKm).toBeGreaterThan(0);
});

test("les pneus des pros sont exposes", () => {
  const items = svc.pros();
  expect(items.length).toBeGreaterThan(0);
  expect(items.every((p) => p.name && p.tyre)).toBe(true);
});
