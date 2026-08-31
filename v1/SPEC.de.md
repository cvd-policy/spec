# CVD-Policy-Format: Kandidat für Version 1

**Status:** Experimenteller Pre-Standard-Kandidat  
**Formatversion:** `1`  
**Datum:** 2026-08-29  
**Lizenz:** CC0-1.0  
**Maßgebliche Fassung:** [English](SPEC.md)

Diese vollständige deutsche Übersetzung ist informativ. Bei Widersprüchen gilt ausschließlich die englische Fassung. Der Kandidat soll einen möglichen ersten Internet-Draft vorbereiten und kann sich vor oder während einer IETF-Prüfung ändern. Er ist kein RFC und stellt keinen IETF-Konsens dar.

## 1. Konventionen und Begriffe

Die Schlüsselwörter **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT** und **MAY** sind ausschließlich in der englischen maßgeblichen Fassung gemäß BCP 14 (RFC 2119 und RFC 8174) auszulegen.

Jede normative Anforderung besitzt eine stabile Kennung in eckigen Klammern. `v1/requirements.json` ordnet jede Kennung ausführbaren Tests zu.

- **Publisher:** Partei, die eine Policy veröffentlicht.
- **Discovery Host:** normalisierter Host, über den `security.txt` ursprünglich vor Redirects abgerufen wurde.
- **Policy-URI:** URI im vorgeschlagenen Feld `CVD-Policy`.
- **Target:** absolute HTTP(S)-URL, die für eine Aktivität ausgewertet wird.
- **Authority Evidence:** Ergebnis einer erfolgreichen `security.txt`-Bewertung; kein Eigentumsnachweis.
- **Reporting Scope:** Assets und Produkte, für die Berichte angenommen werden.
- **Testing Permission:** ausdrückliche Publisher-Aussage in einer passenden Testing-Regel.

## 2. Status und Nichtziele

[DOC-001] Ein Version-1-Dokument muss die JSON-Zahl `1` in `cvd_policy` enthalten; Strings und 0.x-Werte sind nicht Version 1.

[DOC-002] Implementierungen müssen Paketversionen und Dokumentformatversion getrennt behandeln.

`CVD-Policy` und `application/cvd-policy+json` sind vorgeschlagen und nicht bei IANA registriert. Version 1 ist ein Pre-Standard-Kandidat, kein stabiler oder veröffentlichter Standard.

Dieses Format:

- beweist kein Eigentum und keine Kontrolle über ein Asset;
- bietet keine Rechtsberatung, rechtliche Autorisierung oder garantierten Safe Harbor;
- veranlasst keine Software zur Durchführung von Tests;
- definiert keine Übermittlung von Schwachstellenberichten, Authentisierung, Retries, Anhänge oder Transporte;
- ersetzt nicht das menschenlesbare Feld `Policy` aus RFC 9116;
- definiert keine Syntax für Produktversionsbereiche.

Ein strukturiertes Protokoll zur Berichtsübermittlung kann später separat standardisiert werden. Eine Kontakt-URI darf auf ein vorhandenes Formular zeigen, ohne dieses Formular zum Bestandteil des Formats zu machen.

## 3. JSON-Verarbeitung und Validierungsebenen

[DOC-003] Policy-Text muss UTF-8-JSON nach RFC 8259 sein und genau einen Top-Level-Wert enthalten, der ein Objekt ist.

[DOC-004] Ein Parser muss Kommentare, nachgestellte Kommata, mehrere JSON-Texte, Nicht-JSON-Zahlen und doppelte Member-Namen auf jeder Ebene ablehnen.

[DOC-005] Automatische Discovery und Auswertung müssen vor normaler Objektvalidierung einen duplicate-aware Textparser verwenden.

Ein nach `JSON.parse` übergebenes JavaScript-Objekt kann nicht nachträglich auf doppelte Member geprüft werden. Objektvalidierung kann Schema- und Semantikprüfungen durchführen, aber keine Duplicate-Sicherheit behaupten.

Validierung besitzt vier getrennte Ebenen:

