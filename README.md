# CVD Policy Format — specification

Normative text, JSON Schema, examples and test corpus. Current version: **0.2**.
Version 0.1 stays published and valid — a released version never changes.

**Licence: CC0-1.0.** Copy it, quote it, host it, change it. No attribution
required.

```text
SPEC.md                              Normative text (English governs)
SPEC.de.md                           German translation
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
```

## The test corpus is the real specification

Implementers read `tests/` more often than `SPEC.md`. Each file in
`tests/invalid/` breaks exactly one rule and carries the error code an
implementation is expected to report, in `tests/expected.json`. The `schema`
flag says whether the JSON Schema alone already rejects the document, or whether
a semantic check is needed — an elapsed `expires`, for instance, is something
JSON Schema cannot express.

```bash
npm install
npm test          # schema-level check of both corpora
npm run build     # regenerate the 0.2 schema and the corpora
```

Semantic rules — an elapsed `expires`, a claim about someone else's host — are
checked by the reference library, which lives in **cvd-policy/web** together
with the command line tool and the website. That repository runs this corpus in
its own CI, so a change here that breaks an implementation is caught there.

This repository has no dependency on the other one, and never will: the
specification has to stand on its own.
