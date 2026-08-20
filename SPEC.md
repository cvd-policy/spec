# CVD Policy Format

**Status:** Draft
**Version:** 0.2
**Date:** 2026-08-21
**License:** CC0-1.0
**Canonical version:** https://cvd-policy.eu/spec
**Translations:** [Deutsch](SPEC.de.md)

---

## 1 Introduction and scope

An organisation that accepts reports about security vulnerabilities has no
machine-readable way to state its terms. `security.txt` (RFC 9116) names a
contact and points, via the `Policy:` field, at an arbitrary HTML page. What that
page says cannot be evaluated by a tool.

The CVD Policy Format closes exactly that gap: a JSON document stating *whether*
security research is welcome, *on what*, *under which conditions*, *how to
report* and *how disclosure is handled*.

**What this format is not:**

- Not a replacement for `security.txt`. It adds one field to it.
- Not evidence of regulatory conformity, including under the Cyber Resilience
  Act. A profile may add fields that make an assessment easier — the assessment
  itself is out of scope.
- Not a legal basis. See section 8.
- Not a rating. The format has no maturity level and no score.

A document following this format is called a **policy document**. The party
publishing it is the **publishing organisation**. A party that retrieves and
evaluates it is a **consumer**.

---

## 2 Terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are to be interpreted
as described in RFC 2119 and RFC 8174 when, and only when, they appear in all
capitals.

| Term         | Meaning                                                             |
| ------------ | ------------------------------------------------------------------- |
| Activity     | A class of testing action, e.g. automated scanning                  |
| Scope        | The set of systems and products the statement applies to            |
| Posture      | The value of `research.posture`                                     |
| Profile      | A named extension adding fields and obligations                     |

---

## 3 Discovery

### 3.1 The `CVD-Policy` field in security.txt

An organisation publishing a `security.txt` per RFC 9116 SHOULD carry the field
`CVD-Policy`. Its value is an absolute `https` URI pointing at a policy document.

```text
Contact: mailto:security@example.com
Policy: https://example.com/security-policy
CVD-Policy: https://example.com/.well-known/cvd.json
Expires: 2027-06-30T23:59:59Z
```

The field MAY appear more than once. Consumers MUST prefer the first occurrence
in that case and MAY ignore the rest.

At the time of this revision the field is not registered with IANA. RFC 9116
explicitly permits unknown fields; standards-compliant parsers ignore it without
consequence.

### 3.2 Well-known path as a fallback

If a consumer finds no `CVD-Policy` field, it MAY retrieve

```text
https://<host>/.well-known/cvd.json
```

Publishing organisations SHOULD place their document at this path even when they
also carry the security.txt field.

The document SHOULD be served as `application/json`. The media type
`application/cvd-policy+json` is intended but not registered; consumers MUST NOT
reject a document on the basis of its media type alone.

### 3.3 Order

A consumer that checks both paths MUST give the `CVD-Policy` field from
`security.txt` precedence over the well-known path. Where the two documents
differ, the one referenced by `CVD-Policy` applies.

---

## 4 Document structure

A policy document is a JSON object (RFC 8259). Text values are UTF-8.

### 4.1 Required fields

```text
cvd_policy          Version identifier
canonical           Self-reference to the intended location
expires             Expiry timestamp
organization        The publishing organisation
contact             Reporting channel
research            Posture
scope               Scope of the statement
report_requirements What a report has to contain
```

All other fields are optional.

### 4.2 `cvd_policy`, `canonical`, `expires`, `updated`

| Field        | Type                   | Required | Meaning                                  |
| ------------ | ---------------------- | -------- | ---------------------------------------- |
| `cvd_policy` | `"0.1"`                | yes      | Version of this format                   |
| `canonical`  | URI, `https://`        | yes      | Location at which the document applies   |
| `expires`    | date-time (RFC 3339)   | yes      | Point in time after which it is invalid  |
| `updated`    | date (RFC 3339)        | no       | Day of the last substantive change       |

