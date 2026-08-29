import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expectedRequirements, specificationRequirements } from "./v1-requirements.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const actual = JSON.parse(readFileSync(join(root, "v1", "requirements.json"), "utf8"));
const expected = expectedRequirements();
const specIds = specificationRequirements();
const mappedIds = Object.keys(actual).sort();
const missing = specIds.filter((id) => !mappedIds.includes(id));
const unknown = mappedIds.filter((id) => !specIds.includes(id));
const stale = JSON.stringify(actual) !== JSON.stringify(expected);
if (missing.length || unknown.length || stale) {
  if (missing.length) console.error(`Unmapped requirements: ${missing.join(", ")}`);
  if (unknown.length) console.error(`Unknown requirements: ${unknown.join(", ")}`);
  if (stale) console.error("v1/requirements.json is stale; run npm run build:v1.");
  process.exit(1);
}
console.log(`${specIds.length} normative V1 requirements map to executable tests.`);
