# Changelog

## 0.2 — released

Adds one optional field. Every 0.1 document stays valid, and consumers of 0.2
must keep reading 0.1 documents.

- `report_requirements.intake` — where a structured report may be submitted, in
  which shape, and whether anonymous submission is accepted. `https` only, no
  credentials, and the endpoint may be delegated to a provider.
- Normative rules for consumers: never submit without a person confirming it,
  show the receiving host, never attach files automatically, fall back to a
  contact channel when submission fails.
- New profile `report-0.1`: the shape of an incoming report. Three required
  fields, exploitation as a three-state value, consent split into three separate
  decisions.
- Section 5.3 states how versions coexist.

## 0.1 — released

First draft.

- `security.txt` field `CVD-Policy`, well-known path `/.well-known/cvd.json`
- Required fields: `cvd_policy`, `canonical`, `expires`, `organization`,
  `contact`, `research`, `scope`, `report_requirements`
- Four postures: `open`, `limited`, `report_only`, `prohibited`
- Scope precedence: `out_overrides_in`, `explicit_order`
- Testing rules with normative `conditions`
- Optional `testing`, `disclosure`, `profiles`
- Consumers ignore unknown fields and treat unknown activities as prohibited
