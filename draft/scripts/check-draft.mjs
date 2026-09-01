import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  applyPointerValues,
  parseJsonText,
  semanticIssues,
} from "../../scripts/v1-validation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const draftDir = path.join(root, "draft");
const sourcePath = path.join(draftDir, "draft-behring-cvd-policy.md");
const mappingPath = path.join(draftDir, "REQUIREMENTS-MAPPING.md");
const parseJson = (text, label) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Cannot parse ${label}`, { cause: error });
  }
};
const source = await readFile(sourcePath, "utf8");
const requirementsPath = path.join(root, "v1/requirements.json");
const schemaPath = path.join(root, "schema/cvd-policy-1.schema.json");
const evaluationPath = path.join(root, "tests/v1/evaluation/cases.json");
const requirements = parseJson(await readFile(requirementsPath, "utf8"), requirementsPath);
const schema = parseJson(await readFile(schemaPath, "utf8"), schemaPath);
const evaluationCases = parseJson(await readFile(evaluationPath, "utf8"), evaluationPath);

const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const slug = (heading) => heading
  .toLowerCase()
  .replace(/[`*_]/g, "")
  .replace(/[^a-z0-9 -]/g, "")
  .trim()
  .replace(/\s+/g, "-");

const headings = [];
for (const match of source.matchAll(/^(#{1,6}) (.+)$/gm)) {
  headings.push({ offset: match.index, title: match[2], anchor: slug(match[2]) });
}
const anchors = new Set(headings.map(({ anchor }) => anchor));
assert.equal(anchors.size, headings.length, "Draft headings must have unique generated anchors");

const mapped = new Map();
for (const match of source.matchAll(/<!-- requirements: ([^;]+); disposition: ([^ ]+) -->/g)) {
  const heading = headings.findLast(({ offset }) => offset < match.index);
  assert(heading, `Requirement marker has no preceding heading: ${match[0]}`);
  assert.equal(match[2], "normative", `Unsupported requirement disposition for ${match[1]}`);
  for (const id of match[1].trim().split(/\s+/)) {
    assert(!mapped.has(id), `Duplicate Draft mapping for ${id}`);
    mapped.set(id, heading);
  }
}

const expectedIds = Object.keys(requirements).sort();
assert.deepEqual([...mapped.keys()].sort(), expectedIds, "Draft must map every V1 requirement exactly once");
assert.equal(expectedIds.length, 71, "The 61-requirement baseline plus 10 reviewed requirements must be present");

const frontmatter = source.slice(0, source.indexOf("\n--- abstract"));
const externalReferences = new Set([...frontmatter.matchAll(/^  ([A-Z][A-Z0-9-]+):/gm)].map((match) => match[1]));
for (const match of source.matchAll(/\{\{([^}]+)\}\}/g)) {
  const reference = match[1];
  assert(anchors.has(reference) || externalReferences.has(reference), `Unknown Draft reference: ${reference}`);
}

assert.match(source, /^title: Machine-Readable Coordinated Vulnerability Disclosure Policies$/m);
assert.match(source, /^docname: draft-behring-cvd-policy-00$/m);
assert.match(source, /^date: 2026-09-01$/m);
assert.match(source, /^category: std$/m);
for (const value of [
  "ins: B. L. Behring",
  "name: Ben Luca Behring",
  "email: behring@skalvar.de",
  "ins: M. Berg",
  "name: Marco Berg",
  "email: berg@skalvar.de",
]) assert(source.includes(value), `Missing author metadata: ${value}`);
assert.equal((source.match(/org: Skalvar Technologies/g) ?? []).length, 2);
assert.equal((source.match(/country: Germany/g) ?? []).length, 2);
assert(!/TBD/i.test(source), "Draft must not contain TBD placeholders");
assert(!/^```/m.test(source), "Draft must use Kramdown-RFC tilde fences");

for (const heading of [
  "Introduction",
  "Conventions and Terminology",
  "Problem Statement",
  "Design Goals and Non-Goals",
  "Discovery Using security.txt",
  "Policy Retrieval",
  "Authority and Delegation",
  "CVD Policy Document",
  "Structural and Semantic Validation",
  "Target Normalization and Scope Matching",
  "Testing Permission Evaluation",
  "Processing Errors and Result Statuses",
  "Operational Considerations",
  "Security Considerations",
  "Privacy Considerations",
  "IANA Considerations",
  "Implementation Status",
  "Examples",
]) {
  assert(headings.some((item) => item.title === heading), `Missing required section: ${heading}`);
}
assert.equal(
  headings.findIndex(({ title }) => title === "Security Considerations"),
  headings.findIndex(({ title }) => title === "Implementation Status") + 1,
  "Implementation Status must immediately precede Security Considerations",
);
assert.match(source, /both referenced GitHub commit URLs returned HTTP 404/);

for (const pattern of [
  /`testing\.default`/,
  /`explicit_order`/,
  /first[- ]match[- ]wins/i,
  /\b(?:this|the) RFC\b/i,
  /RFC[- ]compliant/i,
  /(?:is|are) IANA[- ]registered/i,
]) {
  assert(!pattern.test(source), `Legacy or premature standards language found: ${pattern}`);
}

const examples = new Map();
for (const match of source.matchAll(/<!-- policy-example: ([a-z0-9-]+) -->\s*~~~ json\n([\s\S]*?)\n~~~/g)) {
  assert(!examples.has(match[1]), `Duplicate policy example marker: ${match[1]}`);
  const policy = parseJsonText(match[2]);
  assert(validate(policy), `${match[1]} fails the V1 schema: ${ajv.errorsText(validate.errors)}`);
  assert.deepEqual(semanticIssues(policy), [], `${match[1]} fails V1 semantic validation`);
  examples.set(match[1], policy);
}
assert.equal(examples.size, 4, "Draft must contain the four checked policy examples");

const readJson = async (relative) => {
  const file = path.join(root, relative);
  return parseJson(await readFile(file, "utf8"), file);
};
assert.deepEqual(examples.get("minimal-report-only"), await readJson("examples/v1/minimal-report-only.json"));
assert.deepEqual(examples.get("limited-web-testing"), await readJson("examples/v1/limited-web-testing.json"));
assert.deepEqual(examples.get("shared-policy-multiple-hosts"), await readJson("examples/v1/shared-policy-multiple-hosts/cvd-policy.json"));

for (const id of [...source.matchAll(/<!-- evaluation-vector: ([a-z0-9-]+) -->/g)].map((match) => match[1])) {
  const vector = evaluationCases.find((item) => item.id === id);
  assert(vector, `Unknown evaluation vector cited by Draft: ${id}`);
  const marker = source.indexOf(`<!-- evaluation-vector: ${id} -->`);
  const context = source.slice(Math.max(0, marker - 700), marker);
  assert(context.includes(`\`${vector.expected.status}\``), `${id} example omits expected status`);
}

