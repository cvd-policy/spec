# Draft -01 Review Readiness

## Status

Status: **Draft -01 documentation and local verification complete**

This is an Internet-Draft working source, not an RFC and not an IETF-endorsed
standard. The canonical Markdown is `draft-behring-cvd-policy.md`; the intended
rendered artifact names use revision `-01`. The local gates and rendered-source
comparison listed below passed. This is not an RFC or an IETF endorsement, and
it does not claim public submission or publication.

The CSAF declaration is new in -01. The manager reports successful local
implementation and checks as summarized below. No report-processing,
independent interoperability, deployment, or public-availability claim is made
for it. Historical implementation references retained by the draft describe
the older core snapshots only.

## Normative source and support artifacts

The English RFCXML and rendered TXT supplied in the revision package are the
normative source for this revision. The canonical Markdown source is intended
to preserve their meaning. `extensions/csaf-vulnerability-report-v1/` contains
shared supporting contract, schema, and cases artifacts. Those files are
implementation aids, do not replace the Draft, and are maintained once in the
Spec repository for downstream consumers.

The supplied schema's `format: uri` alone did not encode the Draft's absolute
RFC 3986 URI requirement without fragments. The supporting schema adds a
fragment-exclusion pattern. The separate declaration validator narrowly accepts
the RFC 3986 empty-path absolute form `foo:` if the general URI format checker
rejects it; global and legacy URI rules are unchanged. Accordingly `foo:` and
`foo:?x` are unsupported specifications, whereas `foo:#x` and
`https://other.example/spec#v1` are invalid; `%23` remains valid. This corrects
supporting validation aids and does not add a normative rule.

The extension binds the declaration to CSAF 2.1 CSD04 Profile 9. It identifies
existing contact channels only. It does not define transport, POST submission,
report validation, or an intake service. Format version remains integer `1`;
the published 0.x formats and package versions are outside this revision.

## Verification recorded by the manager

The manager reports successful Spec gates: `npm ci`, `npm run build:v1`,
`npm run test:v1`, `npm run check`, and `npm run check:draft`. The repeated
verification covered 42 unchanged shared cases and 17 URI regression cases;
85 requirements (the
71 existing IDs unchanged and 14 CSR IDs); and five source/RFCXML/HTML policy
examples, including the TXT folded-example check. All three Draft outputs were
built with the existing pins Kramdown-RFC 1.7.43, ERB 6.0.7, and xml2rfc 3.34.0.
The pinned historical Core reference at `0221629e2bb6702ccc24ddb84fcaf5dc7df87c8d`
ran 253 tests with no skips. The generated XML comparison found 44 section
anchors and matching paragraph, list, abstract, five-example, and 20-reference
content; the only reported renderer difference was RFC 8792 target
serialization.

The manager also reports successful Web Core, CLI, and Site suites with an
absolute `CVD_SPEC_DIR`, zero skips, a clean Site check, and a successful build.
Browser review covered narrow and desktop layouts, the four declaration
states, failure separation, contact selection and removal, JSON/HTML/ZIP
behavior, critical-extension handling, and English/German messages. No remote
validation, telemetry, or transmission was introduced.

The pre-existing expired-Authority-evidence issue was reproduced against the
historical baseline and fixed as an existing Authority check. It is not a new
CSAF-specific Testing Permission rule. The Spec `npm ci` audit reported one
high-severity issue; the Web audit reported eight issues (three low, three
moderate, two high). No dependency updates were in scope.

The four pre-existing examples are retained. The new fifth example is a
report-only policy with a CSAF declaration and does not imply Testing
Permission. Generated -01 builds are part of the local implementation state.
The source revision is in the local Git history. A consumer `SPEC_COMMIT` must
name a real commit containing the synchronized sources; the manager supplies
the exact revision after completing that provenance workflow. Package versions
are unchanged, and nothing has been published.
