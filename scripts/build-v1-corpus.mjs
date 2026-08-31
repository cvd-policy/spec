import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const invalidDir = join(root, "tests", "v1", "policy", "invalid");
const rawDir = join(root, "tests", "v1", "policy", "raw-invalid");
const securityDir = join(root, "tests", "v1", "security-txt");
const evaluationDir = join(root, "tests", "v1", "evaluation");
for (const dir of [invalidDir, rawDir, securityDir, evaluationDir]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

const read = (path) => {
  try {
    return JSON.parse(readFileSync(join(root, path), "utf8"));
  } catch (error) {
    throw new Error(`Cannot parse ${path}`, { cause: error });
  }
};
const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const clone = structuredClone;
const base = read("examples/v1/limited-web-testing.json");

const expected = {};
function invalid(name, diagnostic, schema, requirements, mutate) {
  const doc = clone(base);
  mutate(doc);
  const file = `${name}.json`;
  writeJson(join(invalidDir, file), doc);
  expected[file] = {
    status: diagnostic === "policy_version_unsupported" ? "unsupported-policy" : "invalid-policy",
    layer: schema ? "schema" : "semantic",
    requirements,
  };
}

invalid("version-string", "policy_version_unsupported", true, ["DOC-001"], (d) => {
  d.cvd_policy = "1";
});
invalid("version-0.2", "policy_version_unsupported", true, ["DOC-001"], (d) => {
  d.cvd_policy = "0.2";
});
invalid("required-missing", "policy_schema_invalid", true, ["DOC-008"], (d) => {
  delete d.reporting;
});
invalid("unknown-top-level", "policy_schema_invalid", true, ["DOC-007"], (d) => {
  d.canonical = "https://example.com/cvd-policy.json";
});
invalid("unknown-condition", "policy_schema_invalid", true, ["COND-001"], (d) => {
  d.testing.rules[0].conditions.window = "night";
});
invalid("timestamp-invalid", "policy_schema_invalid", true, ["DOC-003"], (d) => {
  d.expires = "2027-02-30T08:00:00Z";
});
invalid("time-order", "policy_time_order_invalid", false, ["DOC-009"], (d) => {
  d.expires = d.last_updated;
});
invalid("expired", "policy_expired", false, ["DOC-010"], (d) => {
  d.expires = "2026-08-29T09:00:00Z";
});
invalid("contact-empty", "policy_schema_invalid", true, ["DOC-013"], (d) => {
  d.contact.channels = [];
});
invalid("contact-duplicate", "policy_schema_invalid", true, ["DOC-013"], (d) => {
  d.contact.channels = [d.contact.channels[0], d.contact.channels[0]];
});
invalid("language-invalid", "policy_language_tag_invalid", false, ["DOC-015"], (d) => {
  d.contact.preferred_languages = ["en-123456789"];
});
invalid("http-web-contact", "policy_schema_invalid", true, ["DOC-013"], (d) => {
  d.contact.channels = ["http://example.com/contact"];
});
invalid("contact-relative", "policy_schema_invalid", true, ["DOC-013"], (d) => {
  d.contact.channels = ["/security"];
});
invalid("contact-mixed-invalid", "policy_schema_invalid", true, ["DOC-013"], (d) => {
  d.contact.channels.push("/security");
});
invalid("contact-https-userinfo", "policy_uri_invalid", false, ["DOC-014"], (d) => {
  d.contact.channels = ["https://user@example.com/security"];
});
invalid("contact-https-fragment", "policy_schema_invalid", true, ["DOC-014"], (d) => {
  d.contact.channels = ["https://example.com/security#contact"];
});
invalid("organization-userinfo", "policy_uri_invalid", false, ["DOC-012"], (d) => {
  d.organization.uri = "https://user@example.com/";
});
invalid("extension-id-relative", "policy_schema_invalid", true, ["EXT-001"], (d) => {
  d.extensions = { relative: true };
});
invalid("critical-extension-missing", "policy_critical_extension_missing", false, ["EXT-001"], (d) => {
  d.critical_extensions = ["https://example.org/ext/missing"];
  d.extensions = {};
});
invalid("critical-extension-duplicate", "policy_schema_invalid", true, ["EXT-001"], (d) => {
  d.critical_extensions = ["https://example.org/ext/a", "https://example.org/ext/a"];
  d.extensions = { "https://example.org/ext/a": true };
});
invalid("scope-wildcard", "policy_schema_invalid", true, ["SCOP-002"], (d) => {
  d.reporting_scope.web[0].host = "*.example.com";
});
invalid("scope-host-scheme", "policy_schema_invalid", true, ["SCOP-002"], (d) => {
  d.reporting_scope.web[0].host = "https://example.com";
});
invalid("scope-host-port", "policy_scope_invalid", false, ["SCOP-002"], (d) => {
  d.reporting_scope.web[0].host = "example.com:443";
});
invalid("scope-ip-subdomains", "policy_scope_invalid", false, ["SCOP-004"], (d) => {
  d.reporting_scope.web[0].host = "192.0.2.1";
  d.reporting_scope.web[0].include_subdomains = true;
});
invalid("scope-id-duplicate", "policy_scope_id_duplicate", false, ["SCOP-001"], (d) => {
  d.reporting_scope.products = [{ id: "main-web", state: "in", name: "Product" }];
});
invalid("rule-id-duplicate", "policy_scope_id_duplicate", false, ["SCOP-001"], (d) => {
  d.testing.rules.push({ ...clone(d.testing.rules[0]), activity: "fuzzing" });
});
invalid("target-reference-unknown", "policy_target_reference_invalid", false, ["TEST-006"], (d) => {
  d.testing.rules[0].target_ids = ["unknown"];
});
invalid("target-reference-out", "policy_target_reference_invalid", false, ["TEST-006"], (d) => {
  d.reporting_scope.web.push({ id: "excluded", state: "out", host: "example.com", schemes: ["https"], path_prefix: "/admin", include_subdomains: false });
  d.testing.rules[0].target_ids = ["excluded"];
});
invalid("target-reference-product", "policy_target_reference_invalid", false, ["SCOP-009", "TEST-006"], (d) => {
  d.reporting_scope.products = [{ id: "product", state: "in", name: "Product" }];
  d.testing.rules[0].target_ids = ["product"];
});
invalid("posture-conflict-report-only", "policy_posture_conflict", false, ["TEST-002"], (d) => {
  d.research.posture = "report_only";
});
invalid("permitted-target-missing", "policy_schema_invalid", true, ["TEST-004"], (d) => {
  delete d.testing.rules[0].target_ids;
});
invalid("state-allowed", "policy_schema_invalid", true, ["TEST-003"], (d) => {
  d.testing.rules[0].state = "allowed";
});
invalid("testing-default", "policy_schema_invalid", true, ["DOC-008"], (d) => {
  d.testing.default = "permitted";
});
invalid("explicit-order", "policy_schema_invalid", true, ["SCOP-008"], (d) => {
  d.reporting_scope.explicit_order = true;
});
invalid("automated-rate-missing", "policy_schema_invalid", true, ["COND-002"], (d) => {
  delete d.testing.rules[0].conditions.max_requests_per_second;
});
invalid("automated-concurrency-missing", "policy_schema_invalid", true, ["COND-002"], (d) => {
  delete d.testing.rules[0].conditions.max_concurrent_requests;
});
invalid("credential-test-accounts-missing", "policy_schema_invalid", true, ["COND-003"], (d) => {
  d.testing.rules[0].activity = "credential_testing";
});
invalid("credential-test-accounts-false", "policy_schema_invalid", true, ["COND-003"], (d) => {
  d.testing.rules[0].activity = "credential_testing";
  d.testing.rules[0].conditions.test_accounts_only = false;
});
invalid("activity-typo", "policy_schema_invalid", true, ["TEST-003"], (d) => {
  d.testing.rules[0].activity = "automated_scaning";
});
invalid("activity-relative-extension", "policy_schema_invalid", true, ["TEST-003"], (d) => {
  d.testing.rules[0].activity = "example_extension";
});
writeJson(join(root, "tests", "v1", "expected.json"), expected);

const rawCases = {
  "duplicate-top-level.raw.json": '{"cvd_policy":1,"cvd_policy":1}',
  "duplicate-state.raw.json": '{"scope":{"state":"in","state":"out"}}',
  "duplicate-expires.raw.json": '{"expires":"2027-01-01T00:00:00Z","expires":"2028-01-01T00:00:00Z"}',
  "duplicate-condition.raw.json": '{"conditions":{"max_concurrent_requests":1,"max_concurrent_requests":2}}',
  "trailing-comma.raw.json": '{"cvd_policy":1,}',
  "comment.raw.json": '{"cvd_policy":1/* comment */}',
  "multiple-documents.raw.json": '{} {}',
  "non-json-number.raw.json": '{"value":NaN}',
};
for (const [file, text] of Object.entries(rawCases)) {
  writeFileSync(join(rawDir, file), `${text}\n`);
}
writeJson(join(root, "tests", "v1", "raw-expected.json"),
  Object.fromEntries(Object.keys(rawCases).map((file) => [file, {
    status: "invalid-policy",
    layer: "parse",
    requirements: ["DOC-003", "DOC-004", "DOC-005"],
  }])));

const securityCases = [
  {
    id: "valid-exact",
    text: "Contact: mailto:security@example.com\nCVD-Policy: https://example.com/cvd-policy.json\nExpires: 2027-02-28T08:00:00Z\n",
    context: { requestedUri: "https://example.com/.well-known/security.txt", finalUri: "https://example.com/.well-known/security.txt", redirectChain: [], retrievedAt: "2026-08-29T10:00:00Z" },
    expected: { established: true, discoveryHost: "example.com", cvdPolicyUri: "https://example.com/cvd-policy.json" },
    requirements: ["DISC-001", "DISC-004", "AUTH-001"],
  },
  {
    id: "valid-case-insensitive-external",
    text: "contact: mailto:security@example.com\ncvd-policy: https://policies.provider.example/example.json\nexpires: 2027-02-28T08:00:00Z\nPolicy: https://example.com/human\nPolicy: https://example.com/other\n",
    context: { requestedUri: "https://example.com/.well-known/security.txt", finalUri: "https://example.com/.well-known/security.txt", redirectChain: [], retrievedAt: "2026-08-29T10:00:00Z" },
    expected: { established: true, discoveryHost: "example.com", cvdPolicyUri: "https://policies.provider.example/example.json" },
    requirements: ["DISC-002", "AUTH-002"],
  },
  ...[
    ["missing-field", "Contact: mailto:security@example.com\nExpires: 2027-02-28T08:00:00Z\n", "security_txt_cvd_policy_missing", "DISC-003"],
    ["duplicate-field", "Contact: mailto:security@example.com\nCVD-Policy: https://example.com/a.json\nCVD-Policy: https://example.com/b.json\nExpires: 2027-02-28T08:00:00Z\n", "security_txt_cvd_policy_duplicate", "DISC-002"],
    ["relative-uri", "Contact: mailto:security@example.com\nCVD-Policy: /policy.json\nExpires: 2027-02-28T08:00:00Z\n", "security_txt_cvd_policy_uri_invalid", "DISC-001"],
    ["http-uri", "Contact: mailto:security@example.com\nCVD-Policy: http://example.com/policy.json\nExpires: 2027-02-28T08:00:00Z\n", "security_txt_cvd_policy_uri_invalid", "DISC-001"],
    ["userinfo-uri", "Contact: mailto:security@example.com\nCVD-Policy: https://user@example.com/policy.json\nExpires: 2027-02-28T08:00:00Z\n", "security_txt_cvd_policy_uri_invalid", "DISC-001"],
    ["fragment-uri", "Contact: mailto:security@example.com\nCVD-Policy: https://example.com/policy.json#part\nExpires: 2027-02-28T08:00:00Z\n", "security_txt_cvd_policy_uri_invalid", "DISC-001"],
    ["expired", "Contact: mailto:security@example.com\nCVD-Policy: https://example.com/policy.json\nExpires: 2026-08-29T09:00:00Z\n", "security_txt_expired", "DISC-004"],
    ["contact-missing", "CVD-Policy: https://example.com/policy.json\nExpires: 2027-02-28T08:00:00Z\n", "security_txt_contact_missing", "DISC-004"],
    ["contact-invalid", "Contact: not-a-uri\nCVD-Policy: https://example.com/policy.json\nExpires: 2027-02-28T08:00:00Z\n", "security_txt_contact_invalid", "DISC-004"],
    ["expires-missing", "Contact: mailto:security@example.com\nCVD-Policy: https://example.com/policy.json\n", "security_txt_expires_missing", "DISC-004"],
    ["expires-duplicate", "Contact: mailto:security@example.com\nCVD-Policy: https://example.com/policy.json\nExpires: 2027-02-28T08:00:00Z\nExpires: 2027-03-01T08:00:00Z\n", "DISC-004"],
    ["expires-invalid", "Contact: mailto:security@example.com\nCVD-Policy: https://example.com/policy.json\nExpires: not-a-timestamp\n", "DISC-004"],
  ].map(([id, text, ...metadata]) => ({
    id,
    text,
    context: { requestedUri: "https://example.com/.well-known/security.txt", finalUri: "https://example.com/.well-known/security.txt", redirectChain: [], retrievedAt: "2026-08-29T10:00:00Z" },
    expected: { established: false },
    requirements: [metadata.at(-1)],
  })),
  {
    id: "same-host-redirect",
    text: "Contact: mailto:security@example.com\nCVD-Policy: https://example.com/policy.json\nExpires: 2027-02-28T08:00:00Z\n",
    context: { requestedUri: "https://example.com/.well-known/security.txt", finalUri: "https://example.com/security.txt", redirectChain: ["https://example.com/security.txt"], retrievedAt: "2026-08-29T10:00:00Z" },
    expected: { established: true, discoveryHost: "example.com", cvdPolicyUri: "https://example.com/policy.json" },
    requirements: ["DISC-005", "AUTH-002"],
  },
  {
    id: "cross-host-redirect-canonical",
    text: "Contact: mailto:security@example.com\nCVD-Policy: https://provider.example/policy.json\nExpires: 2027-02-28T08:00:00Z\nCanonical: https://example.com/.well-known/security.txt\n",
    context: { requestedUri: "https://example.com/.well-known/security.txt", finalUri: "https://security.provider.example/file.txt", redirectChain: ["https://security.provider.example/file.txt"], retrievedAt: "2026-08-29T10:00:00Z" },
    expected: { established: true, discoveryHost: "example.com", cvdPolicyUri: "https://provider.example/policy.json" },
    requirements: ["DISC-005", "DISC-006", "AUTH-002"],
  },
  {
    id: "cross-host-redirect-mismatch",
    text: "Contact: mailto:security@example.com\nCVD-Policy: https://provider.example/policy.json\nExpires: 2027-02-28T08:00:00Z\nCanonical: https://security.provider.example/file.txt\n",
    context: { requestedUri: "https://example.com/.well-known/security.txt", finalUri: "https://security.provider.example/file.txt", redirectChain: ["https://security.provider.example/file.txt"], retrievedAt: "2026-08-29T10:00:00Z" },
    expected: { established: false },
    requirements: ["DISC-006"],
  },
];
writeJson(join(securityDir, "cases.json"), securityCases);

const evidence = {
  established: true,
  discoveryHost: "example.com",
  securityTxtUri: "https://example.com/.well-known/security.txt",
  cvdPolicyUri: "https://example.com/cvd-policy.json",
  securityTxtExpires: "2027-02-28T08:00:00Z",
};
const defaultQuery = {
  activity: "automated_scanning",
  target: "https://example.com/",
  plan: { requestsPerSecond: 1, concurrentRequests: 1, userAgent: "tool security-research/1" },
};
const evaluationCases = [
  ["permitted", {}, defaultQuery, evidence, "publisher-stated-permitted", "testing_rule_permitted", ["EVAL-004"]],
  ["authority-missing", {}, defaultQuery, null, "authority-not-established", "authority_evidence_missing", ["AUTH-001"]],
  ["authority-subdomain-mismatch", {}, { ...defaultQuery, target: "https://api.example.com/" }, evidence, "authority-not-established", "authority_host_mismatch", ["AUTH-003", "AUTH-004"]],
  ["authority-parent-mismatch", {}, { ...defaultQuery, target: "https://com/" }, evidence, "authority-not-established", "authority_host_mismatch", ["AUTH-004"]],
  ["scope-path-boundary", { "/reporting_scope/web/0/path_prefix": "/api" }, { ...defaultQuery, target: "https://example.com/apix" }, evidence, "not-covered", "scope_target_not_covered", ["SCOP-006"]],
  ["scope-query-fragment-ignored", { "/reporting_scope/web/0/path_prefix": "/api" }, { ...defaultQuery, target: "https://example.com/api?q=1#x" }, evidence, "publisher-stated-permitted", "testing_rule_permitted", ["SCOP-006"]],
  ["scope-out-wins", { "/reporting_scope/web": [base.reporting_scope.web[0], { id: "excluded", state: "out", host: "example.com", schemes: ["https"], path_prefix: "/", include_subdomains: false }] }, defaultQuery, evidence, "not-covered", "scope_target_excluded", ["SCOP-007", "SCOP-008"]],
  ["scope-out-wins-reversed", { "/reporting_scope/web": [{ id: "excluded", state: "out", host: "example.com", schemes: ["https"], path_prefix: "/", include_subdomains: false }, base.reporting_scope.web[0]] }, defaultQuery, evidence, "not-covered", "scope_target_excluded", ["SCOP-007", "SCOP-008"]],
  ["posture-report-only", { "/research/posture": "report_only", "/testing/rules/0/state": "prohibited" }, defaultQuery, evidence, "publisher-stated-prohibited", "testing_rule_prohibited", ["TEST-002"]],
  ["posture-report-only-no-matching-rule", { "/research/posture": "report_only", "/testing/rules/0/state": "prohibited", "/testing/rules/0/activity": "manual_testing" }, defaultQuery, evidence, "publisher-stated-prohibited", "testing_rule_prohibited", ["EVAL-003"]],
  ["rule-prohibited", { "/testing/rules": [base.testing.rules[0], { id: "deny", activity: "automated_scanning", state: "prohibited", target_ids: ["main-web"] }] }, defaultQuery, evidence, "publisher-stated-prohibited", "testing_rule_prohibited", ["TEST-007"]],
  ["rule-prohibited-global", { "/testing/rules": [base.testing.rules[0], { id: "deny-all", activity: "automated_scanning", state: "prohibited" }] }, defaultQuery, evidence, "publisher-stated-prohibited", "testing_rule_prohibited", ["TEST-005", "TEST-007"]],
  ["multiple-permits-one-satisfied", { "/testing/rules": [{ ...base.testing.rules[0], conditions: { ...base.testing.rules[0].conditions, max_requests_per_second: 0.5 } }, { ...base.testing.rules[0], id: "second-permit", conditions: { ...base.testing.rules[0].conditions, max_requests_per_second: 2 } }] }, defaultQuery, evidence, "publisher-stated-permitted", "testing_rule_permitted", ["SCOP-008", "EVAL-004"]],
  ["multiple-permits-none-satisfied", { "/testing/rules": [{ ...base.testing.rules[0], conditions: { ...base.testing.rules[0].conditions, max_requests_per_second: 0.25 } }, { ...base.testing.rules[0], id: "second-permit", conditions: { ...base.testing.rules[0].conditions, max_requests_per_second: 0.5 } }] }, defaultQuery, evidence, "conditions-not-satisfied", "conditions_exceeded", ["COND-004"]],
  ["rule-missing", {}, { ...defaultQuery, activity: "manual_testing" }, evidence, "not-covered", "testing_rule_missing", ["TEST-001"]],
  ["conditions-rate-missing", {}, { ...defaultQuery, plan: { concurrentRequests: 1, userAgent: "security-research" } }, evidence, "conditions-not-satisfied", "conditions_missing", ["COND-004"]],
  ["conditions-rate-exceeded", {}, { ...defaultQuery, plan: { requestsPerSecond: 3, concurrentRequests: 1, userAgent: "security-research" } }, evidence, "conditions-not-satisfied", "conditions_exceeded", ["COND-004"]],
  ["conditions-concurrency-missing", {}, { ...defaultQuery, plan: { requestsPerSecond: 1, userAgent: "security-research" } }, evidence, "conditions-not-satisfied", "conditions_missing", ["COND-004"]],
  ["conditions-concurrency-exceeded", {}, { ...defaultQuery, plan: { requestsPerSecond: 1, concurrentRequests: 3, userAgent: "security-research" } }, evidence, "conditions-not-satisfied", "conditions_exceeded", ["COND-004"]],
  ["conditions-user-agent-missing", {}, { ...defaultQuery, plan: { requestsPerSecond: 1, concurrentRequests: 1 } }, evidence, "conditions-not-satisfied", "conditions_user_agent_missing", ["COND-004"]],
  ["conditions-user-agent-token-missing", {}, { ...defaultQuery, plan: { requestsPerSecond: 1, concurrentRequests: 1, userAgent: "ordinary-tool" } }, evidence, "conditions-not-satisfied", "conditions_user_agent_missing", ["COND-004"]],
  ["credential-test-accounts-unconfirmed", { "/testing/rules/0/activity": "credential_testing", "/testing/rules/0/conditions/test_accounts_only": true }, { ...defaultQuery, activity: "credential_testing" }, evidence, "conditions-not-satisfied", "conditions_test_accounts_unconfirmed", ["COND-003", "COND-004"]],
  ["credential-test-accounts-confirmed", { "/testing/rules/0/activity": "credential_testing", "/testing/rules/0/conditions/test_accounts_only": true }, { ...defaultQuery, activity: "credential_testing", plan: { ...defaultQuery.plan, usesOnlyTestAccounts: true } }, evidence, "publisher-stated-permitted", "testing_rule_permitted", ["COND-003"]],
  ["policy-expired", { "/expires": "2026-08-29T09:00:00Z" }, defaultQuery, evidence, "invalid-policy", "policy_expired", ["DOC-010"]],
  ["critical-extension-unsupported", { "/critical_extensions": ["https://example.org/ext/a"], "/extensions": { "https://example.org/ext/a": true } }, defaultQuery, evidence, "unsupported-policy", "policy_critical_extension_unsupported", ["EXT-002"]],
  ["noncritical-extension-ignored", { "/extensions": { "https://example.org/ext/a": true } }, defaultQuery, evidence, "publisher-stated-permitted", "testing_rule_permitted", ["EXT-003"]],
  ["extension-activity-unsupported", { "/testing/rules/0/activity": "https://example.org/activity/custom" }, { ...defaultQuery, activity: "https://example.org/activity/custom" }, evidence, "unsupported-policy", "policy_activity_unsupported", ["TEST-003", "EXT-002"]],
  ["extension-activity-understood", { "/testing/rules/0/activity": "https://example.org/activity/custom" }, { ...defaultQuery, activity: "https://example.org/activity/custom", understoodExtensions: ["https://example.org/activity/custom"] }, evidence, "publisher-stated-permitted", "testing_rule_permitted", ["TEST-003"]],
  ["alternate-port-covered", { "/reporting_scope/web/0/ports": [8443] }, { ...defaultQuery, target: "https://example.com:8443/" }, evidence, "publisher-stated-permitted", "testing_rule_permitted", ["SCOP-005"]],
  ["alternate-port-not-covered", {}, { ...defaultQuery, target: "https://example.com:8443/" }, evidence, "not-covered", "scope_target_not_covered", ["SCOP-005"]],
  ["dns-case-trailing-dot", { "/reporting_scope/web/0/host": "EXAMPLE.COM." }, defaultQuery, evidence, "publisher-stated-permitted", "testing_rule_permitted", ["SCOP-003"]],
  ["idna-a-label", { "/reporting_scope/web/0/host": "xn--bcher-kva.example" }, { ...defaultQuery, target: "https://bücher.example/" }, { ...evidence, discoveryHost: "xn--bcher-kva.example", securityTxtUri: "https://xn--bcher-kva.example/.well-known/security.txt" }, "publisher-stated-permitted", "testing_rule_permitted", ["SCOP-003"]],
  ["ipv4", { "/reporting_scope/web/0/host": "192.0.2.1" }, { ...defaultQuery, target: "https://192.0.2.1/" }, { ...evidence, discoveryHost: "192.0.2.1", securityTxtUri: "https://192.0.2.1/.well-known/security.txt" }, "publisher-stated-permitted", "testing_rule_permitted", ["SCOP-004"]],
  ["ipv6", { "/reporting_scope/web/0/host": "2001:db8::1" }, { ...defaultQuery, target: "https://[2001:db8::1]/" }, { ...evidence, discoveryHost: "2001:db8::1", securityTxtUri: "https://[2001:db8::1]/.well-known/security.txt" }, "publisher-stated-permitted", "testing_rule_permitted", ["SCOP-004"]],
  ["open-without-matching-rule", { "/research/posture": "open" }, { ...defaultQuery, activity: "manual_testing" }, evidence, "not-covered", "testing_rule_missing", ["TEST-001"]],
];
const invalidTargetCases = [
  ["target-relative", "/admin", ["EVAL-003", "ERR-001"]],
  ["target-unsupported-scheme", "ftp://example.com/", ["EVAL-003", "ERR-001"]],
  ["target-userinfo", "https://user@example.com/", ["EVAL-003", "ERR-001"]],
  ["target-product-identifier", "pkg:npm/example", ["EVAL-003", "ERR-001", "SCOP-009"]],
].map(([id, target, requirements]) => ({
  id,
  base: "limited-web-testing.json",
  set: {},
  query: { ...defaultQuery, target },
  authority: evidence,
  now: "2026-08-29T10:00:00Z",
  expected: { inputValid: false },
  requirements,
}));
writeJson(join(evaluationDir, "cases.json"), [
  ...evaluationCases.map(([id, set, query, authority, status, _diagnostic, requirements]) => ({
    id,
    base: "limited-web-testing.json",
    set,
    query,
    authority,
    now: "2026-08-29T10:00:00Z",
    expected: { status },
    requirements,
  })),
  ...invalidTargetCases,
]);

console.log(`V1 corpus written: ${Object.keys(expected).length} invalid policies, ${Object.keys(rawCases).length} raw cases, ${securityCases.length} security.txt cases, ${evaluationCases.length + invalidTargetCases.length} evaluation cases.`);
