# Pre-Draft Readiness

## Decision

**Audit gate triggered. No V1 breaking-change implementation was performed.**

The npm registry proves that both public packages have published versions. The task explicitly requires stopping before destructive removal of 0.x support when package publication is demonstrated.

## Repository state

Audit time: `2026-08-29T10:47:15Z`

| Repository | Branch | Start commit | End implementation commit |
| --- | --- | --- | --- |
| `spec` | `pre-ietf/v1-baseline` | `e65245068fefc43b0be56fabfe33cc131789df60` | `e65245068fefc43b0be56fabfe33cc131789df60` |
| `web` | `pre-ietf/v1-baseline` | `dd53eabed815635ae1180cf69d250f21055ee1c0` | `dd53eabed815635ae1180cf69d250f21055ee1c0` |

Both worktrees were clean at the audit boundary. Neither repository had local or remote Git tags. `gh release list` returned no releases. No pushes, releases, tags, or npm publications were performed.

This report is the only file created after the gate triggered; therefore the implementation end commits equal the start commits.

## Publication audit

Commands executed in both repositories:

```text
git status --short
git branch --show-current
git tag --list
git remote -v
git log --oneline --decorate -20
git ls-remote --tags origin
gh release list
```

Additional registry checks:

```text
npm view @cvd-policy/core versions --json
npm view @cvd-policy/cli versions --json
npm view @cvd-policy/core name version versions dist-tags time repository --json
npm view @cvd-policy/cli name version versions dist-tags time repository --json
```

Decisive evidence:

| Package | Published versions | npm `latest` |
| --- | --- | --- |
| `@cvd-policy/core` | `0.1.0`, `0.2.0`, `0.3.0`, `0.3.1`, `0.4.0` | `0.4.0` |
| `@cvd-policy/cli` | `0.1.0`, `0.2.0`, `0.3.0`, `0.3.1`, `0.4.0` | `0.4.0` |

The registry identifies `github.com/cvd-policy/web` as the source repository. The local package manifests are at `0.3.1`, while npm `latest` is `0.4.0`; source provenance for the published `0.4.0` artifacts must be reconciled before migration.

Local documentation also describes 0.1/0.2 as published or released. Those statements alone would not prove publication, but the npm records do.

No documented production users or GitHub Releases were found in the inspected repository material. Exhaustive external-use discovery is not possible from these repositories alone. This uncertainty does not alter the decision because package publication is already proven.

## Required compatibility and migration plan

1. **Recover provenance** — download and inspect the npm `0.4.0` tarballs, compare them with repository history, and identify the exact source commit and build inputs before changing active code.
2. **Preserve published artifacts** — do not unpublish or overwrite any 0.x package; preserve the 0.4 behavior and documentation at immutable versioned locations.
3. **Establish a maintenance boundary** — create an authorized maintenance branch/tag for the recovered 0.4 source before V1 work. This task created no tag because tags were explicitly prohibited.
4. **Use a separate SemVer line** — release the incompatible implementation only as a new package-major prerelease (for example `1.0.0-pre.1`) under a non-`latest` dist-tag. Package version and `cvd_policy: 1` remain separate concepts.
5. **Keep existing consumers pinned safely** — leave npm `latest` on the compatible 0.4 line until migration documentation, provenance, and validation are complete. Existing `^0.4.0` consumers must not receive V1 accidentally.
6. **Document API migration** — provide an explicit mapping from 0.x types, validator results, evaluator booleans, CLI commands, discovery behavior, intake/report APIs, and generated files to the V1 API and seven-status result model.
7. **Handle removed report/intake behavior** — retain the published 0.4 package for users requiring those APIs; do not emulate the removed protocol in V1. Document structured report transport as a separate potential future standard.
8. **Publish deprecation notices conservatively** — only after a V1 prerelease exists, mark superseded 0.x package versions with migration guidance; do not claim security failure or force upgrades without evidence.
9. **Run dual-line conformance checks** — verify the preserved 0.4 artifact against its historical corpus and V1 against the new corpus. V1 source need not contain runtime 0.x compatibility once the maintained 0.4 line is independently reproducible.
10. **Re-run the publication gate** — confirm npm metadata, Git tags/releases, public deployment claims, and any known consumers immediately before approving the breaking V1 branch.

## Planned V1 model

The requested V1 decisions were reviewed but not implemented. The intended model remains:

- integer `cvd_policy: 1`;
- proposed single `CVD-Policy` field with no guessed fallback;
- authority only from assessed `security.txt` evidence for the exact discovery host;
- externally hosted policy documents allowed without transferring authority;
- reporting scope separated from explicit testing rules;
- fail-closed conditions and extensions;
- seven non-boolean evaluation statuses;
- `requested_fields` reporting preferences;
- structured report transport excluded as a possible later, separate standard.

## Artifact matrix

No V1 artifacts were created because the publication gate stopped implementation.

| Concept | SPEC | Requirements | Schema | Fixtures | Core | CLI | Website |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pre-IETF V1 model | not implemented | not implemented | not implemented | not implemented | not implemented | not implemented | not implemented |
| Compatibility migration | this report | n/a | n/a | n/a | planned | planned | planned |

## Commands and results

| Command | Repository | Result | Tests |
| --- | --- | --- | ---: |
| Git status/branch/tag/remote/log audit | `spec` | success; clean `main`, no tags | 0 |
| Git status/branch/tag/remote/log audit | `web` | success; clean `main`, no tags | 0 |
| `git ls-remote --tags origin` | both | success; no remote tags | 0 |
| `gh release list` | both | success; no releases listed | 0 |
| npm package metadata queries | `web` | success; public 0.1.0–0.4.0 packages confirmed | 0 |

No build or test command was run after the gate because no implementation was permitted or attempted. Consequently, no claim that V1 tests or builds pass is made.

## Open points before Internet-Draft `-00`

Standardization questions remain subordinate to the compatibility blocker. After that blocker is resolved, genuine draft questions include intended document status, exact IANA registration text, transition from provisional `application/json`, future activity/extension registries, product identifiers, and a separate structured report-submission protocol.

## Blockers

- Public npm package publication contradicts the premise required for destructive 0.x removal.
- Published `0.4.0` source provenance does not match the checked-out `0.3.1` package manifests and must be recovered.
- No approved compatibility boundary or migration release strategy has yet been established.
- None of the requested V1 specification, schema, corpus, core, CLI, site, vendoring, or CI work was implemented.

NOT READY FOR INITIAL INTERNET-DRAFT

No Internet-Draft file, Datatracker submission, release, tag, push, or npm publication was created.