`expires` MUST lie in the future. A period of at most twelve months is
recommended: a document reviewed once a year is less likely to be out of date
without anyone noticing.

`canonical` lets a consumer detect that a document was copied from elsewhere. If
the retrieval location differs, the consumer SHOULD warn but MUST NOT discard the
document for that reason alone.

### 4.3 `organization`

```json
{
  "name": "Example Control Systems Ltd.",
  "country": "DE",
  "role": "manufacturer",
  "url": "https://example.com"
}
```

`name` is required. `country` is a two-letter code per ISO 3166-1 alpha-2. `role`
is one of `manufacturer`, `operator`, `both`, `other`.

### 4.4 `contact`

```json
{
  "channels": [
    { "type": "email", "value": "security@example.com", "preferred": true },
    { "type": "form", "value": "https://example.com/security/report" }
  ],
  "languages": ["en", "de"],
  "encryption": [
    { "type": "pgp", "value": "https://example.com/pgp-key.txt", "fingerprint": "AAAA BBBB …" }
  ],
  "response_target": { "acknowledge_within_hours": 48, "update_interval_days": 14 }
}
```

`channels` MUST contain at least one entry. `type` is one of `email`, `form`,
`service`, `postal`. `service` denotes an arbitrary third-party intake service;
the publishing organisation enters its URL itself. This format neither knows nor
prefers any provider.

If no channel sets `preferred`, the first entry is considered preferred.

`response_target` is a self-commitment without legal effect. It is nevertheless
the value reporters look for most often.

### 4.5 `research`

```json
{ "posture": "report_only", "statement": "Our equipment runs in …" }
```

`posture` MUST be one of:

| Value         | Meaning                                                                       |
| ------------- | ----------------------------------------------------------------------------- |
| `open`        | Testing the listed systems is welcome, within the rules under `testing`       |
| `limited`     | Testing is permitted only within the explicitly described frame               |
| `report_only` | No invitation to test. Reports are accepted and acted upon                    |
| `prohibited`  | Testing is ruled out; reports go through another route or not at all          |

`report_only` is explicitly not a weaker statement than `open`. It is the
accurate statement for the majority of organisations.

Where `posture` is `open` or `limited`, `testing` MUST be present.
Where `posture` is `report_only` or `prohibited`, `testing.rules` MUST NOT be
populated; an empty array or an absent field is permitted.

`statement` is prose, at most 1000 characters, meant for humans.

### 4.6 `scope`

```json
{
  "precedence": "out_overrides_in",
  "web": [
    { "pattern": "*.example.com", "state": "in" },
    { "pattern": "shop.example.com", "state": "out", "reason": "third_party" }
  ],
  "products": [
    {
      "name": "SC-4000 Controller",
      "purl": "pkg:generic/example/sc4000",
      "versions": ">=2.0.0",
      "supported_until": "2030-12-31",
      "sbom": "https://example.com/sbom/sc4000.json"
    }
  ]
}
```

`precedence` is required and MUST be `out_overrides_in` or `explicit_order`.

- `out_overrides_in`: if at least one entry with `state: "out"` matches a target,
  the target is out of scope — regardless of order.
- `explicit_order`: the last matching entry in document order wins.

`pattern` is a hostname, optionally with a leading `*.`. The wildcard covers the
domain itself and every host under it: `*.example.com` matches `example.com`,
`api.example.com` and `a.b.example.com`, but not `evil-example.com`. Comparison
is case-insensitive; a trailing dot, a port and any userinfo are ignored.

A path component is permitted and matches whole segments: `example.com/api`
covers `/api` and `/api/v1`, but not `/api2`. Regular expressions are NOT
provided for.

A target that no entry matches is **out of** scope. There is no implicit `in`.

### 4.7 `testing`

