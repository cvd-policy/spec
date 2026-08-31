# Internet-Draft source

`draft-behringberg-cvd-policy.md` is the single canonical source for
`draft-behringberg-cvd-policy-00`. The build converts it to RFCXML v3 and renders
text and HTML under `build/`. The generated files are committed for review,
but this Markdown file remains the only canonical source.

Authors currently identified:

- Ben Luca Behring (lead author)
- Marco Berg

Affiliations and email addresses are intentionally left as explicit metadata
placeholders until the authors provide them. Do not invent these values.

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
build/draft-behringberg-cvd-policy-00.xml
build/draft-behringberg-cvd-policy-00.txt
build/draft-behringberg-cvd-policy-00.html
```

`REQUIREMENTS-MAPPING.md` maps every V1 requirement ID to a stable Draft
anchor. Regenerate it only from the canonical source:

```sh
node scripts/check-draft.mjs --write-mapping
```

The checker validates every embedded policy example against
`../schema/cvd-policy-1.schema.json`, verifies the cited evaluation vectors,
checks all 61 requirement IDs and anchors, limits unresolved placeholders to
the declared author metadata, and rejects unqualified legacy 0.x semantics.
`make check-core` independently archives and tests Web commit
`dd216d99553784e307f88d4da77c1fc24b90359b`; it never reads or changes the Web
worktree.

No target in this directory publishes, uploads, submits, tags, or pushes the
Draft.
