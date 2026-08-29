import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { applyPointerValues, DuplicateMemberError, parseJsonText, semanticIssues } from "./v1-validation.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const files = (dir, suffix = ".json") =>
  readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory() ? files(join(dir, entry.name), suffix) : entry.name.endsWith(suffix) ? [join(dir, entry.name)] : [])
    .sort();

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const schema = readJson(join(root, "schema", "cvd-policy-1.schema.json"));
const validateSchema = ajv.compile(schema);
const now = new Date("2026-08-29T10:00:00Z");
let failures = 0;
const fail = (message) => {
  failures++;
  console.error(`  FAIL ${message}`);
};

console.log("V1 schema compiles and valid examples/corpus entries validate");
const validFiles = [
  ...files(join(root, "examples", "v1")),
  ...files(join(root, "tests", "v1", "policy", "valid")),
];
for (const file of validFiles) {
  const doc = readJson(file);
  if (!validateSchema(doc)) fail(`${relative(root, file)}: ${ajv.errorsText(validateSchema.errors)}`);
  const issues = semanticIssues(doc, now);
  if (issues.length) fail(`${relative(root, file)} semantic: ${JSON.stringify(issues)}`);
}

console.log("V1 invalid policies fail at the declared validation layer");
const invalidDir = join(root, "tests", "v1", "policy", "invalid");
const expected = readJson(join(root, "tests", "v1", "expected.json"));
const invalidFiles = files(invalidDir);
for (const file of invalidFiles) {
  const name = file.slice(invalidDir.length + 1);
  const meta = expected[name];
  if (!meta) {
    fail(`${name} has no tests/v1/expected.json entry`);
    continue;
  }
  const doc = readJson(file);
  const schemaValid = validateSchema(doc);
  if (meta.schema && schemaValid) fail(`${name} passed schema, expected ${meta.code}`);
  if (!meta.schema && !schemaValid) fail(`${name} is semantic but failed schema: ${ajv.errorsText(validateSchema.errors)}`);
  if (!meta.schema && !semanticIssues(doc, now).some((issue) => issue.code === meta.code)) {
    fail(`${name} did not produce semantic code ${meta.code}`);
  }
}
for (const name of Object.keys(expected)) {
  if (!invalidFiles.some((file) => file.endsWith(`/${name}`))) fail(`${name} is declared but missing`);
}

console.log("V1 raw JSON cases reject duplicates and invalid grammar");
const rawDir = join(root, "tests", "v1", "policy", "raw-invalid");
const rawExpected = readJson(join(root, "tests", "v1", "raw-expected.json"));
const rawFiles = files(rawDir, ".raw.json");
for (const file of rawFiles) {
  const name = file.slice(rawDir.length + 1);
  const meta = rawExpected[name];
  if (!meta) {
    fail(`${name} has no raw expectation`);
    continue;
  }
  try {
    parseJsonText(readFileSync(file, "utf8"));
    fail(`${name} was accepted`);
  } catch (error) {
    const code = error instanceof DuplicateMemberError ? "policy_duplicate_member" : "policy_parse_error";
    if (code !== meta.code) fail(`${name} produced ${code}, expected ${meta.code}`);
  }
}
for (const name of Object.keys(rawExpected)) {
  if (!rawFiles.some((file) => file.endsWith(`/${name}`))) fail(`${name} is declared but missing`);
}

console.log("V1 security.txt and evaluation vectors are complete and executable inputs");
const securityCases = readJson(join(root, "tests", "v1", "security-txt", "cases.json"));
const evaluationCases = readJson(join(root, "tests", "v1", "evaluation", "cases.json"));
for (const group of [securityCases, evaluationCases]) {
  const seen = new Set();
  for (const entry of group) {
    if (!entry.id || seen.has(entry.id)) fail(`duplicate or missing vector id ${entry.id}`);
    seen.add(entry.id);
    if (!entry.expected || !Array.isArray(entry.requirements) || entry.requirements.length === 0) fail(`${entry.id} lacks expected result or requirements`);
  }
}
for (const entry of evaluationCases) {
  const base = readJson(join(root, "tests", "v1", "policy", "valid", entry.base));
  const doc = applyPointerValues(base, entry.set);
  if (!validateSchema(doc)) fail(`evaluation/${entry.id} policy fails schema: ${ajv.errorsText(validateSchema.errors)}`);
  const semantic = semanticIssues(doc, new Date(entry.now));
  if (semantic.length && !(entry.expected.reasonCode === "policy_expired" && semantic.some((issue) => issue.code === "policy_expired"))) {
    fail(`evaluation/${entry.id} policy has unexpected semantic issues: ${JSON.stringify(semantic)}`);
  }
}

console.log("V1 normative static assertions hold");
const specText = readFileSync(join(root, "v1", "SPEC.md"), "utf8");
const assertions = readJson(join(root, "tests", "v1", "assertions.json"));
const hasKey = (value, key) => value && typeof value === "object" && (Object.hasOwn(value, key) || Object.values(value).some((child) => hasKey(child, key)));
for (const assertion of assertions) {
  if (assertion.type === "spec_contains" && !specText.includes(assertion.value)) fail(`assertion/${assertion.id}: text not found`);
  if (assertion.type === "schema_forbids_keyword" && hasKey(schema, assertion.value)) fail(`assertion/${assertion.id}: schema contains ${assertion.value}`);
  if (assertion.type === "schema_core_objects_strict") {
    if (schema.additionalProperties !== false) fail(`assertion/${assertion.id}: root object is not strict`);
    for (const [name, definition] of Object.entries(schema.$defs ?? {})) {
      if (definition.type === "object" && definition.additionalProperties !== false) fail(`assertion/${assertion.id}: $defs/${name} is not strict`);
    }
  }
}

if (schema.properties.cvd_policy?.const !== 1) fail("schema does not declare integer cvd_policy 1");
if (failures) {
  console.error(`\n${failures} V1 corpus mismatch(es).`);
  process.exit(1);
}
console.log(`\nV1 corpus complete: ${validFiles.length} valid documents, ${invalidFiles.length} invalid documents, ${rawFiles.length} raw cases, ${securityCases.length} security.txt vectors, ${evaluationCases.length} evaluation vectors.`);
