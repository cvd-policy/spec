// Checks the test corpus against the JSON Schema alone.
// Semantic rules such as an elapsed `expires` are checked by the core library.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(readFileSync(join(root, "schema", "cvd-policy-0.1.schema.json"), "utf8"));
const expected = JSON.parse(readFileSync(join(root, "tests", "expected.json"), "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const jsonFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL ${msg}`);
};

console.log("examples/ and tests/valid/ must validate");
for (const dir of [join(root, "examples"), join(root, "tests", "valid")]) {
  for (const file of jsonFiles(dir)) {
    const ok = validate(readJson(join(dir, file)));
    if (!ok) {
      fail(`${file} is invalid: ${ajv.errorsText(validate.errors, { separator: "; " })}`);
    }
  }
}

console.log("tests/invalid/ must be rejected");
const invalidDir = join(root, "tests", "invalid");
for (const file of jsonFiles(invalidDir)) {
  const meta = expected[file];
  if (!meta) {
    fail(`${file} has no entry in tests/expected.json`);
    continue;
  }
  const ok = validate(readJson(join(invalidDir, file)));
  if (meta.schema && ok) {
    fail(`${file} was accepted by the schema, expected ${meta.code}`);
  }
  if (!meta.schema && !ok) {
    fail(`${file} is marked semantic but is already rejected by the schema`);
  }
}

for (const file of Object.keys(expected)) {
  if (!jsonFiles(invalidDir).includes(file)) fail(`${file} is missing from tests/invalid/`);
}

if (failures > 0) {
  console.error(`\n${failures} mismatch(es).`);
  process.exit(1);
}
console.log("\nCorpus complete, schema behaves as expected.");