const outVector = evaluationCases.find(({ id }) => id === "scope-out-wins");
const outBase = await readJson(`tests/v1/policy/valid/${outVector.base}`);
assert.deepEqual(examples.get("scope-out-wins"), applyPointerValues(outBase, outVector.set));

const mapping = [
  "# V1 Requirement-to-Draft Mapping",
  "",
  "Generated by `draft/scripts/check-draft.mjs --write-mapping` from the canonical Kramdown-RFC source and the frozen V1 requirements map. Do not edit by hand.",
  "",
  `All ${expectedIds.length} Version 1 requirement IDs are represented exactly once in the Draft source.`,
  "",
  "| Requirement | Draft section | Executable baseline checks |",
  "| --- | --- | --- |",
  ...expectedIds.map((id) => {
    const heading = mapped.get(id);
    return `| \`${id}\` | [${heading.title}](draft-behring-cvd-policy.md#${heading.anchor}) | ${requirements[id].map((item) => `\`${item}\``).join("<br>")} |`;
  }),
  "",
].join("\n");

if (process.argv.includes("--write-mapping")) {
  await writeFile(mappingPath, mapping);
} else {
  assert.equal(await readFile(mappingPath, "utf8"), mapping, "REQUIREMENTS-MAPPING.md is stale; regenerate it with --write-mapping");
}

if (process.argv.includes("--check-rendered")) {
  const buildDir = path.join(draftDir, "build");
  const basename = "draft-behring-cvd-policy-00";
  const [xml, text, html] = await Promise.all(
    ["xml", "txt", "html"].map((extension) =>
      readFile(path.join(buildDir, `${basename}.${extension}`), "utf8")),
  );
  assert.match(xml, /<rfc\b[^>]*\bversion="3"/i, "RFCXML must declare version 3");
  assert(!/<(?:spanx|texttable)\b/i.test(xml), "RFCXML v3 must not contain spanx or texttable");
  const jsonBlocks = [...xml.matchAll(/<(?:sourcecode|artwork)\b[^>]*type="json"[^>]*>([\s\S]*?)<\/(?:sourcecode|artwork)>/gi)];
  assert.equal(jsonBlocks.length, 4, "RFCXML must contain four JSON source blocks");
  for (const block of jsonBlocks) {
    assert(block[1].includes("\n") && block[1].includes('"cvd_policy"'), "RFCXML JSON example collapsed");
  }
  assert.match(xml, /<(?:sourcecode|artwork)\b[^>]*type="text"[^>]*>[\s\S]*?CVD-Policy:[\s\S]*?<\/(?:sourcecode|artwork)>/i);
  assert.match(html, /<pre\b[\s\S]*?cvd_policy[\s\S]*?<\/pre>/i, "HTML JSON example collapsed");
  assert.match(html, /<pre\b[\s\S]*?CVD-Policy:[\s\S]*?<\/pre>/i, "HTML security.txt example collapsed");
  assert((text.match(/^\s+"cvd_policy": 1,/gm) ?? []).length >= 4, "TXT JSON examples are not multiline and indented");
  assert.match(text, /^\s+Contact: mailto:security@example\.com$/m, "TXT security.txt example collapsed");
}

console.log(`Draft checks passed: ${expectedIds.length} requirements, ${examples.size} policy examples, 2 evaluation vectors.`);