1. Textparsing und Duplicate-Erkennung;
2. Auswahl der Formatversion und JSON-Schema-Validierung;
3. semantische Validierung;
4. Ablauf-, Extension-, Authority-, Target-, Scope-, Regel- und Bedingungsauswertung.

[DOC-006] Ein Validator darf während der Validierung weder Defaults einfügen noch Typen konvertieren.

[DOC-007] Jedes Core-Objekt muss unbekannte Eigenschaften ablehnen; Extension-Daten sind ausschließlich unter `extensions` zulässig.

## 4. Dokumentmodell

Erforderliche Top-Level-Member:

```text
cvd_policy
last_updated
expires
organization
contact
research
reporting_scope
reporting
```

Optionale Member:

```text
testing
response_targets
disclosure
critical_extensions
extensions
```

[DOC-008] Fehlende optionale Member dürfen keine Testing Permission erzeugen. Insbesondere bedeutet fehlendes `testing`, dass keine Testing Permission vorliegt.

### 4.1 Zeit

`last_updated` und `expires` sind RFC-3339-Date-Time-Strings.

[DOC-009] `expires` muss einen Zeitpunkt strikt nach `last_updated` darstellen.

[DOC-010] Eine abgelaufene Policy muss den normativen Status `invalid-policy` ergeben und darf keine Testing Permission erzeugen. Eine detaillierte Ablaufdiagnose ist informativ und implementierungsspezifisch.

Die Auswertung akzeptiert ein injiziertes `now`. Eine Laufzeit von ungefähr einem Jahr ist nur eine nichtnormative Empfehlung.

### 4.2 Organisation

```json
{
  "name": "Example Organization",
  "uri": "https://example.com/"
}
```

[DOC-011] `organization.name` muss ein nichtleerer String sein.

[DOC-012] Falls vorhanden, muss `organization.uri` eine absolute HTTPS-URI ohne Userinfo sein.

Organisationsmetadaten begründen keine Authority.

### 4.3 Kontakt

```json
{
  "channels": [
    "mailto:security@example.com",
    "https://example.com/security/contact"
  ],
  "preferred_languages": ["en", "de"],
  "encryption": ["https://example.com/security/pgp-key.txt"]
}
```

[DOC-013] `contact.channels` darf nicht leer sein. Jeder Eintrag muss eine absolute URI sein und ausschließlich das Scheme `mailto`, `tel` oder `https` verwenden; das Array darf kein identisches Duplikat enthalten.

[DOC-014] HTTPS-Kontakt-URIs dürfen weder Userinfo noch ein Fragment enthalten.

Kanalreihenfolge drückt Präferenz aus. Sprachreihenfolge nicht.

[DOC-015] Jeder Wert in `preferred_languages` muss ein gültiger BCP-47-Sprach-Tag sein.

[DOC-016] `encryption`-Werte müssen absolute URIs sein und auf Schlüssel verweisen, statt Schlüsselmaterial einzubetten.

### 4.4 Research Posture

`research.posture` ist einer der folgenden Werte:

- `open`: Forschung ist grundsätzlich willkommen; nur passende ausdrückliche Regeln sagen Testing Permission aus;
- `limited`: Forschung ist nur unter ausdrücklichen Regeln willkommen;
- `report_only`: Berichte werden angenommen, aber Testing Permission wird nicht erklärt;
- `prohibited`: der Publisher erklärt aktive Tests als untersagt.

[TEST-001] `open` darf ohne passende `permitted`-Regel keine Permission implizieren.

[TEST-002] Eine `report_only`- oder `prohibited`-Policy darf keine `permitted`-Regel enthalten.

`research.statement` ist erklärender Text ohne Auswertungswirkung.

### 4.5 Reporting Scope

`reporting_scope` beschreibt berichtbare Assets und Produkte. Er sagt für sich keine Testing Permission aus.

[SCOP-001] Jede Scope- und Testing-Regel-ID muss dokumentweit eindeutig sein.

#### 4.5.1 Web-Einträge

```json
{
  "id": "main-web",
  "state": "in",
  "host": "example.com",
  "schemes": ["https"],
  "ports": [443],
  "path_prefix": "/",
  "include_subdomains": false
}
```

