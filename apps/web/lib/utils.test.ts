import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (helper shadcn/ui)", () => {
  it("concatene les classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignore les valeurs falsy (conditionnel)", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("dedoublonne les utilitaires Tailwind en conflit (tailwind-merge)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
