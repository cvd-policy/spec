// Checks the test corpus against the JSON Schemas alone.
// Semantic rules such as an elapsed `expires` are checked by the core library.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const jsonFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

// Every published version stays available: a 0.1 document is a 0.1 document
// forever, and is validated against the schema it was written for.
const validators = {
  "0.1": ajv.compile(readJson(join(root, "schema", "cvd-policy-0.1.schema.json"))),
  "0.2": ajv.compile(readJson(join(root, "schema", "cvd-policy-0.2.schema.json"))),
};
const LATEST = "0.2";
const reportValidator = ajv.compile(readJson(join(root, "schema", "profiles", "report-0.1.schema.json")));

/** Picks the schema a document asks for; unknown versions fall back to the newest. */
function validatorFor(doc) {
  const version = typeof doc?.cvd_policy === "string" ? doc.cvd_policy : LATEST;
  return validators[version] ?? validators[LATEST];
}

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL ${msg}`);
};

console.log("examples/ and tests/valid/ must validate");
for (const dir of [join(root, "examples"), join(root, "tests", "valid")]) {
  for (const file of jsonFiles(dir)) {
    const doc = readJson(join(dir, file));
    const validate = validatorFor(doc);
    if (!validate(doc)) {
      fail(`${file} is invalid: ${ajv.errorsText(validate.errors, { separator: "; " })}`);
    }
  }
}

console.log("tests/invalid/ must be rejected");
const invalidDir = join(root, "tests", "invalid");
const expected = readJson(join(root, "tests", "expected.json"));
for (const file of jsonFiles(invalidDir)) {
  const meta = expected[file];
  if (!meta) {
    fail(`${file} has no entry in tests/expected.json`);
    continue;
  }
  const doc = readJson(join(invalidDir, file));
  const ok = validatorFor(doc)(doc);
  if (meta.schema && ok) fail(`${file} was accepted by the schema, expected ${meta.code}`);
  if (!meta.schema && !ok) {
    fail(`${file} is marked semantic but is already rejected by the schema`);
  }
}

for (const file of Object.keys(expected)) {
  if (!jsonFiles(invalidDir).includes(file)) fail(`${file} is missing from tests/invalid/`);
}

console.log("reports must match the report profile");
for (const dir of [join(root, "examples", "reports"), join(root, "tests", "reports", "valid")]) {
  for (const file of jsonFiles(dir)) {
    if (!reportValidator(readJson(join(dir, file)))) {
      fail(`report ${file} is invalid: ${ajv.errorsText(reportValidator.errors, { separator: "; " })}`);
    }
  }
}

const reportsInvalidDir = join(root, "tests", "reports", "invalid");
const reportsExpected = readJson(join(root, "tests", "reports", "expected.json"));
for (const file of jsonFiles(reportsInvalidDir)) {
  if (!reportsExpected[file]) {
    fail(`report ${file} has no entry in tests/reports/expected.json`);
    continue;
  }
  if (reportValidator(readJson(join(reportsInvalidDir, file)))) {
    fail(`report ${file} was accepted, expected ${reportsExpected[file].code}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} mismatch(es).`);
  process.exit(1);
}
console.log("\nCorpus complete, schemas behave as expected.");