[SCOP-002] `host` muss ein normalisierter DNS-Name, ein IPv4- oder IPv6-Literal ohne Scheme, Port, Pfad, Userinfo, Wildcard, Query oder Fragment sein.

[SCOP-003] DNS-Namen müssen zum Vergleich in kleingeschriebene ASCII-A-Labels überführt und um genau einen abschließenden Punkt gekürzt werden.

[SCOP-004] IPv4- und IPv6-Literale müssen kanonisch verglichen werden; IP-Einträge müssen `include_subdomains: false` setzen.

[SCOP-005] `schemes` muss mindestens `http` oder `https` enthalten und darf kein anderes Scheme enthalten.

Ohne `ports` gilt nur der Standardport des passenden Schemes: 80 für HTTP und 443 für HTTPS. Nichtstandardports müssen ausdrücklich aufgeführt sein.

[SCOP-006] `path_prefix` muss mit `/` beginnen und darf keine Query- oder Fragmentsyntax enthalten.

Pfadmatching verwendet den normalisierten URL-Pfad ohne Query oder Fragment, beachtet Groß-/Kleinschreibung und dekodiert reservierte Zeichen nicht. `/` passt auf alle Pfade. Ein mit `/` endendes Präfix passt auf Pfade, die damit beginnen. Jedes andere Präfix passt exakt oder mit anschließendem `/`. Daher passt `/api` auf `/api`, `/api/` und `/api/v1`, aber nicht `/apix`.

`include_subdomains: true` passt auf echte DNS-Subdomains an Labelgrenzen und auf den genannten Host. Dadurch entsteht keine Authority; jeder Target-Host benötigt eigene Discovery Evidence.

[SCOP-007] Ein passender `out`-Eintrag muss jeden passenden `in`-Eintrag unabhängig von der Array-Reihenfolge überschreiben.

[SCOP-008] Die Reihenfolge von Scope- und Regelarrays darf ein Ergebnis nicht verändern.

#### 4.5.2 Produkt-Einträge

```json
{
  "id": "example-product",
  "state": "in",
  "name": "Example Product",
  "identifiers": ["pkg:npm/example-product"]
}
```

[SCOP-009] Produkt-Einträge müssen ausschließlich als Reporting-Metadaten behandelt werden und dürfen keine automatische Testing Permission erzeugen.

Produktidentifikatoren sind absolute URI-artige Kennungen. Versionsbereichssyntax liegt außerhalb von Version 1.

### 4.6 Testing-Regeln

Core-Aktivitäten:

- `manual_testing`: manuell initiierte Untersuchung, soweit keine spezifischere Core-Aktivität greift;
- `automated_scanning`: automatisierte Erkennung oder Schwachstellenprüfung gegen Web- oder Netzwerkdienste;
- `fuzzing`: automatisierte Übermittlung erzeugter oder mutierter Eingaben;
- `credential_testing`: Prüfung nur mit eigenen oder ausdrücklich bereitgestellten Testkonten; Credential Stuffing, Password Spraying und fremde Zugangsdaten sind ausgeschlossen.

[TEST-003] Eine Extension-Aktivität muss eine absolute URI sein; ein unbekannter unqualifizierter Wert wie `automated_scaning` ist ungültig.

Regeln verwenden `state: permitted` oder `state: prohibited`. Version 1 definiert weder `allowed` noch `testing.default` oder `explicit_order`.

[TEST-004] Eine `permitted`-Regel muss mindestens eine `target_id` enthalten.

[TEST-005] Eine `prohibited`-Regel ohne `target_ids` muss für alle Web-Targets im Reporting Scope gelten.

[TEST-006] Jede `target_id` muss einen existierenden `in`-Web-Eintrag referenzieren; Produkt- und `out`-Referenzen sind ungültig.

[TEST-007] Eine passende `prohibited`-Regel muss jede passende `permitted`-Regel überschreiben.

Keine passende Regel bedeutet keine Testing Permission.

#### 4.6.1 Bedingungen

Version 1 definiert nur:

- `max_requests_per_second`: positive Zahl;
- `max_concurrent_requests`: positive Ganzzahl;
- `required_user_agent_token`: nichtleerer sichtbarer ASCII-String, der als vollständiger case-sensitiver Teilstring im geplanten User-Agent vorkommen muss;
- `test_accounts_only`: der Literalwert `true`.

