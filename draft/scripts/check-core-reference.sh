#!/bin/sh
set -eu

commit=ecde38cf555fcd8964d44778f315d2cbaf547efd
CDPATH=
export CDPATH
web_repo=$(cd -- "$(dirname -- "$0")/../../../web" && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM

git -C "$web_repo" cat-file -e "$commit^{commit}"
git -C "$web_repo" archive "$commit" | tar -x -C "$tmp"
(
  cd "$tmp"
  npm ci --ignore-scripts --no-audit --no-fund
  npm run core:test
)
