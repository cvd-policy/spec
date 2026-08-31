# Draft 00 Readiness

## Decision

NOT READY

Scope: readiness to submit `draft-behring-cvd-policy-00` to the IETF Datatracker. The local authoring baseline and rendered artifacts are complete; no submission, upload, push, tag, release, or publication was performed.

## Completed

- Canonical Kramdown-RFC source: `draft-behring-cvd-policy.md`
- RFCXML v3, text, and HTML: `build/draft-behring-cvd-policy-00.{xml,txt,html}`
- Intended category: Standards Track
- Authors named without invented metadata: Ben Luca Behring and Marco Berg
- All 61 frozen Version 1 requirement IDs represented exactly once and linked to stable Draft anchors
- Four complete policy examples validated against the Version 1 schema and semantic validator
- Two cited evaluation examples bound to executable corpus vectors
- Full legacy and Version 1 Spec corpus checks passed
- Pinned Web commit `ecde38cf555fcd8964d44778f315d2cbaf547efd` archived outside the Web worktree: Core build and 161 tests passed, including the vendored Version 1 corpus tests; one unrelated legacy cross-repository corpus test was skipped because the isolated archive intentionally had no neighboring Spec checkout
- Kramdown-RFC 1.7.43, xml2rfc 3.34.0 in strict mode, and `xmllint` completed successfully
- Web worktree remained unchanged: binary-diff SHA-256 `40816089faa48ffec9c1ab540212e6c4966290e274f4ecd556de5ce16d30e904`

## Submission blockers

1. Author affiliations and email addresses have not been provided. They remain explicit placeholders in the media-type registration template and are omitted from author metadata.
2. The frozen Version 1 baseline and pinned Core implementation disagree on the stable reason-code contract. Core emits `policy_time_order_invalid`, `policy_uri_invalid`, `policy_language_tag_invalid`, `policy_scope_invalid`, `security_txt_contact_invalid`, `security_txt_redirect_invalid`, and `testing_rule_permitted`, which are not in the normative baseline table; `policy_condition_invalid` is listed but not emitted.
3. The frozen baseline does not assign a status to `target_url_invalid`, while the Core implementation returns `not-covered`.
4. The baseline names a product target as a `not-covered` case although the evaluation query accepts only an HTTP or HTTPS URL.
5. `DOC-013` says contact channels contain at least one `mailto:`, `tel:`, or HTTPS URI, while the schema permits only those schemes for every channel.
6. A malformed `security.txt` `Expires` value is reported by Core as `security_txt_expired`; the baseline defines no distinct malformed-date reason code.

These issues were not silently resolved in Draft 00 because doing so would change the frozen Version 1 semantics. They require an explicitly approved baseline revision, updated conformance vectors, and synchronized Core changes before submission.

## Required before changing this decision

- Supply verified author affiliations and email addresses.
- Resolve each baseline/Core ambiguity through the normal specification change process.
- Regenerate the requirements mapping and rendered artifacts.
- Re-run `make -C draft check` and obtain independent editorial, interoperability, security, privacy, and IANA review.
