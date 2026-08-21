# Changelog

## Errata

Corrections to the prose of a released version. A published version never
changes; where the text and the schema disagreed, the schema governed all along,
so nothing anyone published needs reissuing.

- **0.2, section 4.2** — the field table gave the type of `cvd_policy` as
  `"0.1"`, which had been true of the 0.1 text it was copied from. The 0.2
  schema pins `"0.2"` and section 5.3 sets out how the versions coexist; only
  the table was wrong. It now reads `"0.1"` or `"0.2"`, in both languages.
- **0.2, section 6** — the text still said "version 0.1 defines no signature
  mechanism", written before 0.2 existed and equally true of it. It now says
  that no published version defines one. The section also notes what a
  publisher meets in practice: a `security.txt` may be clear-signed, and adding
  `CVD-Policy` to such a file breaks that signature.
- **German translation, wording only** — "Werkzeug" now reads "Tool", which is
  what German-speaking developers call one. The English text governs and did not
  change; neither did any requirement.

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
