# Changelog

## 0.1 — unreleased

First draft.

- `security.txt` field `CVD-Policy`, well-known path `/.well-known/cvd.json`
- Required fields: `cvd_policy`, `canonical`, `expires`, `organization`,
  `contact`, `research`, `scope`, `report_requirements`
- Four postures: `open`, `limited`, `report_only`, `prohibited`
- Scope precedence: `out_overrides_in`, `explicit_order`
- Testing rules with normative `conditions`
- Optional `testing`, `disclosure`, `profiles`
- Consumers ignore unknown fields and treat unknown activities as prohibited