[COND-001] Unbekannte Eigenschaften in `conditions` müssen die Policy strukturell ungültig machen.

[COND-002] Eine erlaubende `automated_scanning`- oder `fuzzing`-Regel muss Rate und Parallelität begrenzen.

[COND-003] Eine erlaubende `credential_testing`-Regel muss beide Limits und `test_accounts_only: true` enthalten.

[COND-004] Ein Client muss einen fehlenden erforderlichen Planwert als nicht erfüllt behandeln und darf unbekannte Bedingungen nicht ignorieren.

Eine Bedingung ist nur erfüllt, wenn geplante Rate und Parallelität vorhanden und nicht größer als ihre Limits sind, der User-Agent den erforderlichen Token enthält und die ausschließliche Verwendung kontrollierter oder bereitgestellter Testkonten ausdrücklich bestätigt wurde.

### 4.7 Reporting Preferences

`reporting.requested_fields` enthält beliebige Werte aus:

```text
affected_asset
vulnerability_type
description
reproduction_steps
impact
environment
evidence
researcher_contact
disclosure_preference
```

[REP-001] Angefragte Felder müssen als Präferenzen interpretiert werden; ein fehlendes Feld darf allein keine Zurückweisung eines Berichts bewirken.

`proof_of_exploitation` ist `not_requested`, `requested_if_safe` oder `prohibited`.

[REP-002] `requested_if_safe` darf nicht als Aufforderung zu Zugriff auf fremde Daten, Persistenz, Exfiltration, lateraler Bewegung, Schädigung, Verfügbarkeitsbeeinträchtigung oder weitergehender Ausnutzung interpretiert werden.

### 4.8 Response Targets und Disclosure

Response-Target-Werte sind positive ganze Kalendertage. Sie sind veröffentlichte Ziele, keine technischen oder rechtlichen Garantien, und beeinflussen die Testing-Auswertung nicht.

`disclosure.approach` ist `coordinated`, `case_by_case` oder `no_preference`. `default_days` ist eine Koordinationspräferenz, keine automatische Offenlegungsfreigabe. `statement` ist erklärend.

### 4.9 Erweiterungen

Extension-IDs sind absolute URIs. Extension-Daten stehen nur als Werte unter `extensions`; `critical_extensions` ist eine Liste eindeutiger IDs.

[EXT-001] Jede ID in `critical_extensions` muss einen gleichnamigen Member in `extensions` besitzen.

[EXT-002] Eine unbekannte kritische Extension muss bei Permission-Auswertung `unsupported-policy` ergeben.

[EXT-003] Eine unbekannte nichtkritische Extension darf als Metadatum ignoriert werden und darf kein Core-Verbot oder keine Core-Bedingung abschwächen.

[EXT-004] Eine Extension, die Permission, Verbot oder Bedingungen verändert, muss als kritisch markiert sein.

## 5. Discovery über security.txt

Vorgeschlagenes Feld:

```text
CVD-Policy: https://example.com/cvd-policy.json
```

[DISC-001] Ein `CVD-Policy`-Wert muss genau eine absolute HTTPS-URI ohne Userinfo oder Fragment sein.

[DISC-002] Feldnamen müssen case-insensitive geparst werden; automatische Verarbeitung muss mehrere `CVD-Policy`-Felder ablehnen, statt eines auszuwählen.

[DISC-003] Ein Consumer darf bei fehlendem Feld weder `/.well-known/cvd.json` noch einen anderen Policy-Pfad raten.

Policy-Host und Discovery Host dürfen verschieden sein. Dateiname und Erweiterung besitzen keine normative Bedeutung. Bestehende `Policy`-Felder bleiben Links zu Human Policies; Reihenfolge und Mehrfachvorkommen bleiben erhalten.

`CVD-Policy` ist vorgeschlagen und unregistriert. Ein lokaler Generator darf `https://example.com/cvd-policy.json` vorschlagen; dies ist kein Discovery-Default.

### 5.1 Bewertung von security.txt

Kontexteingabe:

