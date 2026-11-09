# Internet-Draft source

`draft-behring-cvd-policy.md` is the single canonical source for
`draft-behring-cvd-policy-01`. The build converts it to RFCXML v3 and renders
text and HTML under `build/`. The generated files are committed for review,
but this Markdown file remains the only canonical source.

Authors:

- Ben Luca Behring — Skalvar Technologies — behring@skalvar.de — Germany
- Marco Berg — Skalvar Technologies — berg@skalvar.de — Germany

## Build

Requirements: Ruby, `gem`, `uv`/`uvx`, Python, GNU Make, Node.js, npm, and
`xmllint`. The Makefile pins the top-level Kramdown-RFC, ERB, and `xml2rfc`
versions, installs the gems into `draft/.gems/`, and runs `xml2rfc` through
`uvx`; neither tool is installed globally. Transitive dependencies and runtime
versions are not lockfile-pinned, so the build checks committed outputs rather
than claiming byte-for-byte reproducibility across environments.

```sh
cd draft
make                 # RFCXML v3, text, and HTML
make check           # draft, Spec corpus, and pinned Core-reference checks
make clean
```

Outputs:

```text
build/draft-behring-cvd-policy-01.xml
build/draft-behring-cvd-policy-01.txt
build/draft-behring-cvd-policy-01.html
```

`REQUIREMENTS-MAPPING.md` maps every V1 requirement ID to a stable Draft
anchor. Regenerate it only from the canonical source:

```sh
node scripts/check-draft.mjs --write-mapping
```

The checker is being updated to validate all five embedded policy examples,
including the RFC 8792-folded CSAF declaration example, and to trace the
revision's CSR-001 through CSR-014 alongside existing requirement IDs.
`make check` has not yet been run for this revision. Historical core-reference
information in the draft describes the inspected 2026-09 snapshot only; it is
not evidence of CSAF declaration implementation or interoperability.

No target in this directory publishes, uploads, submits, tags, or pushes the
Draft.
