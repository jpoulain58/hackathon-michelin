import { defineConfig } from "vitest/config";

// Tests unitaires des services NestJS. setup.ts charge reflect-metadata
// (necessaire aux decorateurs @Injectable) avant l'import des services.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.spec.ts"],
    setupFiles: ["./test/setup.ts"],
  },
});
