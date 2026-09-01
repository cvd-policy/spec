# Draft 00 Datatracker Readiness

## Decision

Status: **READY FOR DATATRACKER SUBMISSION**

The technical Draft, Spec, schema, corpus, and isolated Core implementation pass their checks. Both pinned implementation references returned HTTP 200 and were publicly inspectable on 2026-09-01.

The two review branches were pushed solely to make the cited commits inspectable. No Datatracker submission, upload, tag, release, or npm publication was performed.

## Review inputs and outputs

- Draft input commit: `63e835d1010af3602d921f2d5bd0850092e5f9b0`
- Reviewed Version 1 Spec commit: `a7e359ac2bc2efbc89febc7c4a5cd42dec03eade`
- Reviewed Core commit: `acc609efc4adc33683cc6c71acd57a8a8e06169b`
- Canonical source: `draft-behring-cvd-policy.md`
- Generated RFCXML v3: `build/draft-behring-cvd-policy-00.xml`
- Generated text: `build/draft-behring-cvd-policy-00.txt`
- Generated HTML: `build/draft-behring-cvd-policy-00.html`
- Requirement mapping: `REQUIREMENTS-MAPPING.md`

Artifact SHA-256 values:

- RFCXML: `38d0e522911436ce3b1c2865b2d61d344b79e05948efae5401fec89de681fa11`
- Text: `eea9b539b0db80702c5b3d718b2b4dfc7d859d3600ff15685ea32c1db3ccf91e`
- HTML: `dd92f4cfe4d6405aacadb3aab46975885ba651c84de5572d9d62d6e6bf9fb899`

## Human-review changes completed

1. The document is named `draft-behring-cvd-policy-00` throughout.
2. Both authors have organization, email, and country metadata; no placeholder remains.
3. RFC 9110 is normative. RFC 7942 is informative and is referenced only by the removable Implementation Status section.
4. Policy retrieval now defines HTTPS `GET`, `Accept`, compatibility-mode media-type handling, complete `200 OK` responses, HTTPS redirects, and credential isolation.
5. Authority evidence is bound to the advertised Policy URI and its recorded all-HTTPS redirect chain.
6. `Canonical` validation applies whenever the field is present, including no-redirect and same-host-redirect cases.
7. Version dispatch, identifier syntax and comparison, absolute product and extension URIs, exact Core object members, array cardinality, period start points, and the input-failure boundary are explicit.
8. Scope and Target paths use the same dot-segment, repeated-slash, percent-triplet, and encoded-slash normalization.
9. Prohibited testing rules cannot contain conditions.
10. Evaluation reports every satisfied permit rule informatively; Draft 00 defines neither lexicographic permit selection nor aggregated constraints.
11. The `security.txt` field request and complete `application/cvd-policy+json` registration template include IETF change control, `+json` fragment wording, full security considerations, and no provisional registration.
12. Implementation Status immediately precedes Security Considerations, includes RFC 7942 removal instructions, and accurately records the publicly inspectable references.

## Coverage and verification

- All 71 normative Version 1 requirement IDs occur exactly once in the Draft and map to executable checks.
- Spec checks pass: 9 valid documents, 47 invalid documents, 8 raw JSON cases, 19 `security.txt` vectors, and 55 evaluation vectors.
- Core build and isolated pinned-reference checks pass: 9 test files passed, 1 unrelated cross-repository test skipped, and 165 tests passed.
- Four complete Draft policy examples validate against the Version 1 schema and semantic validator.
- Two Draft evaluation examples are bound to executable corpus vectors.
- Kramdown-RFC 1.7.43 produces the intermediate XML; `xml2rfc` 3.34.0 converts it to RFCXML v3 and renders text and HTML in strict mode.
- RFCXML declares version 3 and contains no deprecated `spanx` or `texttable` elements.
- Automated checks verify that JSON and `security.txt` examples remain multiline in RFCXML, text, and HTML.
- `xmllint`, `git diff --check`, clean rebuild comparison, Spec tests, and the pinned Core-reference check pass under `make -C draft check`.

## Compatibility and isolation

- Formats 0.1 and 0.2, package versions, the root Core API, CLI commands, website behavior, report intake, releases, and npm metadata remain unchanged.
- Version 1 remains opt-in through `@cvd-policy/core/v1`.
- Work was performed in isolated Spec and Web worktrees. The unrelated modifications in the primary Web worktree were not touched.

## Public reference evidence

- `https://github.com/cvd-policy/spec/commit/a7e359ac2bc2efbc89febc7c4a5cd42dec03eade` → HTTP 200.
- `https://github.com/cvd-policy/web/commit/acc609efc4adc33683cc6c71acd57a8a8e06169b` → HTTP 200.
- Remote Spec branch `human-review/datatracker-spec` contains the reviewed Spec commit.
- Remote Core branch `human-review/datatracker-core` points exactly to the reviewed Core commit.

The exact references and all checks must be revalidated immediately before submission. Datatracker submission requires separate explicit authorization.