```json
{
  "default": "prohibited",
  "rules": [
    {
      "activity": "automated_scanning",
      "state": "allowed",
      "conditions": {
        "max_requests_per_second": 5,
        "user_agent_contains": "research-",
        "targets": ["staging.example.com"]
      }
    },
    { "activity": "dos", "state": "prohibited" }
  ]
}
```

`default` MUST be present and applies to every activity no rule matches.
`prohibited` is recommended.

`activity` is a string. The following identifiers are provided for:

```text
manual_testing        automated_scanning     fuzzing
brute_force           dos                    social_engineering
phishing              physical               spam
data_exfiltration     account_takeover       third_party_pivot
supply_chain          persistence
```

Other identifiers are permitted. For evaluation see section 5.

`conditions` are normative. They are not a recommendation and not background
information.

An activity SHOULD appear at most once. Where it appears more than once, the
first entry wins (section 5.1) — a later, less restrictive duplicate has no
effect. Publishers SHOULD NOT rely on that: they SHOULD merge the rules
themselves, so that a reader cannot mistake the intent.

### 4.8 `report_requirements`

```json
{
  "required_fields": ["affected_asset", "description", "reproduction_steps", "impact"],
  "proof_of_exploitation": "prohibited",
  "formats": ["text", "markdown"],
  "max_attachment_mb": 20
}
```

`required_fields` is required and MAY be empty. `proof_of_exploitation` with the
value `prohibited` means that evidence going beyond demonstrating reachability
(such as exfiltrated data) is unwanted.

#### `intake` (since 0.2)

An organisation that can receive a structured report says so here. Everything in
`intake` is optional; a document without it is complete.

```json
{
  "intake": {
    "url": "https://example.com/report/submit",
    "schema": "https://example.com/report/schema.json",
    "profile": "report-0.1",
    "anonymous": true,
    "max_bytes": 5242880,
    "attachments": "after_contact"
  }
}
```

| Field | Meaning |
| ----- | ------- |
| `url` | Endpoint that accepts a report. Required within `intake`, `https` only |
| `schema` | JSON Schema the endpoint accepts, `https` only |
| `profile` | Named report profile the schema builds on, e.g. `report-0.1` |
| `anonymous` | Whether a report without reporter details is accepted |
| `max_bytes` | Largest accepted submission |
| `attachments` | `accepted`, `after_contact` or `not_accepted` |

`url` and `schema` MUST be absolute `https` URIs and MUST NOT contain userinfo.
The document MUST NOT carry credentials of any kind: an endpoint that needs a
secret to accept reports does not belong in a public file.

The endpoint MAY sit on a domain other than the publisher's. That is a
delegation, decided by whoever publishes the document, exactly like a `service`
contact channel — and it is the normal case for an organisation whose intake is
run by a provider.

`intake` describes an additional, machine-readable route. It does not replace
`contact`: a person MUST still be able to report through a channel listed there.

##### Rules for consumers

```text
- Consumers MUST NOT submit a report without a person confirming that submission.
- Consumers MUST show the receiving host before anything is sent.
- Consumers MUST NOT attach files or proof-of-concept material automatically.
- Consumers MUST treat a failed submission as a failure to report, and fall back
  to a channel from "contact".
```

The first rule is the important one. A report contains the details of an unfixed
vulnerability. Deciding where that goes is a judgement a person makes, not a step
a tool performs on their behalf.

### 4.9 `disclosure`

```json
{
  "model": "coordinated",
  "deadline_days": 90,
  "advisory_url": "https://example.com/security/advisories",
  "credit": "offered"
}
```

`model` is one of `coordinated`, `full_after_deadline`, `vendor_only`,
`no_disclosure`. `deadline_days` is the usual deadline in days; it is an
expectation, not a guarantee.

---

## 5 Semantics for consumers (normative)

The following six sentences are the core statements of this specification.

```text
- Consumers MUST ignore unknown fields rather than discard the document.
- Consumers MUST treat unknown values of "activity" as "prohibited".
- Consumers MUST treat a document with an elapsed "expires" as absent.
- "out" takes precedence over "in" unless "precedence" states otherwise.
- Conditions in "conditions" are normative and MUST be enforced by automated
  tools, not merely displayed.
- This document creates no legal protection. It records a statement by the
  publishing organisation.
```

