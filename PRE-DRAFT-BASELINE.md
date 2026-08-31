# Pre-Draft V1 Baseline

## Decision

READY

This decision applies only to the local, additive Version 1 pre-standard
candidate described here. It does not authorize an Internet-Draft, Datatracker
submission, release, tag, push, npm publication, package-major migration, or
change to npm `latest`.

## Baseline scope

- Published format versions 0.1 and 0.2 remain available and unchanged in
  behavior.
- `@cvd-policy/core` and `@cvd-policy/cli` remain at package version `0.4.0`.
- V1 is exposed only through `@cvd-policy/core/v1`; the package root remains the
  0.x API.
- The CLI and website remain on the published 0.x line.
- V1 defines reporting preferences but no structured report transport, intake,
  submission, or automatic data collection.
- Every evaluation status except `publisher-stated-permitted` is non-positive.

## Publication and provenance gate

Public npm publication is proven for both packages from `0.1.0` through
`0.4.0`. npm `latest` is `0.4.0`. No local or remote Git tags and no GitHub
Releases were found during the audit.

The complete evidence is in
[`docs/release-audit/npm-0.4.0-provenance.md`](docs/release-audit/npm-0.4.0-provenance.md)
and `docs/release-audit/npm-metadata/`.

- Registry signatures verified for every audited package version.
- No audited release contains an npm provenance attestation.
- npm `0.4.0` records source commit
  `eca80c738498e87d4fadd5f65f87b020b1522bff`.
- Rebuilt 0.4.0 package contents match the registry tarballs after normalizing
  CRLF/LF differences in three text files.

That evidence supports an additive V1 subpath while preserving the public 0.4
line. It does not support rewriting, removing, or silently migrating 0.x.

## Authoritative artifacts

| Artifact | Location |
| --- | --- |
| Normative English candidate | `v1/SPEC.md` |
| Informative German translation | `v1/SPEC.de.md` |
| Draft 2020-12 schema | `schema/cvd-policy-1.schema.json` |
| Examples | `examples/v1/` |
| Valid, invalid, and duplicate-aware JSON corpus | `tests/v1/policy/` |
| security.txt authority vectors | `tests/v1/security-txt/cases.json` |
| Evaluation vectors | `tests/v1/evaluation/cases.json` |
| Normative requirement map | `v1/requirements.json` |
| Isolated core implementation | `web/packages/core/src/v1/` |
| Package export | `@cvd-policy/core/v1` |
| Vendored conformance snapshot | `web/packages/core/vendor/spec-v1/` |

The core snapshot is pinned to specification content commit
`ab80d917bd64334380c3cfda9674a798f8d6951e`. The web implementation commit is
`ecde38cf555fcd8964d44778f315d2cbaf547efd`. Builds and runtime validation do
not require a neighboring specification checkout.

## Security properties exercised

- duplicate JSON members and non-JSON grammar are rejected before schema use;
- unknown versions, critical extensions, and extension activities fail closed;
- strict core objects reject unknown members;
- authority requires parseable `security.txt`, a valid contact, exactly one
  unexpired `Expires`, exactly one HTTPS `CVD-Policy`, safe redirect context,
  and exact discovery-host binding;
- external policy hosting does not transfer authority;
- `out` scope wins independently of document order;
- report-only/prohibited posture and any matching prohibition are non-positive;
- rate, concurrency, user-agent, and test-account conditions fail closed;
- constraints are selected deterministically by code-unit rule-ID order;
- requested report fields do not request third-party data or unsafe proof;
- package CI actions are commit-pinned and checkout credentials are not
  persisted.

## Verification record

| Check | Result |
| --- | --- |
| `npm test` in `spec` | published 0.x corpus passed |
| `npm run test:v1` in `spec` | 9 valid, 36 invalid, 8 raw, 16 security.txt, and 35 evaluation vectors passed |
| `v1/requirements.json` check | all 61 normative requirement IDs mapped to executable checks |
| `npm test` in `web` against the pinned spec commit | core, CLI, and site suites passed; core included 61 legacy corpus cases and V1 corpus execution |
| `npm run typecheck -w @cvd-policy/core` | passed |
| site check and production build | passed; eight routes and `404.html` generated |
| packed `@cvd-policy/core/v1` import from a temporary installation | passed without a specification checkout |
| focused implementation review after fixes | no blocking findings |
| `git diff --check` and language-server diagnostics | passed |

## Deliberate boundaries and remaining standards work

The core module assesses supplied retrieval evidence; it does not fetch network
resources or verify OpenPGP signatures. A network consumer must independently
enforce response-size, timeout, redirect, DNS-rebinding, private-address, and
signature-verification controls before calling it.

Interoperability deployments, designated-expert feedback, exact IANA
registration text, media-type registration, and the eventual document status
remain future standards work. The current candidate creates no IANA request and
no Internet-Draft artifact.

No push, tag, release, npm publication, Datatracker action, or Internet-Draft
file was created.
