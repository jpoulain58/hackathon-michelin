import { existsSync } from "node:fs";
import { resolve } from "node:path";

type LoadEnvFile = (path?: string) => void;

const loadEnvFile = (process as NodeJS.Process & { loadEnvFile?: LoadEnvFile }).loadEnvFile;

if (loadEnvFile) {
  const candidates = new Set([
    resolve(process.cwd(), ".env"),
    resolve(__dirname, "..", ".env"),
    resolve(__dirname, "..", "..", ".env"),
  ]);

  for (const file of candidates) {
    if (!existsSync(file)) continue;

    loadEnvFile(file);
  }
}
