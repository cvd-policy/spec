# CVD Policy Format — specification

Normative text, JSON Schema, examples and test corpus. Published versions:
**0.1** and **0.2**. Both stay valid — a released version never changes.

`v1/` is a separate **pre-standard candidate**, not a replacement or migration
of the published 0.x line. It experimentally implements the individual
Internet-Draft `draft-behring-cvd-policy-01` (local canonical source:
`draft/draft-behring-cvd-policy.md`);
the proposed field name and media type may still change. It has no
package-version relationship to npm 1.x.

**Licence: CC0-1.0.** Copy it, quote it, host it, change it. No attribution
required.

```text
SPEC.md                              Normative text (English governs)
SPEC.de.md                           German translation
GOVERNANCE.md                        Who decides, and what happens if we stop
schema/cvd-policy-0.1.schema.json    Frozen
schema/cvd-policy-0.2.schema.json    Generated from 0.1 plus the delta
schema/profiles/report-0.1.schema.json   Shape of an incoming report
examples/                            Complete documents
examples/reports/                    Complete reports
tests/valid/, tests/invalid/         Policy corpus, with expected error codes
tests/reports/                       Report corpus
scripts/build-schema.mjs             Regenerates 0.2 from 0.1
scripts/build-corpus.mjs             Regenerates both corpora
scripts/validate-corpus.mjs          CI check against the schemas alone
v1/SPEC.md                            Isolated V1 candidate (English governs)
schema/cvd-policy-1.schema.json       V1 candidate schema
tests/v1/                             V1 candidate corpus and vectors
v1/requirements.json                 Normative requirement-to-test map
draft/draft-behring-cvd-policy.md Canonical individual Internet-Draft source
draft/REQUIREMENTS-MAPPING.md         V1 requirement-to-Draft traceability
draft/READINESS.md                    Human-review readiness decision
extensions/csaf-vulnerability-report-v1/
  csaf-policy-extension.schema.json  Supporting declaration structure
  csaf-policy-contract.json          Shared contract constants
  csaf-policy-cases.json             Supporting conformance cases
```

The extension files at that path are supporting implementation artifacts, not
a second normative source. Their source of truth is the -01 Internet-Draft;
the Spec repository maintains the shared copies for downstream consumers.
They do not establish implementation, CSAF report validation, interoperability,
or intake capability.

### Supporting URI validation note

The supplied extension schema used `format: uri` for `specification`, which
does not by itself express the Draft's requirement for an RFC 3986 absolute URI
without a fragment. The canonical supporting schema therefore adds a
fragment-exclusion pattern. In the separate CSAF declaration check, the full
URI validator is narrowly supplemented for the valid empty-path absolute URI
form such as `foo:`; this does not change global or legacy URI validation.
Thus `foo:` and `foo:?x` are syntactically valid but unsupported specifications,
while `foo:#x` and `https://other.example/spec#v1` are invalid. An escaped
fragment marker such as `%23` remains valid. These are implementation-support
corrections to align the aids with the Draft, not additional normative rules.

## Executable conformance corpus

Implementers read `tests/` more often than `SPEC.md`. Each file in
`tests/invalid/` breaks exactly one rule and carries the error code an
implementation is expected to report, in `tests/expected.json`. The `schema`
flag says whether the JSON Schema alone already rejects the document, or whether
a semantic check is needed — an elapsed `expires`, for instance, is something
JSON Schema cannot express.

```bash
npm ci
npm test          # published 0.x corpus
npm run test:v1   # isolated V1 schema, corpus, vectors and requirement map
npm run build     # regenerate the 0.2 schema and published corpora
npm run build:v1  # regenerate only V1 corpus metadata
npm run check:draft # render and verify Draft, Spec, and pinned Core reference
```

Semantic rules — an elapsed `expires`, a claim about someone else's host — are
checked by the reference library, which lives in **cvd-policy/web** together
with the command line tool and the website. That repository runs this corpus in
its own CI, so a change here that breaks an implementation is caught there.

The specification and Draft do not require the Web worktree at runtime. The
Draft's integration check archives the pinned committed Core reference into a
temporary directory so local Web changes cannot affect the result.
