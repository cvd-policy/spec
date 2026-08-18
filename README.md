# CVD Policy Format — specification

Normative text, JSON Schema, examples and test corpus for version 0.1.

**Licence: CC0-1.0.** Copy it, quote it, host it, change it. No attribution
required.

```text
SPEC.md                          Normative text (English governs)
SPEC.de.md                       German translation
schema/cvd-policy-0.1.schema.json
examples/                        Five complete documents
tests/valid/                     Documents that must validate
tests/invalid/                   Documents that must be rejected
tests/expected.json              Expected error code per invalid file
scripts/build-corpus.mjs         Regenerates the corpus
scripts/validate-corpus.mjs      CI check against the schema alone
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
npm test                  # schema-level check of the whole corpus
npm run build-corpus      # regenerate tests/ after a schema change
```

Semantic rules — an elapsed `expires`, a claim about someone else's host — are
checked by the reference library, which lives in **cvd-policy/web** together
with the command line tool and the website. That repository runs this corpus in
its own CI, so a change here that breaks an implementation is caught there.

This repository has no dependency on the other one, and never will: the
specification has to stand on its own.
