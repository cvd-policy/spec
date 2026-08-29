# npm 0.4.0 Release Provenance Audit

Audit date: 2026-08-29

## Scope

This audit covers every npm release from `0.1.0` through `0.4.0` of:

- `@cvd-policy/core`
- `@cvd-policy/cli`

The complete registry responses are preserved under:

```text
npm-metadata/core/<version>.json
npm-metadata/cli/<version>.json
```

Each file includes the published version, publication times, `gitHead`, repository, `dist.integrity`, `dist.shasum`, tarball URL, registry signatures, attestations when present, and maintainers.

## Registry metadata

| Version | Published core | Published CLI | `gitHead` |
| --- | --- | --- | --- |
| `0.1.0` | `2026-08-18T15:00:07.398Z` | `2026-08-18T15:00:48.878Z` | `5d0b826e83eb880eedf53778abca45ac81471d94` |
| `0.2.0` | `2026-08-20T22:22:03.652Z` | `2026-08-20T22:22:25.683Z` | `9db0a51328a1428f577047b13fa6637c711e8522` |
| `0.3.0` | `2026-08-21T16:15:21.241Z` | `2026-08-21T16:15:42.003Z` | `fc1d4d7152936181f1900f65db9e79e9096fced2` |
| `0.3.1` | `2026-08-21T16:48:17.112Z` | `2026-08-21T16:48:38.888Z` | `042340916e5a2a340422a4b01cc7ff82e44538bf` |
| `0.4.0` | `2026-08-26T16:22:34.622Z` | `2026-08-26T16:23:06.138Z` | `eca80c738498e87d4fadd5f65f87b020b1522bff` |

All releases name `git+https://github.com/cvd-policy/web.git` and the corresponding `packages/core` or `packages/cli` directory. All name `skalvartechnologies <info@skalvar.de>` as maintainer.

## 0.4.0 package digests

| Package | Integrity | SHA-1 | Tarball |
| --- | --- | --- | --- |
| core | `sha512-5/tWja0+eZ8OwnurgZqmoj3LtVpJB0PJCZHuWY0HzUJlrYBW49LYpss3CpHesTlALSXsvdbxmJ8hjo2QVUxguQ==` | `6c25beb66cc29ee4eb7ae63624ce99d9b4ccd95a` | `https://registry.npmjs.org/@cvd-policy/core/-/core-0.4.0.tgz` |
| CLI | `sha512-I/x4n2V/Qpd/8DmaUZjD5fVxpqCbs084Gbd664cRAdi9rQcQqNchmpPqCysm3AdiVgzbxPLFRLISLvBEhBy1yw==` | `63a9a914d27989478d0fdc56108972dff964d31e` | `https://registry.npmjs.org/@cvd-policy/cli/-/cli-0.4.0.tgz` |

## Attestations and signatures

No release metadata contains `dist.attestations`; npm provenance attestations are therefore not available for these releases.

The metadata does contain npm registry signatures. Installing each matching core/CLI pair and running `npm audit signatures` succeeded for every version from `0.1.0` through `0.4.0`; each run reported eight packages with verified registry signatures. Registry signatures verify registry package integrity, not the source build environment or an npm provenance attestation.

## `gitHead` verification

The `gitHead` values for `0.1.0` through `0.3.1` were present in the original local clone and are ancestors of the checked-out history.

After fetching `origin/main`, the `0.4.0` commit `eca80c738498e87d4fadd5f65f87b020b1522bff` was also present and was an ancestor of remote commit `8559457a4f6406627a27f4bb736ee1cfe98b089c`. Its commit subject is:

```text
fix(site): updated own cvd.json according to the new structure of the cvd.html and updated used version
```

The checked-out `web` branch was fast-forwarded to `8559457a4f6406627a27f4bb736ee1cfe98b089c` before V1 work. There are no package-source changes under `packages/core`, `packages/cli`, or the package README between the recorded `gitHead` and that commit.

No historical tag was created.

## Tarball comparison

The registry tarballs for `0.3.1` and `0.4.0` were downloaded and extracted outside the repositories.

### Core: 0.3.1 to 0.4.0

Both tarballs contain 25 files. No path was added or removed. Changed files:

- `package.json`: version only;
- `LICENSE`: copyright-year update;
- `dist/securitytxt.js` and `dist/securitytxt.d.ts`: additive human-readable `Policy` URL support;
- `README.md`: byte digest unchanged between the two published versions.

The root export map is unchanged and still exposes only `.`. Dependencies and build scripts are unchanged.

### CLI: 0.3.1 to 0.4.0

Both tarballs contain six files. No path was added or removed. Changed files:

- `package.json`: package version and the exact core dependency changed from `0.3.1` to `0.4.0`;
- `LICENSE`: copyright-year update.

The CLI binary, source behavior, and package file list are otherwise unchanged. Neither CLI tarball contains a README.

### 0.4.0 to recorded source commit

A detached worktree at the recorded `gitHead` was installed with `npm ci`, core was rebuilt, and both packages were packed with the repository package definitions.

The rebuilt tarballs are not byte-identical to the registry tarballs. Extracted content differs only by line endings:

- core: `README.md`;
- CLI: `src/main.mjs` and `src/messages.mjs`.

The registry copies use CRLF and the Linux rebuild uses LF. After CRLF-to-LF normalization, every extracted file is identical. Package manifests, exports, JavaScript, declarations, embedded schemas/validators, CLI source, licenses, and README text are otherwise reproducible from `eca80c7`.

### 0.4.0 to current local source

The current local package sources match the recorded `gitHead`. Rebuilding and packing from current source gives the same result as the detached `gitHead` build: all published package content matches after line-ending normalization.

## Conclusion

The source provenance of npm `0.4.0` is reconstructable and consistent with its recorded `gitHead`. The exact `.tgz` bytes are not reproducible on Linux because three text files were packed with CRLF line endings in the registry artifacts and LF locally. There is no npm provenance attestation that proves the original build environment.

This evidence is sufficient to preserve the existing 0.4 line and develop V1 additively. It is not evidence for creating a historical release tag automatically, and this audit creates none.