```ts
interface SecurityTxtRetrievalContext {
  requestedUri: string;
  finalUri: string;
  redirectChain: string[];
  retrievedAt: Date;
}
```

[DISC-004] Authority Evidence darf nur entstehen, wenn die Datei parsebar ist, mindestens einen gültigen `Contact`, genau ein syntaktisch gültiges `Expires` mit einem Zeitpunkt nach `retrievedAt` und genau ein gültiges `CVD-Policy` enthält. Ein syntaktisch ungültiges `Expires` und ein gültiges, aber abgelaufenes `Expires` sind verschiedene Diagnosefälle; beide begründen keine Authority.

[DISC-005] Kontext-URIs und jeder Redirect-Hop müssen HTTPS verwenden; Redirect-Verarbeitung muss den ursprünglichen Discovery Host erhalten.

Weicht der finale Redirect-Host vom angeforderten Host ab, muss mindestens ein gültiges `Canonical` exakt der ursprünglich angeforderten security.txt-URI entsprechen. Same-Host-Redirects benötigen dies nicht zusätzlich.

[DISC-006] Ein Cross-Host-Redirect ohne diesen exakten ursprünglichen `Canonical`-Wert darf keine Authority begründen. Eine detaillierte Canonical-Mismatch-Diagnose ist informativ und implementierungsspezifisch.

OpenPGP-Cleartext-Signaturen werden an ihrem RFC-9116-Frame erkannt. Core-Software muss sie nicht verifizieren.

[DISC-007] Software, die eine signierte security.txt nicht echt neu signieren kann, darf sie nicht automatisch umschreiben.

## 6. Authority-Modell

[AUTH-001] Automatische Permission-Auswertung muss ein von erfolgreicher security.txt-Bewertung erzeugtes `AuthorityEvidence` verlangen; ein vom Aufrufer übergebener Host-String reicht nicht.

```ts
interface AuthorityEvidence {
  established: true;
  discoveryHost: string;
  securityTxtUri: string;
  cvdPolicyUri: string;
  securityTxtExpires: string;
}
```

[AUTH-002] Discovery Host muss unabhängig von security.txt-Redirects, Policy-Hosting oder Policy-Redirects der Host der ursprünglich angeforderten security.txt-URI bleiben.

[AUTH-003] Normalisierter Target Host und normalisierter Discovery Host müssen vor einem positiven Permission-Status exakt übereinstimmen.

[AUTH-004] Parent-Domains, Subdomains, CNAME-Ziele, gemeinsame Adressen, Zertifikate, Organisationsbehauptungen, Scope-Wildcards, Policy-Ort, Dateinamen und Redirects dürfen Authority weder erzeugen noch übertragen.

Ein anderer Port desselben exakten Hosts kann bei passendem Scope erfasst sein. Zwei Discovery Hosts können unabhängig auf dieselbe zentrale Policy zeigen; jede Auswertung nutzt die Evidence des eigenen Hosts.

## 7. Abruf der Policy-Repräsentation

Der vorgeschlagene, unregistrierte Medientyp ist `application/cvd-policy+json`.

[FETCH-001] In der Pre-Standard-Phase müssen Netzwerkclients `application/cvd-policy+json` akzeptieren, dürfen `application/json` mit Hinweis akzeptieren und müssen HTML, Plain Text und andere unerwartete Repräsentationen für automatische Policy-Auswertung ablehnen.

Lokale Dateien besitzen keinen HTTP-Medientyp. Netzwerkabruf, Redirect-Limits, Timeouts, Größenlimits, Adressfilterung und Credential-Isolation gehören in Clients oder Adapter, nicht in den deterministischen Core.

## 8. Auswertung

### 8.1 Query und Result

```ts
interface EvaluationQuery {
  activity: string;
  target: string;
  plan?: {
    requestsPerSecond?: number;
    concurrentRequests?: number;
    userAgent?: string;
    usesOnlyTestAccounts?: boolean;
  };
  understoodExtensions?: string[];
}
```

`target` akzeptiert ausschließlich eine absolute HTTP- oder HTTPS-URL ohne Userinfo. Product-Identifier und alle anderen URI-Schemes sind keine Evaluation-Targets. Scheme und Host werden durch den URL-Parser normalisiert; fehlende Ports werden zu 80 oder 443; Query und Fragment beeinflussen Scope nicht.