### 5.1 Order of evaluation

A consumer deciding whether an activity A against a target T is permitted MUST
proceed in this order:

1. If `expires` has elapsed, the document counts as absent. Stop.
2. If `cvd_policy` is unknown, the consumer MUST stop and MUST NOT guess.
3. If `research.posture` is `prohibited` or `report_only`, A is not permitted.
   Stop.
4. If the document has no authority over T (section 5.2), it MUST NOT be treated
   as permission for T. Stop.
5. If T is out of scope per the rules in section 4.6, A is not permitted. Stop.
6. If a rule in `testing.rules` matches A, its `state` applies. If none matches,
   `testing.default` applies. Where several rules name the same activity, the
   **first** in document order applies and consumers MUST ignore the rest.
7. If the outcome is `allowed` and `conditions` are present, A is permitted only
   for as long as every condition is met.

Where no rule matches and the activity is one the consumer does not recognise,
step 6 MUST yield `prohibited`, even where `testing.default` is `allowed`. A rule
naming that activity explicitly is a decision by the publishing organisation and
applies as written — the rule against guessing covers the default path, not an
express statement.

### 5.2 Authority

A document has authority over a host H when either holds:

- H is the host in `canonical`, or sits under it. A document at
  `https://example.com/.well-known/cvd.json` covers `example.com` and
  `api.example.com`; one at `https://blog.example.com/...` covers only
  `blog.example.com` and hosts below it.
- H pointed at this document itself — through the `CVD-Policy` field in H's own
  `security.txt`, or by serving it at H's own `/.well-known/cvd.json`. Only the
  owner of H can arrange that, which is what makes it a delegation.

Addresses have no hierarchy: an IPv4 or IPv6 literal covers itself and nothing
else.

Consumers MUST record which host's discovery produced a document and MUST apply
the second rule only to that host. A document reached while looking up one host
says nothing about another. Where a consumer holds a document with no such
record, only the first rule applies.

This bounds a takeover: a policy planted on an abandoned subdomain covers that
subdomain, not the organisation. It also permits central hosting — one document,
served wherever, pointed at from each host's `security.txt` — and hosting by a
third party on an organisation's behalf.

### 5.3 Versions

`cvd_policy` names the version a document was written for. A consumer
implementing this version MUST also accept `0.1` documents and evaluate them by
the rules of 0.1 — which differ only in that `report_requirements.intake` is not
defined there.

A published version never changes. `0.1` documents stay valid and stay readable;
nothing in 0.2 obliges anyone to reissue a document.

Because unknown fields are ignored (section 5), a 0.1 document MAY already carry
an `intake` block. A consumer that knows only 0.1 skips it; one that knows 0.2
MAY use it. Publishers SHOULD set `cvd_policy` to `0.2` when they rely on it.

### 5.4 Error tolerance

A document that violates the schema SHOULD be treated as absent. A consumer MAY
use parts of a faulty document for display to humans, but MUST make clear that
the document is invalid, and MUST NOT derive any permission from it.

---

## 6 Integrity and signature

Version 0.1 defines no signature mechanism. Integrity rests on TLS and on control
over the location the document is served from.

A later mechanism SHOULD sit beside the document as a detached signature
(`cvd.json.sig`) so that the document itself stays plain JSON. Consumers of 0.1
ignore an unknown `signature` field without consequence — see section 5.

---

## 7 Extensions and profiles

The schema sets `additionalProperties: true` at the top level. Extensions are
explicitly welcome.

A **profile** is a named JSON Schema that adds fields and tightens existing ones,
but never loosens them. A document names the profiles it satisfies:

```json
{ "profiles": ["cra-0.1"] }
```

A consumer that does not know a profile MUST still evaluate the document per this
specification. A profile MUST NOT change the meaning of any field defined here.

