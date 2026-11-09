import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { assessCsafDeclaration, createCsafExtensionValidator } from "./csaf-reporting-validation.mjs";
import { parseJsonText, semanticIssues } from "./v1-validation.mjs";

const CASES_SHA256 = "2acdfeca5dab0c48b863df35f52842a36e83c6ebeff07204d96d22581f9d449b";
const readJson = (root, relative) => JSON.parse(readFileSync(join(root, relative), "utf8"));

export function validateCsafReportingCorpus(root) {
  const artifactDir = "extensions/csaf-vulnerability-report-v1";
  const contract = readJson(root, `${artifactDir}/csaf-policy-contract.json`);
  const extensionSchema = readJson(root, `${artifactDir}/csaf-policy-extension.schema.json`);
  const casesPath = join(root, artifactDir, "csaf-policy-cases.json");
  const casesText = readFileSync(casesPath, "utf8");
  assert.equal(createHash("sha256").update(casesText).digest("hex"), CASES_SHA256, "Shared 42-case corpus must remain byte-for-byte unchanged");
  const sharedCases = JSON.parse(casesText);
  const extra = readJson(root, "tests/v1/csaf-reporting/extra-cases.json");
  const requirementMap = readJson(root, "tests/v1/csaf-reporting/requirements.json");
  const assertions = readJson(root, "tests/v1/assertions.json");

  assert.equal(sharedCases.cases.length, 42, "The original shared corpus must contain exactly 42 cases");
  assert.deepEqual(contract.requirement_ids, Object.keys(requirementMap).sort(), "Every new CSR requirement needs a stable test mapping");
  assert.equal(extra.cases.length, 17, "All supplementary RFC 3986 URI edge cases must be present");

  const coreAjv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(coreAjv);
  const validateCore = coreAjv.compile(readJson(root, "schema/cvd-policy-1.schema.json"));
  const validateExtension = createCsafExtensionValidator(extensionSchema);
  const sharedById = new Map(sharedCases.cases.map((item) => [item.id, item]));
  const extraById = new Map(extra.cases.map((item) => [item.id, item]));
  const assertionIds = new Set(assertions.map(({ id }) => id));

  assert.equal(sharedById.size, 42, "Shared case IDs must be unique");
  assert.equal(extraById.size, extra.cases.length, "Supplementary case IDs must be unique");
  for (const [requirement, tests] of Object.entries(requirementMap)) {
    assert.match(requirement, /^CSR-\d{3}$/);
    assert(tests.length > 0, `${requirement} has no test mapping`);
    for (const test of tests) {
      const [kind, id] = test.split(":", 2);
      if (kind === "shared") assert(sharedById.has(id), `${requirement} refers to missing shared case ${id}`);
      else if (kind === "assertion") assert(assertionIds.has(id), `${requirement} refers to missing assertion ${id}`);
      else if (kind === "csaf-reporting-extra") assert(extraById.has(id), `${requirement} refers to missing supplementary case ${id}`);
      else if (kind === "supplementary") assert.equal(id, "all-rfc3986-uri-edge-cases");
      else if (kind === "csaf-reporting") assert.equal(id, "no-fetch");
      else assert.fail(`${requirement} has unknown test reference ${test}`);
    }
  }

  for (const testCase of sharedCases.cases) {
    const { input, expected } = testCase;
    assert(input?.now && input?.query && expected, `${testCase.id} is incomplete`);
    assert.equal(expected.declaration_network_requests, 0, `${testCase.id} must not fetch declaration identifiers`);
    assert(new Set(["publisher-stated-permitted", "publisher-stated-prohibited", "not-covered", "authority-not-established", "conditions-not-satisfied", "invalid-policy", "unsupported-policy"]).has(expected.testing_permission_status), `${testCase.id} has an invalid permission expectation`);
    assert(new Set([null, "not-advertised", "invalid", "unsupported", "advertised"]).has(expected.assessment), `${testCase.id} has an invalid declaration assessment`);
    assert(Array.isArray(expected.declared_channels_in_contact_preference_order), `${testCase.id} lacks its declared-channel expectation`);
    assert.equal(typeof expected.usable_as_current_host_csaf_statement, "boolean", `${testCase.id} lacks host-use expectation`);

    let policy;
    let prerequisitesPassed = false;
    try {
      const text = input.policy_text ?? JSON.stringify(input.policy);
      policy = parseJsonText(text);
      prerequisitesPassed = validateCore(policy) && semanticIssues(policy, new Date(input.now)).every(({ code }) => code === "policy_expired");
    } catch {
      prerequisitesPassed = false;
    }

    if (!prerequisitesPassed) {
      assert.equal(expected.assessment, null, `${testCase.id} must stop before capability assessment on a core error`);
      assert.deepEqual(expected.declared_channels_in_contact_preference_order, [], `${testCase.id} must expose no channels before capability assessment`);
      continue;
    }

    const result = assessCsafDeclaration(policy, validateExtension, contract);
    assert.equal(result.status, expected.assessment, `${testCase.id} declaration state`);
    assert.deepEqual(result.channels, expected.declared_channels_in_contact_preference_order, `${testCase.id} channel order and atomicity`);
    if (result.status !== "advertised") assert.deepEqual(result.channels, [], `${testCase.id} must not expose partial channels`);
    if (expected.usable_as_current_host_csaf_statement) {
      // Check fixture evidence only; Web/Core tests execute host-use and permission evaluation.
      assert.equal(result.status, "advertised", `${testCase.id} host use requires an advertised declaration`);
      assert.equal(input.authority?.established, true, `${testCase.id} host use needs established Authority evidence`);
      assert(Date.parse(policy.expires) > Date.parse(input.now), `${testCase.id} host use needs an unexpired policy`);
      assert(Date.parse(input.authority.securityTxtExpires) > Date.parse(input.now), `${testCase.id} host use needs unexpired security.txt evidence`);
      assert.equal(input.query.policyRetrieval?.requestedUri, input.authority.cvdPolicyUri, `${testCase.id} retrieval evidence must match the discovered Policy URI`);
    }
  }

  assert(sharedById.get("report-only-still-advertises").expected.usable_as_current_host_csaf_statement, "A report-only policy can state current CSAF support");
  assert.equal(sharedById.get("report-only-still-advertises").expected.testing_permission_status, "publisher-stated-prohibited", "Positive Testing Permission is not required for report support");
  assert.equal(sharedById.get("critical-use-remains-unsupported").expected.testing_permission_status, "unsupported-policy");
  assert.match(sharedById.get("critical-use-remains-unsupported").reason, /understoodExtensions/);

  const contact = "mailto:security@example.com";
  for (const testCase of extra.cases) {
    const policy = {
      contact: { channels: [contact] },
      extensions: {
        [contract.extension_identifier]: {
          channels: [{ uri: contact, specification: testCase.specification }],
        },
      },
    };
    const result = assessCsafDeclaration(policy, validateExtension, contract);
    assert.equal(result.status, testCase.expected, `RFC 3986 case ${testCase.id}`);
    assert.deepEqual(result.channels, [], `${testCase.id} never yields a supported channel`);
  }

  console.log(`CSAF declaration corpus passed: ${sharedCases.cases.length} unchanged shared cases, ${extra.cases.length} supplementary URI cases, ${Object.keys(requirementMap).length} stable requirement mappings. Core Permission and executable host-use evaluation remain Web/Core test responsibilities.`);
}
