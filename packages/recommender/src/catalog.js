"use strict";
const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");

const SAMPLE_PATH = join(__dirname, "..", "data", "products.sample.json");

/**
 * Charge le catalogue produit.
 *
 * Ordre de priorite :
 *   1. process.env.CATALOG_PATH (catalogue reel, confidentiel, gitignore)
 *   2. l'echantillon anonymise versionne (data/products.sample.json)
 *
 * Le catalogue reel n'est JAMAIS commite : seul l'echantillon anonymise
 * permet de faire tourner l'app dans le depot public.
 */
function loadCatalog(opts = {}) {
  const path = opts.path || process.env.CATALOG_PATH;
  const file = path && existsSync(path) ? path : SAMPLE_PATH;
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Catalogue limite aux pneus (exclut les chambres a air). */
function loadTyres(opts = {}) {
  return loadCatalog(opts).filter((p) => String(p.productType).toUpperCase() !== "TUBE");
}

module.exports = { loadCatalog, loadTyres, SAMPLE_PATH };
