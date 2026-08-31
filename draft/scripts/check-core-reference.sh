#!/bin/sh
set -eu

commit=dd216d99553784e307f88d4da77c1fc24b90359b
CDPATH=
export CDPATH
spec_repo=$(git -C "$(dirname -- "$0")/../.." rev-parse --show-toplevel)
common_dir=$(git -C "$spec_repo" rev-parse --git-common-dir)
case $common_dir in
  /*) ;;
  *) common_dir=$spec_repo/$common_dir ;;
esac
web_repo=$(cd -- "$(dirname -- "$common_dir")/../web" && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM

git -C "$web_repo" cat-file -e "$commit^{commit}"
git -C "$web_repo" archive "$commit" | tar -x -C "$tmp"
(
  cd "$tmp"
  npm ci --ignore-scripts --no-audit --no-fund
  npm run core:test
)
