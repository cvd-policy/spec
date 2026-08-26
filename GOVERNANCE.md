# Governance

Who decides what this format says, how a change is made, and what happens to it
if the people maintaining it stop. Anyone deciding whether to depend on a small
format needs those three answers, and a licence only answers the first half of
the third.

This document describes practice, not requirements. Nothing here changes what a
document must contain; that is [SPEC.md](SPEC.md) alone.

## Who maintains it

Skalvar Technologies UG (haftungsbeschränkt), Wismar, Germany.

One company. It is worth saying plainly rather than implying a committee that
does not exist: the specification, the schema, the reference library and the
website were written there and are maintained there. A governance document that
described a foundation would be fiction, and fiction is worse than a small
number honestly stated.

That is a fact about who does the work today, not a claim on the format. What
keeps it from being a vendor format is not the size of the maintainer but what
the maintainer has given up, below.

## What is already given up

- The specification, the schema and the test corpus are **CC0-1.0**. Copy them,
  host them, change them, implement them, sell something built on them. No
  permission is needed and none can be withdrawn.
- There is **no trademark** on the name of the format, none will be registered,
  and none will be asserted. See the trademark policy in the implementation
  repository.
- The reference library and the website are Apache-2.0. An implementation having
  an owner says nothing about the format; this one can be replaced.
- The generator has no provider pre-filled and no list to choose from. If that
  ever changes, the site has stopped being neutral and saying so publicly is the
  correct response.

## What a published version guarantees

**A published version never changes.** Once a version number appears in a
released specification, documents written for it stay valid and stay readable.
0.1 remains published and valid; consumers that understand a later version must
keep reading earlier ones.

This is the guarantee everything else is built on, and it is not negotiable by
any process described here.

## Errata

Prose can be corrected. Where the text and the schema disagreed, the schema
governed all along, so an erratum records what was already true rather than
changing it.

An erratum may fix wording, correct a statement that was never accurate, or add
something the text should always have said. It may not add, remove or alter a
requirement. Errata are listed at the top of [CHANGELOG.md](CHANGELOG.md).

If a correction would change what a publisher has to do, it is not an erratum.
It is a new version.

## What warrants a new version

A new version is for a change that alters what a document may or must contain:
a new field, a new rule, a new obligation on consumers.

Additive wherever possible. 0.2 added exactly one optional field, and every 0.1
document stayed valid. A change that would invalidate published documents needs
a reason strong enough to justify the cost to everyone who already published one,
and the cost grows with every deployment.

Format versions are not package versions. `@cvd-policy/core` and
`@cvd-policy/cli` are versioned independently and say what changed in the
package; `cvd_policy` inside a document says which rules that document was
written for.

## How a change is proposed

Open an issue or a pull request at
`https://github.com/cvd-policy/spec`. Say what a publisher or a consumer would
have to do differently, and why the format cannot already express it.

Changes to the specification are decided by the maintainer. Where a change would
affect published documents, the reasoning is written down in the changelog rather
than left to the commit history.

Proposals are more persuasive with a real case behind them: a publisher who
cannot say something they need to say, or a consumer that cannot act on what the
format currently carries.

## Independent implementations

The reference library is one implementation written by the format's author,
which is the weakest possible evidence that a format is implementable by anyone
else. Independent implementations are the strongest.

They are listed on the website's tools page. The list is open; a pull request
adding one is welcome, and no permission or conformance certificate is required
to write one. The test corpus in `tests/` exists so that an implementation can
check itself without asking anybody.

## The IANA registration

The well-known URI `cvd.json`, the `security.txt` field `CVD-Policy` and the
media type `application/cvd-policy+json` are registered, or intended to be, as
recorded in section 9 of the specification. The change controller is the
maintainer named above.

If maintenance transfers, the change controller entry transfers with it. A
registration is not a claim of ownership over the format; it is the record of
who can be asked to update the entry.

## If maintenance stops

Companies are sold, and they close. The format should survive either.

Because the specification and the corpus are CC0, nothing has to be arranged in
advance: anyone may take the last published version, continue it, and publish
their continuation. No licence expires, no permission lapses, and no rights
revert to anyone.

Two requests, neither enforceable and both asked in good faith:

- Publish a continuation under a different name, so that two incompatible things
  are not both called the CVD Policy Format. Nothing in a fork's content needs to
  change — only what it is called.
- Do not call a document a CVD Policy document if it does not follow the
  specification it names. Incorrect claims of conformity are what make a small
  format unreliable, and that damage falls on publishers who did nothing wrong.

If this format is ever worth standardising properly — an Internet-Draft, or
change control handed to a standards body — that is a better outcome than
continued maintenance here, and this document should be replaced by whatever
that body requires.