Die Target-Syntax wird vor der Policy-Auswertung validiert. Ungültige Target-Eingaben erzeugen einen typisierten Eingabevalidierungsfehler mit maschinenlesbaren Issues und ohne Evaluation-Status. Sie dürfen weder `not-covered` noch einen anderen normativen Evaluation-Status erzeugen.

Eine abgeschlossene Policy-Auswertung erzeugt genau einen dieser sieben normativen Statuswerte:

```text
publisher-stated-permitted
publisher-stated-prohibited
not-covered
authority-not-established
conditions-not-satisfied
invalid-policy
unsupported-policy
```

[EVAL-001] Das primäre öffentliche Ergebnis darf kein Boolean namens `allowed`, `authorized` oder `safe` sein.

[EVAL-002] Aufrufende Software muss jeden anderen Status als `publisher-stated-permitted` als nicht belegte Testing Permission behandeln.

`publisher-stated-permitted` bedeutet nur, dass die über belegte Discovery veröffentlichte Policy eine passende Erlaubnisaussage enthält, deren maschinenprüfbare Bedingungen erfüllt sind. Es ist keine Rechtsberatung, kein Eigentumsnachweis, keine Autorisierung durch Software und kein garantierter Safe Harbor.

Ein statustragendes Ergebnis kann sortierte passende Regel- und Target-IDs, Validierungsprobleme, implementierungsspezifische Diagnosen und gegebenenfalls Constraints der ausgewählten erfüllten Regel enthalten. Detaillierte Diagnose-Identifier sind nicht Teil des normativen Interoperabilitätsvertrags. Bei mehreren erfüllten Regeln liefert die lexikografisch kleinste Regel-ID die `constraints`; dies ist nur deterministische Ausgabeauswahl, keine Priorität.

### 8.2 Verbindliche Reihenfolge

[EVAL-003] Nach erfolgreicher Validierung und Normalisierung der Target-Eingabe muss ein Evaluator diese Schritte in Reihenfolge ausführen:

1. duplicate-aware JSON-Parsen;
2. Formatversionsprüfung;
3. JSON-Schema-Validierung;
4. semantische Validierung;
5. Ablaufprüfung;
6. Prüfung unbekannter kritischer Extensions;
7. Authority-Evidence-Prüfung;
8. exakter Target-/Discovery-Hostvergleich;
9. Reporting-Scope-Matching;
10. `out`-Ausschluss;
11. Research-Posture-Prüfung;
12. Sammlung passender Regeln;
13. Verbotspräzedenz;
14. Bedingungsprüfung erlaubender Regeln;
15. stabile Konstruktion eines statustragenden Ergebnisses.

### 8.3 Statuspräzedenz

Das erste anwendbare Ergebnis in Auswertungsreihenfolge gewinnt:

- `invalid-policy`: Parse-, Duplicate-, Schema-, Semantik-, Referenz-, Posture-, andere target-unabhängige Policy- oder Ablauffehler;
- `unsupported-policy`: unbekannte Formatversion, kritische Extension oder angefragte Extension-Aktivität;
- `authority-not-established`: fehlende/ungültige Evidence oder Host-Mismatch;
- `not-covered`: ein syntaktisch gültiges normalisiertes Target hat keinen passenden `in`-Web-Scope, passt auf einen `out`-Web-Scope oder hat keine passende Testing-Regel;
- `publisher-stated-prohibited`: `report_only`, `prohibited` oder passende Verbotsregel;
- `conditions-not-satisfied`: passende Erlaubnisregeln, aber keine erfüllt alle Bedingungen;
- `publisher-stated-permitted`: mindestens eine vollständig erfüllte Erlaubnisregel und kein früheres Ergebnis.

[EVAL-004] Ein positiver Status muss eine gültige nicht abgelaufene Policy, unterstütztes kritisches Verhalten, belegte Authority, exakte Target-/Discovery-Hostgleichheit, passenden `in`-Scope, kein `out`, kein passendes Verbot und eine vollständig erfüllte Erlaubnisregel voraussetzen.

