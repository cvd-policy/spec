// Generates the test corpus in tests/valid and tests/invalid.
// The generated files are committed; this script keeps them in sync.
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const validDir = join(root, "tests", "valid");
const invalidDir = join(root, "tests", "invalid");

for (const dir of [validDir, invalidDir]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

/** Base document every fixture is derived from. */
const base = () => ({
  cvd_policy: "0.1",
  canonical: "https://example.com/.well-known/cvd.json",
  expires: "2027-06-30T23:59:59Z",
  updated: "2026-06-30",
  organization: { name: "Example Ltd.", country: "DE", role: "operator" },
  contact: {
    channels: [{ type: "email", value: "security@example.com", preferred: true }],
    languages: ["en", "de"],
  },
  research: { posture: "report_only" },
  scope: {
    precedence: "out_overrides_in",
    web: [{ pattern: "example.com", state: "in" }],
  },
  report_requirements: { required_fields: ["affected_asset", "description"] },
});

const patch = (fn) => {
  const doc = base();
  fn(doc);
  return doc;
};

// ---------------------------------------------------------------- valid ----

const valid = {
  "01-minimal-report-only": {
    cvd_policy: "0.1",
    canonical: "https://example.com/.well-known/cvd.json",
    expires: "2027-06-30T23:59:59Z",
    organization: { name: "Example Ltd." },
    contact: { channels: [{ type: "email", value: "security@example.com" }] },
    research: { posture: "report_only" },
    scope: { precedence: "out_overrides_in", web: [{ pattern: "example.com", state: "in" }] },
    report_requirements: { required_fields: [] },
  },

  "02-prohibited": patch((d) => {
    d.research = { posture: "prohibited", statement: "Testing is ruled out." };
    d.scope.web = [{ pattern: "*.example.com", state: "out", reason: "other" }];
  }),

  "03-prohibited-with-empty-testing": patch((d) => {
    d.research = { posture: "prohibited" };
    d.testing = { default: "prohibited", rules: [] };
  }),

  "04-report-only-testing-default-only": patch((d) => {
    d.testing = { default: "prohibited" };
  }),

  "05-limited-staging": patch((d) => {
    d.research = { posture: "limited", statement: "Staging only." };
    d.scope.web = [
      { pattern: "staging.example.com", state: "in" },
      { pattern: "*.example.com", state: "out", reason: "not_operated" },
    ];
    d.testing = {
      default: "prohibited",
      rules: [
        {
          activity: "manual_testing",
          state: "allowed",
          conditions: { targets: ["staging.example.com"], account_request: "https://example.com/test-account" },
        },
        { activity: "dos", state: "prohibited" },
      ],
    };
  }),

  "06-open-with-rate-limit": patch((d) => {
    d.research = { posture: "open" };
    d.contact.encryption = [{ type: "pgp", value: "https://example.com/pgp-key.txt" }];
    d.testing = {
      default: "prohibited",
      rules: [
        { activity: "manual_testing", state: "allowed" },
        {
          activity: "automated_scanning",
          state: "allowed",
          conditions: { max_requests_per_second: 5, user_agent_contains: "cvd-research" },
        },
      ],
    };
  }),

  "07-open-testing-default-allowed": patch((d) => {
    d.research = { posture: "open" };
    d.contact.encryption = [{ type: "pgp", value: "https://example.com/pgp-key.txt" }];
    d.testing = {
      default: "allowed",
      rules: [
        { activity: "dos", state: "prohibited" },
        { activity: "social_engineering", state: "prohibited" },
        { activity: "physical", state: "prohibited" },
      ],
    };
  }),

  "08-testing-window-condition": patch((d) => {
    d.research = { posture: "limited" };
    d.testing = {
      default: "prohibited",
      rules: [
        {
          activity: "automated_scanning",
          state: "allowed",
          conditions: {
            max_requests_per_second: 2,
            window: { timezone: "Europe/Berlin", days: ["mon", "tue", "wed", "thu", "fri"], from: "08:00", to: "18:00" },
          },
        },
      ],
    };
  }),

  "09-products-only": patch((d) => {
    delete d.scope.web;
    d.scope.products = [
      {
        name: "SC-4000 Controller",
        purl: "pkg:generic/example/sc4000",
        versions: ">=2.0.0",
        supported_until: "2030-12-31",
        sbom: "https://example.com/sbom/sc4000.json",
      },
    ];
  }),

  "10-explicit-order-precedence": patch((d) => {
    d.scope.precedence = "explicit_order";
    d.scope.web = [
      { pattern: "*.example.com", state: "out", reason: "legacy" },
      { pattern: "lab.example.com", state: "in" },
    ];
  }),

  "11-unknown-fields-tolerated": patch((d) => {
    d.x_internal_ticket_queue = "PSIRT";
    d.signature = { alg: "unknown", value: "…" };
    d.research.x_note = "Field from a later version";
  }),

  "12-profiles-and-all-channels": patch((d) => {
    d.profiles = ["cra-0.1"];
    d.contact.channels = [
      { type: "email", value: "psirt@example.com" },
      { type: "form", value: "https://example.com/report" },
      { type: "service", value: "https://intake.example-provider.tld/example-ltd" },
      { type: "postal", value: "Example Ltd., 1 Example Road, Exampleton" },
    ];
    d.contact.response_target = { acknowledge_within_hours: 48, update_interval_days: 14 };
    d.disclosure = {
      model: "coordinated",
      deadline_days: 90,
      advisory_url: "https://example.com/advisories",
      credit: "offered",
    };
  }),

  "13-no-updated-field": patch((d) => {
    delete d.updated;
  }),

  // A 0.1 document carrying a 0.2 field: consumers ignore what they do not
  // know, so this stays valid rather than being rejected.
  "14-unknown-intake-on-0-1": patch((d) => {
    d.report_requirements.intake = { url: "https://example.com/report" };
  }),

  "15-v02-minimal": patch((d) => {
    d.cvd_policy = "0.2";
  }),

  "16-v02-intake-minimal": patch((d) => {
    d.cvd_policy = "0.2";
    d.report_requirements.intake = { url: "https://example.com/report/submit" };
  }),

  "17-v02-intake-full": patch((d) => {
    d.cvd_policy = "0.2";
    d.report_requirements.intake = {
      url: "https://example.com/report/submit",
      schema: "https://example.com/report/schema.json",
      profile: "report-0.1",
      anonymous: true,
      max_bytes: 5_242_880,
      attachments: "after_contact",
    };
  }),

  // The endpoint may sit on a provider's domain: the publisher chose it, the
  // same way a `service` contact channel is chosen.
  "18-v02-intake-delegated": patch((d) => {
    d.cvd_policy = "0.2";
    d.report_requirements.intake = {
      url: "https://intake.provider.example/t/7f3a2c/submit",
      profile: "report-0.1",
      anonymous: true,
    };
  }),
};

// -------------------------------------------------------------- invalid ----
// Each file breaks exactly one rule. `code` is the error an implementation must
// report; `schema` tells whether the JSON Schema alone already rejects it.

const invalid = {
  "01-missing-cvd-policy": { doc: patch((d) => delete d.cvd_policy), code: "REQUIRED_MISSING", schema: true },
  "02-unsupported-version": { doc: patch((d) => (d.cvd_policy = "0.3")), code: "VERSION_UNSUPPORTED", schema: true },
  "03-canonical-not-https": {
    doc: patch((d) => (d.canonical = "http://example.com/.well-known/cvd.json")),
    code: "CANONICAL_NOT_HTTPS",
    schema: true,
  },
  "04-canonical-missing": { doc: patch((d) => delete d.canonical), code: "REQUIRED_MISSING", schema: true },
  "05-canonical-not-a-uri": { doc: patch((d) => (d.canonical = "example.com")), code: "CANONICAL_NOT_HTTPS", schema: true },
  "06-expires-missing": { doc: patch((d) => delete d.expires), code: "REQUIRED_MISSING", schema: true },
  "07-expires-past": { doc: patch((d) => (d.expires = "2024-01-01T00:00:00Z")), code: "EXPIRES_PAST", schema: false },
  "08-expires-not-datetime": { doc: patch((d) => (d.expires = "2027-06-30")), code: "FORMAT_INVALID", schema: true },
  "09-posture-unknown": {
    doc: patch((d) => (d.research.posture = "allowed")),
    code: "POSTURE_UNKNOWN",
    schema: true,
  },
  "10-research-missing": { doc: patch((d) => delete d.research), code: "REQUIRED_MISSING", schema: true },
  "11-posture-missing": { doc: patch((d) => (d.research = { statement: "…" })), code: "REQUIRED_MISSING", schema: true },
  "12-testing-rules-on-prohibited": {
    doc: patch((d) => {
      d.research = { posture: "prohibited" };
      d.testing = { default: "prohibited", rules: [{ activity: "manual_testing", state: "allowed" }] };
    }),
    code: "POSTURE_CONTRADICTION",
    schema: true,
  },
  "13-testing-rules-on-report-only": {
    doc: patch((d) => {
      d.testing = { default: "prohibited", rules: [{ activity: "fuzzing", state: "allowed" }] };
    }),
    code: "POSTURE_CONTRADICTION",
    schema: true,
  },
  "14-testing-missing-on-open": {
    doc: patch((d) => (d.research = { posture: "open" })),
    code: "TESTING_REQUIRED",
    schema: true,
  },
  "15-testing-missing-default": {
    doc: patch((d) => {
      d.research = { posture: "limited" };
      d.testing = { rules: [{ activity: "manual_testing", state: "allowed" }] };
    }),
    code: "REQUIRED_MISSING",
    schema: true,
  },
  "16-testing-default-invalid": {
    doc: patch((d) => {
      d.research = { posture: "limited" };
      d.testing = { default: "maybe" };
    }),
    code: "ENUM_INVALID",
    schema: true,
  },
  "17-rule-state-invalid": {
    doc: patch((d) => {
      d.research = { posture: "limited" };
      d.testing = { default: "prohibited", rules: [{ activity: "manual_testing", state: "sometimes" }] };
    }),
    code: "ENUM_INVALID",
    schema: true,
  },
  "18-rule-activity-missing": {
    doc: patch((d) => {
      d.research = { posture: "limited" };
      d.testing = { default: "prohibited", rules: [{ state: "allowed" }] };
    }),
    code: "REQUIRED_MISSING",
    schema: true,
  },
  "19-scope-missing-precedence": {
    doc: patch((d) => delete d.scope.precedence),
    code: "REQUIRED_MISSING",
    schema: true,
  },
  "20-scope-precedence-invalid": {
    doc: patch((d) => (d.scope.precedence = "in_overrides_out")),
    code: "ENUM_INVALID",
    schema: true,
  },
  "21-scope-web-state-invalid": {
    doc: patch((d) => (d.scope.web = [{ pattern: "example.com", state: "included" }])),
    code: "ENUM_INVALID",
    schema: true,
  },
  "22-scope-web-missing-pattern": {
    doc: patch((d) => (d.scope.web = [{ state: "in" }])),
    code: "REQUIRED_MISSING",
    schema: true,
  },
  "23-scope-reason-invalid": {
    doc: patch((d) => (d.scope.web = [{ pattern: "example.com", state: "out", reason: "because" }])),
    code: "ENUM_INVALID",
    schema: true,
  },
  "24-contact-channels-empty": {
    doc: patch((d) => (d.contact.channels = [])),
    code: "MIN_ITEMS",
    schema: true,
  },
  "25-contact-channel-type-invalid": {
    doc: patch((d) => (d.contact.channels = [{ type: "phone", value: "+49 …" }])),
    code: "ENUM_INVALID",
    schema: true,
  },
  "26-contact-missing": { doc: patch((d) => delete d.contact), code: "REQUIRED_MISSING", schema: true },
  "27-organization-missing-name": {
    doc: patch((d) => (d.organization = { country: "DE" })),
    code: "REQUIRED_MISSING",
    schema: true,
  },
  "28-report-requirements-missing": {
    doc: patch((d) => delete d.report_requirements),
    code: "REQUIRED_MISSING",
    schema: true,
  },
  "29-required-field-unknown": {
    doc: patch((d) => (d.report_requirements.required_fields = ["affected_asset", "favourite_colour"])),
    code: "ENUM_INVALID",
    schema: true,
  },
  "30-disclosure-model-invalid": {
    doc: patch((d) => (d.disclosure = { model: "eventually" })),
    code: "ENUM_INVALID",
    schema: true,
  },
  "31-not-an-object": { doc: [], code: "TYPE_INVALID", schema: true },
  "33-v02-intake-not-https": {
    doc: patch((d) => {
      d.cvd_policy = "0.2";
      d.report_requirements.intake = { url: "http://example.com/report/submit" };
    }),
    code: "INTAKE_NOT_HTTPS",
    schema: true,
  },
  "34-v02-intake-missing-url": {
    doc: patch((d) => {
      d.cvd_policy = "0.2";
      d.report_requirements.intake = { profile: "report-0.1" };
    }),
    code: "REQUIRED_MISSING",
    schema: true,
  },
  "35-v02-intake-schema-not-https": {
    doc: patch((d) => {
      d.cvd_policy = "0.2";
      d.report_requirements.intake = {
        url: "https://example.com/report/submit",
        schema: "http://example.com/report/schema.json",
      };
    }),
    code: "INTAKE_NOT_HTTPS",
    schema: true,
  },
  "36-v02-intake-attachments-invalid": {
    doc: patch((d) => {
      d.cvd_policy = "0.2";
      d.report_requirements.intake = {
        url: "https://example.com/report/submit",
        attachments: "sometimes",
      };
    }),
    code: "ENUM_INVALID",
    schema: true,
  },
  "37-v02-intake-credentials": {
    doc: patch((d) => {
      d.cvd_policy = "0.2";
      d.report_requirements.intake = { url: "https://user:pw@example.com/report/submit" };
    }),
    code: "INTAKE_HAS_CREDENTIALS",
    schema: false,
  },
  "32-country-lowercase": {
    doc: patch((d) => (d.organization.country = "de")),
    code: "PATTERN_INVALID",
    schema: true,
  },
};

for (const [name, doc] of Object.entries(valid)) {
  writeFileSync(join(validDir, `${name}.json`), JSON.stringify(doc, null, 2) + "\n");
}

const expected = {};
for (const [name, entry] of Object.entries(invalid)) {
  writeFileSync(join(invalidDir, `${name}.json`), JSON.stringify(entry.doc, null, 2) + "\n");
  expected[`${name}.json`] = { code: entry.code, schema: entry.schema };
}

writeFileSync(join(root, "tests", "expected.json"), JSON.stringify(expected, null, 2) + "\n");

// ------------------------------------------------- reports (profile) ----
// Fixtures for the report profile, which describes what an incoming report
// looks like. Same idea as above: one broken rule per invalid file.

const reportsValidDir = join(root, "tests", "reports", "valid");
const reportsInvalidDir = join(root, "tests", "reports", "invalid");
const reportExamplesDir = join(root, "examples", "reports");

for (const dir of [reportsValidDir, reportsInvalidDir, reportExamplesDir]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

const minimalReport = () => ({
  report: "0.1",
  title: "Stored cross-site scripting in the ticket view",
  target: "support.example.com",
  description:
    "The ticket subject is rendered without escaping, so markup submitted by one user runs in the browser of any agent opening the ticket.",
});

const fullReport = () => ({
  ...minimalReport(),
  reproduction: [
    "1. Open https://support.example.com/tickets/new",
    "2. Enter <img src=x onerror=alert(1)> as the subject",
    "3. Submit, then open the ticket as an agent.",
  ].join("\n"),
  impact:
    "Any agent viewing the ticket runs attacker-controlled script in the context of the support tool, which can read the session cookie.",
  product: "Example Support Desk",
  version: "4.2.1",
  endpoint: "https://support.example.com/tickets/{id}",
  preconditions: ["none"],
  weakness: { cwe: ["CWE-79"], note: "Reporter's own assessment, not verified." },
  identifiers: { cve: [], advisory: [] },
  expected_behaviour: "The subject is displayed as text.",
  actual_behaviour: "The subject is parsed as HTML.",
  references: ["https://owasp.org/www-community/attacks/xss/"],
  exploitation: { state: "unknown" },
  coordination: {
    vendor_contacted: false,
    publication: "none_planned",
  },
  reporter: {
    name: "A. Researcher",
    contact: "researcher@example.org",
    languages: ["en", "de"],
    consent: {
      share_contact_with_affected_party: true,
      public_credit: false,
    },
  },
  submitted_at: "2026-08-18T09:15:00Z",
});

const reportsValid = {
  "01-minimal": minimalReport(),
  "02-full": fullReport(),
  "03-anonymous": (() => {
    const r = fullReport();
    delete r.reporter;
    return r;
  })(),
  "04-exploited-with-evidence": {
    ...minimalReport(),
    exploitation: {
      state: "yes",
      evidence: "Requests matching the payload appear in public scan data since 2026-08-01.",
      observed_at: "2026-08-01T00:00:00Z",
    },
  },
  "05-no-reproduction-or-impact": minimalReport(),
  "06-unknown-fields-tolerated": { ...minimalReport(), x_internal_queue: "psirt" },
};

const reportsInvalid = {
  "01-missing-title": { doc: (() => { const r = minimalReport(); delete r.title; return r; })(), code: "REQUIRED_MISSING" },
  "02-missing-target": { doc: (() => { const r = minimalReport(); delete r.target; return r; })(), code: "REQUIRED_MISSING" },
  "03-missing-description": { doc: (() => { const r = minimalReport(); delete r.description; return r; })(), code: "REQUIRED_MISSING" },
  "04-empty-title": { doc: { ...minimalReport(), title: "" }, code: "STRING_EMPTY" },
  "05-exploited-without-evidence": {
    doc: { ...minimalReport(), exploitation: { state: "yes" } },
    code: "REQUIRED_MISSING",
  },
  "06-exploitation-boolean": {
    doc: { ...minimalReport(), exploitation: { state: true } },
    code: "ENUM_INVALID",
  },
  "07-cwe-malformed": {
    doc: { ...minimalReport(), weakness: { cwe: ["79"] } },
    code: "PATTERN_INVALID",
  },
  "08-cve-malformed": {
    doc: { ...minimalReport(), identifiers: { cve: ["CVE-79"] } },
    code: "PATTERN_INVALID",
  },
  "09-precondition-unknown": {
    doc: { ...minimalReport(), preconditions: ["moon_phase"] },
    code: "ENUM_INVALID",
  },
  "10-wrong-profile-version": { doc: { ...minimalReport(), report: "0.9" }, code: "VERSION_UNSUPPORTED" },
};

for (const [name, doc] of Object.entries(reportsValid)) {
  writeFileSync(join(reportsValidDir, `${name}.json`), JSON.stringify(doc, null, 2) + "\n");
}

const reportExpected = {};
for (const [name, entry] of Object.entries(reportsInvalid)) {
  writeFileSync(join(reportsInvalidDir, `${name}.json`), JSON.stringify(entry.doc, null, 2) + "\n");
  reportExpected[`${name}.json`] = { code: entry.code };
}
writeFileSync(join(root, "tests", "reports", "expected.json"), JSON.stringify(reportExpected, null, 2) + "\n");

writeFileSync(join(reportExamplesDir, "01-minimal.json"), JSON.stringify(minimalReport(), null, 2) + "\n");
writeFileSync(join(reportExamplesDir, "02-full.json"), JSON.stringify(fullReport(), null, 2) + "\n");

console.log(
  `Corpus written: ${Object.keys(valid).length} valid, ${Object.keys(invalid).length} invalid files, ` +
    `${Object.keys(reportsValid).length} valid and ${Object.keys(reportsInvalid).length} invalid reports.`,
);
