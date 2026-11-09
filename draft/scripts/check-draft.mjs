import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  applyPointerValues,
  parseJsonText,
  semanticIssues,
} from "../../scripts/v1-validation.mjs";
import {
  assessCsafDeclaration,
  createCsafExtensionValidator,
} from "../../scripts/csaf-reporting-validation.mjs";

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
const contractPath = path.join(root, "extensions/csaf-vulnerability-report-v1/csaf-policy-contract.json");
const extensionSchemaPath = path.join(root, "extensions/csaf-vulnerability-report-v1/csaf-policy-extension.schema.json");
const evaluationPath = path.join(root, "tests/v1/evaluation/cases.json");
const requirements = parseJson(await readFile(requirementsPath, "utf8"), requirementsPath);
const schema = parseJson(await readFile(schemaPath, "utf8"), schemaPath);
const contract = parseJson(await readFile(contractPath, "utf8"), contractPath);
const extensionSchema = parseJson(await readFile(extensionSchemaPath, "utf8"), extensionSchemaPath);
const evaluationCases = parseJson(await readFile(evaluationPath, "utf8"), evaluationPath);

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const validateExtension = createCsafExtensionValidator(extensionSchema);

const slug = (heading) => heading
  .toLowerCase()
  .replace(/[`*_]/g, "")
  .replace(/[^a-z0-9 -]/g, "")
  .trim()
  .replace(/\s+/g, "-");

const headings = [];
for (const match of source.matchAll(/^(#{1,6}) (.+)$/gm)) {
  const explicitAnchor = match[2].match(/\s+\{#([a-z0-9-]+)\}\s*$/);
  const title = explicitAnchor ? match[2].slice(0, explicitAnchor.index).trim() : match[2];
  headings.push({ offset: match.index, title, anchor: explicitAnchor?.[1] ?? slug(title) });
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
assert.equal(expectedIds.length, 85, "All 71 existing and 14 new CSAF requirements must be present");

const frontmatter = source.slice(0, source.indexOf("\n--- abstract"));
const externalReferences = new Set([...frontmatter.matchAll(/^  ([A-Z][A-Z0-9.-]*):/gm)].map((match) => match[1]));
for (const match of source.matchAll(/\{\{([^}]+)\}\}/g)) {
  const reference = match[1];
  assert(anchors.has(reference) || externalReferences.has(reference), `Unknown Draft reference: ${reference}`);
}

assert.match(source, /^title: Machine-Readable Coordinated Vulnerability Disclosure Policies$/m);
assert.match(source, /^docname: draft-behring-cvd-policy-01$/m);
assert.match(source, /^date: 2026-11-08$/m);
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
  "CSAF Vulnerability Report Declaration",
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
  "Changes from -00",
]) {
  assert(headings.some((item) => item.title === heading), `Missing required section: ${heading}`);
}
assert.equal(
  headings.findIndex(({ title }) => title === "Security Considerations"),
  headings.findIndex(({ title }) => title === "Implementation Status") + 1,
  "Implementation Status must immediately precede Security Considerations",
);
assert.match(source, /e8b26c05482c2cee9872adcc8fa2fd18b2e53214/);
assert.match(source, /0221629e2bb6702ccc24ddb84fcaf5dc7df87c8d/);
assert.match(source, /No\s+implementation or independent interoperability evidence for that declaration\s+is recorded here/);

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
const exampleMarkers = [...source.matchAll(/<!-- policy-example: ([a-z0-9-]+) -->/g)];
const jsonFences = [...source.matchAll(/^~~~ json\s*\r?\n([\s\S]*?)\r?\n~~~\s*$/gm)];
assert.equal(jsonFences.length, 5, "Draft must not contain unassigned JSON code blocks");
const unfoldRfc8792 = (text) => {
  const lines = text.split(/\r?\n/);
  assert.equal(lines[0], "NOTE: '\\' line wrapping per RFC 8792", "RFC 8792 example must start with the exact NOTE header");
  assert.equal(lines[1], "", "RFC 8792 NOTE header must be followed by exactly one blank line");
  return lines.slice(2).join("\n").replace(/\\\r?\n[ \t]*/g, "");
};
const rfc8792Fold = (indent) =>
  `NOTE: '\\' line wrapping per RFC 8792\n\n{\n  "value": "left\\\n${indent}right"\n}`;
const foldedWithIndent = unfoldRfc8792(rfc8792Fold("  "));
assert.equal(unfoldRfc8792(rfc8792Fold("")), foldedWithIndent, "RFC 8792 continuation may start with or without indentation");
assert.equal(foldedWithIndent, '{\n  "value": "leftright"\n}', "RFC 8792 continuation must remove its marker and following whitespace");
assert.throws(
  () => unfoldRfc8792(rfc8792Fold("  ").replace("NOTE: '\\' line wrapping per RFC 8792", "NOTE: alternate header")),
  /exact NOTE header/,
  "RFC 8792 NOTE header must remain exact",
);
for (const [index, marker] of exampleMarkers.entries()) {
  const id = marker[1];
  assert(!examples.has(id), `Duplicate policy example marker: ${id}`);
  const nextMarkerOffset = exampleMarkers[index + 1]?.index ?? source.length;
  const matchingFences = jsonFences.filter(({ index: fenceOffset }) => fenceOffset > marker.index && fenceOffset < nextMarkerOffset);
  assert.equal(matchingFences.length, 1, `${id} marker must identify exactly one following JSON block, allowing intervening prose`);
  const raw = matchingFences[0][1];
  const json = id === "csaf-reporting" ? unfoldRfc8792(raw) : raw;
  const policy = parseJsonText(json);
  assert(validate(policy), `${id} fails the V1 schema: ${ajv.errorsText(validate.errors)}`);
  assert.deepEqual(semanticIssues(policy), [], `${id} fails V1 semantic validation`);
  examples.set(id, policy);
}
assert.equal(examples.size, 5, "Draft must contain all five checked policy examples");

const readJson = async (relative) => {
  const file = path.join(root, relative);
  return parseJson(await readFile(file, "utf8"), file);
};
assert.deepEqual(examples.get("minimal-report-only"), await readJson("examples/v1/minimal-report-only.json"));
assert.deepEqual(examples.get("limited-web-testing"), await readJson("examples/v1/limited-web-testing.json"));
assert.deepEqual(examples.get("shared-policy-multiple-hosts"), await readJson("examples/v1/shared-policy-multiple-hosts/cvd-policy.json"));
const csafExample = await readJson("examples/v1/csaf-reporting-policy.example.json");
assert.deepEqual(examples.get("csaf-reporting"), csafExample, "Unfolded Draft CSAF example must equal its standalone JSON file");
const csafResult = assessCsafDeclaration(csafExample, validateExtension, contract);
assert.deepEqual(csafResult, { status: "advertised", channels: ["mailto:security@example.com"] });

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
  const basename = "draft-behring-cvd-policy-01";
  const [xml, text, html] = await Promise.all(
    ["xml", "txt", "html"].map((extension) =>
      readFile(path.join(buildDir, `${basename}.${extension}`), "utf8")),
  );
  assert.match(xml, /<rfc\b[^>]*\bversion="3"/i, "RFCXML must declare version 3");
  assert(!/<(?:spanx|texttable)\b/i.test(xml), "RFCXML v3 must not contain spanx or texttable");
  const jsonBlocks = [...xml.matchAll(/<(?:sourcecode|artwork)\b[^>]*type="json"[^>]*>([\s\S]*?)<\/(?:sourcecode|artwork)>/gi)];
  assert.equal(jsonBlocks.length, 5, "RFCXML must contain all five JSON policy examples");
  for (const block of jsonBlocks) {
    assert(block[1].includes("\n") && block[1].includes('"cvd_policy"'), "RFCXML JSON example collapsed");
  }
  assert.match(xml, /<(?:sourcecode|artwork)\b[^>]*type="text"[^>]*>[\s\S]*?CVD-Policy:[\s\S]*?<\/(?:sourcecode|artwork)>/i);
  assert.match(html, /<pre\b[\s\S]*?cvd_policy[\s\S]*?<\/pre>/i, "HTML JSON example collapsed");
  assert.match(html, /<pre\b[\s\S]*?CVD-Policy:[\s\S]*?<\/pre>/i, "HTML security.txt example collapsed");
  assert((html.match(/"cvd_policy": 1,/g) ?? []).length >= 5, "HTML must contain all five JSON policy examples");
  assert((text.match(/^\s+"cvd_policy": 1,/gm) ?? []).length >= 5, "TXT must contain all five multiline JSON policy examples");
  assert.match(text, /^\s+Contact: mailto:security@example\.com$/m, "TXT security.txt example collapsed");

  const decodeEntities = (value) => value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
  const parseRenderedPolicy = (body, label) => {
    const decoded = decodeEntities(body).trim();
    const json = decoded.startsWith("NOTE:") ? unfoldRfc8792(decoded) : decoded;
    const policy = parseJsonText(json);
    assert(validate(policy), `${label} fails the V1 schema: ${ajv.errorsText(validate.errors)}`);
    assert.deepEqual(semanticIssues(policy), [], `${label} fails V1 semantic validation`);
    return policy;
  };
  const assertMatchesCanonicalExamples = (policies, label) => {
    assert.equal(policies.length, examples.size, `${label} must contain every policy example exactly once`);
    const matchedIds = new Set();
    for (const [index, policy] of policies.entries()) {
      const matches = [...examples].filter(([, canonical]) => isDeepStrictEqual(policy, canonical));
      assert.equal(matches.length, 1, `${label} example ${index + 1} must equal exactly one canonical source example`);
      assert(!matchedIds.has(matches[0][0]), `${label} duplicates policy example ${matches[0][0]}`);
      matchedIds.add(matches[0][0]);
    }
    assert.deepEqual([...matchedIds].sort(), [...examples.keys()].sort(), `${label} must match all canonical source examples`);
  };

  const renderedXmlPolicies = jsonBlocks.map(([, body], index) => {
    const trimmed = body.trim();
    const cdata = trimmed.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
    return parseRenderedPolicy(cdata?.[1] ?? trimmed, `RFCXML JSON example ${index + 1}`);
  });
  assertMatchesCanonicalExamples(renderedXmlPolicies, "RFCXML");
  const xmlCsafPolicies = renderedXmlPolicies.filter((policy) => isDeepStrictEqual(policy, csafExample));
  assert.equal(xmlCsafPolicies.length, 1, "RFCXML must include the CSAF policy example exactly once");
  assert.deepEqual(
    assessCsafDeclaration(xmlCsafPolicies[0], validateExtension, contract),
    { status: "advertised", channels: ["mailto:security@example.com"] },
  );

  const htmlPolicyBlocks = [...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi)]
    .filter(([, body]) => {
      const decoded = decodeEntities(body).trim();
      return decoded.startsWith("{") || decoded.startsWith("NOTE:");
    });
  const renderedHtmlPolicies = htmlPolicyBlocks.map(([, body], index) =>
    parseRenderedPolicy(body, `HTML JSON example ${index + 1}`));
  assertMatchesCanonicalExamples(renderedHtmlPolicies, "HTML");

  const htmlCsafOffset = html.indexOf('<div id="csaf-reporting-example">');
  assert(htmlCsafOffset >= 0, "HTML must include the CSAF example section");
  const htmlCsafSection = html.slice(htmlCsafOffset);
  const htmlCsaf = htmlCsafSection.match(/<pre\b[^>]*>([\s\S]*?)<\/pre>/i);
  assert(htmlCsaf, "HTML must include the CSAF policy code block");
  assert.deepEqual(parseRenderedPolicy(htmlCsaf[1], "HTML CSAF policy example"), csafExample);

  const textNotes = [...text.matchAll(/NOTE: '\\' line wrapping per RFC 8792/g)];
  assert.equal(textNotes.length, 1, "TXT must contain exactly one RFC 8792 NOTE header");
  const textNoteOffset = textNotes[0].index;
  const textBlockEnd = text.indexOf("The declaration-assessment result is", textNoteOffset);
  assert(textBlockEnd > textNoteOffset, "TXT CSAF example block must be followed by its assessment text");
  const textBlock = text.slice(textNoteOffset, textBlockEnd)
    .replace(/^\s*Behring & Berg.*\[Page \d+\]\s*$/gm, "")
    .replace(/^\s*Internet-Draft\s+Machine-Readable CVD Policies.*$/gm, "")
    .replace(/^\s*\f\s*$/gm, "")
    .trim();
  assert.deepEqual(parseRenderedPolicy(textBlock, "TXT CSAF policy example"), csafExample);
}

console.log(`Draft checks passed: ${expectedIds.length} requirements, ${examples.size} policy examples, 2 evaluation vectors.`);