## 9. Maschinenlesbare Fehler und informative Diagnosen

[ERR-001] Eingabevalidierungs- und Policy-Verarbeitungsfehler müssen maschinenlesbar und strukturell von statustragenden Evaluation-Ergebnissen unterscheidbar sein sowie, soweit verfügbar, betroffene Stellen identifizieren. Lokalisierte Prosa darf nicht der einzige API-Vertrag sein. Implementierungen müssen nicht dieselben detaillierten Diagnose-Identifier verwenden.

Die folgenden Identifier sind informative Diagnosen der Referenzimplementierung. Sie bilden kein normatives Register; Konformität verlangt nicht, dass andere Implementierungen sie emittieren:

```text
policy_parse_error
policy_duplicate_member
policy_schema_invalid
policy_version_unsupported
policy_time_order_invalid
policy_expired
policy_uri_invalid
policy_language_tag_invalid
policy_scope_invalid
policy_scope_id_duplicate
policy_target_reference_invalid
policy_posture_conflict
policy_critical_extension_missing
policy_critical_extension_unsupported
policy_activity_unsupported
security_txt_parse_error
security_txt_contact_missing
security_txt_contact_invalid
security_txt_expires_missing
security_txt_expires_duplicate
security_txt_expires_invalid
security_txt_expired
security_txt_cvd_policy_missing
security_txt_cvd_policy_duplicate
security_txt_cvd_policy_uri_invalid
security_txt_canonical_mismatch
security_txt_redirect_invalid
authority_evidence_missing
authority_host_mismatch
target_url_invalid
scope_target_not_covered
scope_target_excluded
testing_rule_missing
testing_rule_prohibited
testing_rule_permitted
conditions_missing
conditions_exceeded
conditions_user_agent_missing
conditions_test_accounts_unconfirmed
```

`target_url_invalid` gehört zu einem typisierten Eingabevalidierungsfehler und trägt niemals einen normativen Evaluation-Status. `policy_condition_invalid` entfällt, weil Version 1 keinen separaten Cross-Field-Condition-Fehler neben Schema-Validierung und den vorhandenen spezifischen semantischen Diagnosen definiert.

## 10. Sicherheitsbetrachtungen

[SEC-001] Jede sicherheitsrelevante Mehrdeutigkeit in Parsing, Authority, Scope, Regeln, Bedingungen oder Extensions muss fail-closed behandelt werden.

Ein kompromittierter Host kann irreführende Daten veröffentlichen. Authority Evidence dokumentiert die Veröffentlichung über diesen Host; sie beweist kein Eigentum, keine Organisationskontrolle und keine rechtliche Permission. Riskante Entscheidungen sollten unabhängig bestätigt werden.

Policies und security.txt sind nicht vertrauenswürdige Eingaben. Netzwerkclients sollten HTTPS, Redirect- und Body-Limits, Timeouts, Medientypen, fehlendes Credential-Forwarding sowie standardmäßige Sperren für Loopback, Link-local, private, reservierte und Metadata-Adressen durchsetzen.

Rate und Parallelität beschreiben Publisher-Aussagen; dieses Projekt führt keine Scans aus. Parser sollten Größe, Verschachtelung und Ressourcenverbrauch begrenzen.

## 11. Datenschutzbetrachtungen

[PRIV-001] Implementierungen dürfen Policy-Text, security.txt-Text, Target-Details oder Researcher-Planwerte nicht übertragen, außer der Nutzer startet ausdrücklich einen erforderlichen Netzwerkvorgang.

Kontakt- und Researcher-Daten können personenbezogen sein. Oberflächen sollten Speicherung minimieren, Analytics und Tracking vermeiden und Netzwerkziele erklären. `requested_if_safe` rechtfertigt nie das Sammeln fremder Daten oder weitergehende Ausnutzung.

## 12. IANA-Erwägungen

Dieser Kandidat beantragt keine Registrierung. Ein späterer Internet-Draft kann die Registrierung des vorgeschlagenen security.txt-Feldes `CVD-Policy` und des Medientyps `application/cvd-policy+json` beantragen. Version 1 definiert keinen Well-Known-Policy-Pfad.
