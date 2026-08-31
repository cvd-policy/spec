# Draft 00 Readiness

## Decision

READY FOR HUMAN REVIEW

Scope: technical and editorial readiness for human review of `draft-behringberg-cvd-policy-00`. This is not a Datatracker-submission decision. No submission, upload, push, tag, release, npm publication, or other publication was performed.

## Review inputs and outputs

- Draft input commit: `cff561138664f1e32d4a01724cbcde231f1a8856`
- Version 1 baseline output commit: `55bd9f115c38c3704174fa9c0cb58b27afddf3da`
- Core input commit: `ecde38cf555fcd8964d44778f315d2cbaf547efd`
- Core output commit: `dd216d99553784e307f88d4da77c1fc24b90359b`
- Canonical source: `draft-behringberg-cvd-policy.md`
- Generated artifacts: `build/draft-behringberg-cvd-policy-00.{xml,txt,html}`
- Requirement mapping: `REQUIREMENTS-MAPPING.md`

## Baseline corrections completed

1. The seven evaluation statuses remain the normative interoperability contract. Detailed diagnostic identifiers are informative and implementation-specific; the Draft no longer requires identical reason codes.
2. Invalid Target input now produces a typed machine-readable input-validation failure with no evaluation status. It never produces `not-covered`; Core uses the informative diagnostic `target_url_invalid`.
3. Product scope remains reporting metadata and is not accepted as an HTTP(S) evaluation Target.
4. Every contact channel must be an absolute `mailto:`, `tel:`, or HTTPS URI. HTTPS contacts reject userinfo and fragments.
5. A malformed `security.txt` `Expires` value and a valid but expired value both prevent Authority and remain distinct Core diagnostics: `security_txt_expires_invalid` and `security_txt_expired`.
6. The unused `policy_condition_invalid` diagnostic was removed. Core-specific diagnostics remain documented and tested without becoming normative Draft requirements.

## Coverage and verification

- All 61 Version 1 normative requirement IDs are represented exactly once in the Draft and map to executable checks.
- Spec checks passed: legacy corpus; 9 valid V1 documents; 40 invalid V1 documents; 8 raw JSON cases; 17 `security.txt` vectors; 39 evaluation vectors.
- The normative corpus requires statuses and structural outcomes, not implementation-specific detailed reason codes.
- Core `@cvd-policy/core/v1` build, typecheck, tarball/export check, and tests passed.
- Pinned isolated Core-reference check passed: 9 test files passed, 1 unrelated cross-repository test skipped, 164 tests passed.
- Four complete Draft policy examples validate against the V1 schema and semantic validator.
- Two Draft evaluation examples are bound to executable corpus vectors.
- Kramdown-RFC 1.7.43 generated RFCXML v3; `xml2rfc` 3.34.0 strict mode generated text and HTML; `xmllint` passed.
- `git diff --check` passed and a clean rebuild reproduced the staged Draft artifacts.
- An independent Core diff review found one empty-fragment URI edge case; it was fixed and covered by a regression test before the Core commit.

## Compatibility and repository isolation

- Formats 0.1 and 0.2, the package root Core API, CLI commands, website behavior, report intake, package versions, release metadata, and npm metadata are unchanged.
- Version 1 remains opt-in through `@cvd-policy/core/v1`.
- The primary Web worktree remained untouched with 18 pre-existing modified files and binary-diff SHA-256 `40816089faa48ffec9c1ab540212e6c4966290e274f4ecd556de5ce16d30e904`.
- The unrelated formatter changes in the primary Spec worktree were not included.

## Remaining administrative blockers

- Author affiliations and email addresses have not been provided. They remain explicit placeholders in the media-type registration template and are omitted from author metadata.
- Datatracker submission must remain blocked until verified author metadata is supplied and human editorial, interoperability, security, privacy, and IANA review is complete.