Vendor-specific fields SHOULD begin with `x_`.

### 7.1 Published profiles

| Profile | Purpose | Location |
| ------- | ------- | -------- |
| `report-0.1` | Shape of an incoming vulnerability report | `schema/profiles/report-0.1.schema.json` |

`report-0.1` describes what a report contains, not what a policy contains. A
document points at it through `report_requirements.intake.profile`; the endpoint
named there accepts documents matching that profile.

Three fields are required — title, target and description. Everything else is
optional, including steps to reproduce and impact, because those are not always
available and a missing field must never stop someone from reporting. The
profile follows ISO/IEC 29147 and the reporting guidance of CISA, CERT/CC and
FIRST on that point.

Two details in the profile are deliberate:

- **Exploitation has three states**, `yes`, `no` and `unknown`. A missing tick
  in a form is not a denial, and recording it as one produces false confidence.
  Evidence is required when the state is `yes`, and remains a statement by the
  reporter rather than a confirmed finding.
- **Consent is three separate decisions**: giving contact details, allowing them
  to be passed to the affected organisation, and being named publicly. None may
  be inferred from another, and none defaults to true. A report without any of
  them MUST be accepted.

---

## 8 Security considerations

**No legal protection.** A policy document is a unilateral statement. It creates
no contract, no consent in the criminal-law sense and no waiver of liability.
Anyone relying on it does so at their own risk. The same applies in reverse:
the publishing organisation gains no claim from it either.

**False authority.** Whoever gains control of a web server can publish a policy
inviting tests. Consumers SHOULD NOT use a document as the sole basis for
intrusive action.

**Claims about other people's systems.** Nothing stops a publisher from listing
a host it does not operate in `scope`, or naming one in `conditions.targets`.
Such an entry is a statement, never an authorisation. Consumers MUST apply
section 5.2 and MUST NOT derive permission for a host the document has no
authority over. An organisation running several domains, and a provider acting
for a customer, are served by the delegation rule: each host points at the
document it wants to be judged by.

**Information disclosure.** A document naming exclusions with reason `legacy`
thereby names weak systems. That is a deliberate trade-off for the publishing
organisation; the `reason` field is therefore optional.

**Processing by consumers.** A policy document comes from a foreign server.
Consumers MUST enforce size limits, timeouts and redirect limits, and MUST NOT
reach private, loopback, link-local or metadata addresses.

---

## 9 IANA considerations

This revision requests nothing. Intended are:

- registration of the `security.txt` field `CVD-Policy` in the well-known field
  registry of RFC 9116
- registration of the media type `application/cvd-policy+json`

A request is only meaningful once real-world use can be demonstrated.

---

## 10 Examples

Complete documents live under `examples/`:

| File                                   | Content                                       |
| -------------------------------------- | --------------------------------------------- |
| `01-manufacturer-report-only.json`     | Machine builder, no invitation to test        |
| `02-saas-limited.json`                 | SaaS provider, testing against staging only   |
| `03-open-research.json`                | Open invitation with rate limiting            |
| `04-prohibited.json`                   | Testing ruled out                             |
| `05-full-cra-profile.json`             | All fields, profile `cra-0.1`                 |
| `06-machine-readable-intake.json`      | 0.2, structured intake run by a provider      |

Reports matching the `report-0.1` profile live under `examples/reports/`.

Minimal example:

```json
{
  "cvd_policy": "0.1",
  "canonical": "https://example.com/.well-known/cvd.json",
  "expires": "2027-08-18T00:00:00Z",
  "organization": { "name": "Example Ltd." },
  "contact": { "channels": [{ "type": "email", "value": "security@example.com" }] },
  "research": { "posture": "report_only" },
  "scope": { "precedence": "out_overrides_in", "web": [{ "pattern": "example.com", "state": "in" }] },
  "report_requirements": { "required_fields": ["affected_asset", "description"] }
}
```
