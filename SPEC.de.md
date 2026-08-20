# CVD Policy Format

**Status:** Entwurf
**Version:** 0.2
**Datum:** 2026-08-21
**Lizenz:** CC0-1.0
**Kanonische Fassung:** https://cvd-policy.eu/spec
**Übersetzungen:** [English (maßgeblich)](SPEC.md)

> Maßgeblich ist die englische Fassung. Diese Übersetzung dient dem Verständnis.

---

## 1 Einleitung und Abgrenzung

Wer Meldungen über Sicherheitslücken entgegennimmt, kann seine Bedingungen
heute nicht maschinenlesbar ausdrücken. Die `security.txt` (RFC 9116) nennt einen
Kontakt und verweist im Feld `Policy:` auf eine beliebige HTML-Seite. Was dort
steht, kann ein Werkzeug nicht auswerten.

Das CVD Policy Format schließt genau diese Lücke: ein JSON-Dokument, das
beschreibt, *ob* Sicherheitsforschung erwünscht ist, *woran*, *unter welchen
Bedingungen*, *wie gemeldet wird* und *wie offengelegt wird*.

**Was dieses Format nicht ist:**

- Kein Ersatz für die `security.txt`. Das Format ergänzt sie um ein Feld.
- Kein Nachweis regulatorischer Konformität, auch nicht für den Cyber Resilience
  Act. Ein Profil kann Felder ergänzen, die eine Prüfung erleichtern — die
  Prüfung selbst leistet dieses Format nicht.
- Keine Rechtsgrundlage. Siehe Abschnitt 8.
- Keine Bewertung. Das Format kennt keinen Reifegrad und keine Punktzahl.

Ein Dokument nach diesem Format wird im Folgenden **Policy-Dokument** genannt.
Wer es veröffentlicht, ist die **veröffentlichende Organisation**. Wer es
ausliest und auswertet, ist ein **Konsument**.

---

## 2 Terminologie

Die Schlüsselwörter MUSS, MÜSSEN, DARF NICHT, DÜRFEN NICHT, SOLLTE, SOLLTEN,
KANN und KÖNNEN sind gemäß RFC 2119 und RFC 8174 zu interpretieren, wenn und nur
wenn sie in Großbuchstaben erscheinen.

| Begriff       | Bedeutung                                                             |
| ------------- | --------------------------------------------------------------------- |
| Aktivität     | Eine Klasse von Prüfhandlungen, z. B. automatisiertes Scannen         |
| Geltungsbereich | Menge der Systeme und Produkte, auf die sich die Erklärung bezieht   |
| Grundhaltung  | Der Wert von `research.posture`                                        |
| Profil        | Benannte Erweiterung mit zusätzlichen Feldern und Pflichten            |

---

## 3 Discovery

### 3.1 security.txt-Feld `CVD-Policy`

Eine Organisation, die eine `security.txt` gemäß RFC 9116 veröffentlicht, SOLLTE
darin das Feld `CVD-Policy` führen. Der Wert ist eine absolute `https`-URI, die
auf ein Policy-Dokument verweist.

```text
Contact: mailto:security@example.com
Policy: https://example.com/security-policy
CVD-Policy: https://example.com/.well-known/cvd.json
Expires: 2027-06-30T23:59:59Z
```

Das Feld KANN mehrfach vorkommen. Konsumenten MÜSSEN in diesem Fall das erste
Vorkommen bevorzugen und dürfen weitere ignorieren.

Das Feld ist zum Zeitpunkt dieser Fassung nicht bei der IANA registriert. RFC
9116 erlaubt unbekannte Felder ausdrücklich; Parser, die sich an den Standard
halten, ignorieren es folgenlos.

### 3.2 Well-Known-Pfad als Fallback

Findet ein Konsument kein `CVD-Policy`-Feld, so KANN er

```text
https://<host>/.well-known/cvd.json
```

abrufen. Veröffentlichende Organisationen SOLLTEN ihr Dokument unter diesem Pfad
ablegen, auch wenn sie das security.txt-Feld führen.

Die Auslieferung SOLLTE mit dem Media-Type `application/json` erfolgen. Der
Media-Type `application/cvd-policy+json` ist vorgesehen, aber nicht registriert;
Konsumenten DÜRFEN NICHT allein anhand des Media-Type ablehnen.

### 3.3 Reihenfolge

Ein Konsument, der beide Wege prüft, MUSS `CVD-Policy` aus der `security.txt`
Vorrang vor dem Well-Known-Pfad geben. Weichen beide Dokumente ab, gilt das über
`CVD-Policy` referenzierte.

---

## 4 Dokumentaufbau

Ein Policy-Dokument ist ein JSON-Objekt (RFC 8259). Textwerte sind UTF-8.

### 4.1 Pflichtfelder

```text
cvd_policy          Versionskennung
canonical           Selbstreferenz auf den vorgesehenen Abrufort
expires             Ablaufzeitpunkt
organization        Veröffentlichende Organisation
contact             Meldeweg
research            Grundhaltung
scope               Geltungsbereich
report_requirements Anforderungen an eine Meldung
```

Alle übrigen Felder sind optional.

### 4.2 `cvd_policy`, `canonical`, `expires`, `updated`

| Feld         | Typ                | Pflicht | Bedeutung                                     |
| ------------ | ------------------ | ------- | --------------------------------------------- |
| `cvd_policy` | `"0.1"`            | ja      | Version dieses Formats                        |
| `canonical`  | URI, `https://`    | ja      | Ort, an dem das Dokument gelten soll          |
| `expires`    | date-time (RFC 3339) | ja    | Zeitpunkt, ab dem das Dokument ungültig ist   |
| `updated`    | date (RFC 3339)    | nein    | Tag der letzten inhaltlichen Änderung         |

`expires` MUSS in der Zukunft liegen. Ein Zeitraum von höchstens zwölf Monaten
wird empfohlen: Ein Dokument, das einmal im Jahr geprüft wird, veraltet seltener,
ohne dass es jemandem auffällt.

Anhand von `canonical` erkennt ein Konsument, ob ein Dokument von einem anderen
Ort kopiert wurde. Weicht der Abrufort ab, SOLLTE er warnen, DARF das Dokument
aber NICHT allein deswegen verwerfen.

### 4.3 `organization`

```json
{
  "name": "Beispiel Steuerungstechnik GmbH",
  "country": "DE",
  "role": "manufacturer",
  "url": "https://example.de"
}
```

`name` ist Pflicht. `country` ist ein zweistelliger Ländercode nach ISO 3166-1
alpha-2. `role` ist einer von `manufacturer`, `operator`, `both`, `other`.

### 4.4 `contact`

```json
{
  "channels": [
    { "type": "email", "value": "security@example.de", "preferred": true },
    { "type": "form", "value": "https://example.de/security/report" }
  ],
  "languages": ["de", "en"],
  "encryption": [
    { "type": "pgp", "value": "https://example.de/pgp-key.txt", "fingerprint": "AAAA BBBB …" }
  ],
  "response_target": { "acknowledge_within_hours": 48, "update_interval_days": 14 }
}
```

`channels` MUSS mindestens einen Eintrag enthalten. `type` ist einer von
`email`, `form`, `service`, `postal`. Hinter `service` steht ein beliebiger Dienst
eines Dritten; dessen URL trägt die veröffentlichende Organisation selbst ein.
Dieses Format kennt und bevorzugt keinen Anbieter.

Ist `preferred` bei keinem Kanal gesetzt, gilt der erste Eintrag als bevorzugt.

`response_target` ist eine Selbstverpflichtung ohne Rechtswirkung. Trotzdem ist
es die Angabe, nach der Meldende am häufigsten suchen.

### 4.5 `research`

```json
{ "posture": "report_only", "statement": "Unsere Anlagen laufen …" }
```

`posture` MUSS einer der folgenden Werte sein:

| Wert          | Bedeutung                                                                    |
| ------------- | ---------------------------------------------------------------------------- |
| `open`        | Tests an den genannten Systemen sind erwünscht, im Rahmen von `testing`      |
| `limited`     | Tests sind nur im ausdrücklich beschriebenen Rahmen erlaubt                  |
| `report_only` | Keine Testeinladung. Meldungen werden entgegengenommen und bearbeitet        |
| `prohibited`  | Tests sind ausgeschlossen; Meldungen laufen über einen anderen Weg oder sind nicht vorgesehen |

`report_only` ist ausdrücklich keine schwächere Aussage als `open`. Für die
meisten Organisationen ist es schlicht die zutreffende.

Bei `posture` gleich `open` oder `limited` MUSS `testing` vorhanden sein.
Bei `posture` gleich `report_only` oder `prohibited` DARF `testing.rules` NICHT
befüllt sein; ein leeres Array oder ein fehlendes Feld ist zulässig.

`statement` ist Fließtext, höchstens 1000 Zeichen, für Menschen bestimmt.

### 4.6 `scope`

```json
{
  "precedence": "out_overrides_in",
  "web": [
    { "pattern": "*.example.de", "state": "in" },
    { "pattern": "shop.example.de", "state": "out", "reason": "third_party" }
  ],
  "products": [
    {
      "name": "SC-4000 Controller",
      "purl": "pkg:generic/example/sc4000",
      "versions": ">=2.0.0",
      "supported_until": "2030-12-31",
      "sbom": "https://example.de/sbom/sc4000.json"
    }
  ]
}
```

`precedence` ist Pflicht und MUSS `out_overrides_in` oder `explicit_order` sein.

- `out_overrides_in`: Trifft auf ein Ziel mindestens ein Eintrag mit
  `state: "out"` zu, ist das Ziel außerhalb des Geltungsbereichs — unabhängig
  von der Reihenfolge.
- `explicit_order`: Der letzte zutreffende Eintrag in Dokumentreihenfolge
  gewinnt.

`pattern` ist ein Hostname, optional mit führendem `*.`. Der Platzhalter deckt
die Domain selbst und jeden Host darunter ab: `*.example.com` trifft auf
`example.com`, `api.example.com` und `a.b.example.com` zu, nicht aber auf
`evil-example.com`. Verglichen wird ohne Beachtung der Groß- und Kleinschreibung;
ein abschließender Punkt, ein Port und Benutzerangaben bleiben unberücksichtigt.

Ein Pfadanteil ist erlaubt und trifft auf ganze Segmente zu: `example.com/api`
deckt `/api` und `/api/v1` ab, nicht `/api2`. Reguläre Ausdrücke sind NICHT
vorgesehen.

Ein Ziel, auf das kein Eintrag zutrifft, ist **außerhalb** des
Geltungsbereichs. Es gibt kein implizites `in`.

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
        "targets": ["staging.example.de"]
      }
    },
    { "activity": "dos", "state": "prohibited" }
  ]
}
```

`default` MUSS gesetzt sein und gilt für jede Aktivität, für die keine Regel
zutrifft. `prohibited` wird empfohlen.

`activity` ist eine Zeichenkette. Die folgenden Bezeichner sind vorgesehen:

```text
manual_testing        automated_scanning     fuzzing
brute_force           dos                    social_engineering
phishing              physical               spam
data_exfiltration     account_takeover       third_party_pivot
supply_chain          persistence
```

Andere Bezeichner sind erlaubt. Zur Auswertung siehe Abschnitt 5.

`conditions` sind normativ. Sie sind keine Empfehlung und keine
Hintergrundinformation.

Eine Aktivität SOLLTE höchstens einmal vorkommen. Kommt sie mehrfach vor, gewinnt
der erste Eintrag (Abschnitt 5.1) — ein späteres, weniger strenges Duplikat
bleibt wirkungslos. Veröffentlichende Organisationen SOLLTEN sich darauf nicht
verlassen, sondern die Regeln selbst zusammenführen, damit niemand die Absicht
missversteht.

### 4.8 `report_requirements`

```json
{
  "required_fields": ["affected_asset", "description", "reproduction_steps", "impact"],
  "proof_of_exploitation": "prohibited",
  "formats": ["text", "markdown"],
  "max_attachment_mb": 20
}
```

`required_fields` ist Pflicht und KANN leer sein. `proof_of_exploitation` mit dem
Wert `prohibited` bedeutet, dass ein Beleg über den Nachweis der Erreichbarkeit
hinaus (etwa ausgeleitete Daten) unerwünscht ist.

#### `intake` (ab 0.2)

Wer strukturierte Meldungen entgegennehmen kann, trägt das hier ein. Alle
Angaben in `intake` sind freiwillig; ein Dokument ohne diesen Block ist
vollständig.

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

| Feld | Bedeutung |
| ---- | --------- |
| `url` | Endpunkt, der Meldungen annimmt. Innerhalb von `intake` Pflicht, nur `https` |
| `schema` | JSON Schema, das der Endpunkt akzeptiert, nur `https` |
| `profile` | Benanntes Meldeprofil als Grundlage, etwa `report-0.1` |
| `anonymous` | Ob eine Meldung ohne Angaben zur Person angenommen wird |
| `max_bytes` | Größte akzeptierte Übermittlung |
| `attachments` | `accepted`, `after_contact` oder `not_accepted` |

`url` und `schema` MÜSSEN absolute `https`-URIs ohne Benutzerangaben sein. Das
Dokument DARF keinerlei Zugangsdaten enthalten: Ein Endpunkt, der ein Geheimnis
braucht, gehört nicht in eine öffentliche Datei.

Der Endpunkt DARF auf einer fremden Domain liegen. Darüber entscheidet, wer das
Dokument veröffentlicht — genau wie beim Kontaktkanal `service`. Für eine Organisation, deren Meldestelle ein Dienstleister betreibt,
ist es der Normalfall.

`intake` beschreibt einen zusätzlichen, maschinenlesbaren Weg. Er ersetzt
`contact` nicht: Ein Mensch MUSS weiterhin über einen dort genannten Kanal melden
können.

##### Regeln für Konsumenten

```text
- Konsumenten DÜRFEN eine Meldung NICHT absenden, ohne dass ein Mensch das
  bestätigt.
- Konsumenten MÜSSEN den empfangenden Host anzeigen, bevor etwas gesendet wird.
- Konsumenten DÜRFEN Dateien und Exploit-Material NICHT automatisch anhängen.
- Schlägt die Übermittlung fehl, MÜSSEN Konsumenten das als gescheiterte Meldung
  behandeln und auf einen Kanal aus "contact" zurückfallen.
```

Die erste Regel ist die entscheidende. In einer Meldung stehen die Einzelheiten
einer offenen Schwachstelle. Wohin sie gehen, entscheidet ein Mensch — das ist
kein Schritt, den ein Werkzeug stellvertretend erledigt.

### 4.9 `disclosure`

```json
{
  "model": "coordinated",
  "deadline_days": 90,
  "advisory_url": "https://example.de/security/advisories",
  "credit": "offered"
}
```

`model` ist einer von `coordinated`, `full_after_deadline`, `vendor_only`,
`no_disclosure`. `deadline_days` ist die Regelfrist in Tagen; sie ist eine
Erwartung, keine Zusicherung.

---

## 5 Semantik für Konsumenten (normativ)

Die folgenden sechs Sätze sind die Kernaussagen dieser Spezifikation.

```text
- Konsumenten MÜSSEN unbekannte Felder ignorieren, nicht das Dokument verwerfen.
- Konsumenten MÜSSEN unbekannte Werte von "activity" als "prohibited" behandeln.
- Konsumenten MÜSSEN ein Dokument mit abgelaufenem "expires" wie nicht vorhanden
  behandeln.
- "out" hat Vorrang vor "in", sofern "precedence" nichts anderes festlegt.
- Bedingungen in "conditions" sind normativ und MÜSSEN von automatisierten
  Werkzeugen durchgesetzt werden, nicht nur angezeigt.
- Dieses Dokument erzeugt keinen Rechtsschutz. Es dokumentiert eine Erklärung
  der veröffentlichenden Organisation.
```

### 5.1 Auswertungsreihenfolge

Ein Konsument, der entscheiden will, ob eine Aktivität A gegen ein Ziel T
zulässig ist, MUSS in dieser Reihenfolge vorgehen:

1. Ist `expires` überschritten, gilt das Dokument als nicht vorhanden. Ende.
2. Ist `cvd_policy` unbekannt, MUSS der Konsument abbrechen und DARF NICHT raten.
3. Ist `research.posture` gleich `prohibited` oder `report_only`, ist A
   unzulässig. Ende.
4. Hat das Dokument keine Autorität über T (Abschnitt 5.2), DARF es NICHT als
   Erlaubnis für T behandelt werden. Ende.
5. Liegt T nach den Regeln aus Abschnitt 4.6 außerhalb des Geltungsbereichs, ist
   A unzulässig. Ende.
6. Trifft eine Regel in `testing.rules` auf A zu, gilt deren `state`. Trifft
   keine zu, gilt `testing.default`. Nennen mehrere Regeln dieselbe Aktivität,
   gilt die **erste** in Dokumentreihenfolge; die übrigen MÜSSEN Konsumenten
   ignorieren.
7. Ist das Ergebnis `allowed` und sind `conditions` vorhanden, ist A nur
   zulässig, solange sämtliche Bedingungen eingehalten werden.

Trifft keine Regel zu und kennt der Konsument die Aktivität nicht, MUSS Schritt 6
das Ergebnis `prohibited` liefern, auch wenn `testing.default` gleich `allowed`
ist. Eine Regel, die diese Aktivität ausdrücklich nennt, ist eine Entscheidung
der veröffentlichenden Organisation und gilt wie geschrieben — das Rateverbot
betrifft den Standardpfad, nicht die ausdrückliche Aussage.

### 5.2 Autorität

Ein Dokument hat Autorität über einen Host H, wenn eines von beidem gilt:

- H ist der Host aus `canonical` oder liegt darunter. Ein Dokument unter
  `https://example.com/.well-known/cvd.json` deckt `example.com` und
  `api.example.com` ab; eines unter `https://blog.example.com/...` nur
  `blog.example.com` und Hosts darunter.
- H hat selbst auf dieses Dokument verwiesen — über das Feld `CVD-Policy` in der
  eigenen `security.txt` von H oder dadurch, dass H es unter seinem eigenen Pfad
  `/.well-known/cvd.json` ausliefert. Das kann nur einrichten, wer H betreibt;
  genau deshalb ist es eine Delegation.

Adressen haben keine Hierarchie: Eine IPv4- oder IPv6-Adresse deckt sich selbst
ab und sonst nichts.

Konsumenten MÜSSEN festhalten, über welchen Host sie ein Dokument gefunden haben,
und die zweite Regel NUR auf diesen Host anwenden. Ein Dokument, das beim
Nachschlagen eines Hosts gefunden wurde, sagt nichts über einen anderen. Fehlt diese
Angabe, gilt allein die erste Regel.

Das begrenzt eine Übernahme: Eine auf einer verwaisten Subdomain platzierte
Policy deckt diese Subdomain ab, nicht die Organisation. Zugleich bleiben beide
berechtigten Fälle möglich: ein zentral abgelegtes Dokument, auf das jede
`security.txt` verweist, und die Ablage durch einen Dienstleister.

### 5.3 Versionen

`cvd_policy` nennt die Version, für die ein Dokument geschrieben wurde. Wer diese
Version umsetzt, MUSS auch `0.1`-Dokumente annehmen und nach den Regeln von 0.1
auswerten. Diese unterscheiden sich allein darin, dass es dort
`report_requirements.intake` nicht gibt.

Eine veröffentlichte Version ändert sich nie. `0.1`-Dokumente bleiben gültig und
lesbar; aus 0.2 folgt für niemanden die Pflicht, ein Dokument neu auszustellen.

Da unbekannte Felder ignoriert werden (Abschnitt 5), KANN ein 0.1-Dokument
bereits einen `intake`-Block enthalten. Wer nur 0.1 kennt, überspringt ihn; wer
0.2 kennt, DARF ihn nutzen. Veröffentlichende Organisationen SOLLTEN
`cvd_policy` auf `0.2` setzen, sobald sie sich darauf verlassen.

### 5.4 Fehlertoleranz

Ein Dokument, das gegen das Schema verstößt, SOLLTE als nicht vorhanden
behandelt werden. Ein Konsument DARF Teile eines fehlerhaften Dokuments für die
Anzeige gegenüber Menschen verwenden, MUSS dabei aber kenntlich machen, dass das
Dokument ungültig ist, und DARF daraus keine Erlaubnis ableiten.

---

## 6 Integrität und Signatur

Version 0.1 definiert kein Signaturverfahren. Die Integrität beruht auf TLS und
auf der Kontrolle über den Ort, an dem das Dokument liegt.

Ein späteres Verfahren SOLLTE als abtrennbare Signatur neben dem Dokument liegen
(`cvd.json.sig`), damit das Dokument selbst reines JSON bleibt. Konsumenten von
0.1 ignorieren ein unbekanntes Feld `signature` folgenlos — Abschnitt 5.

---

## 7 Erweiterungen und Profile

Das Schema setzt `additionalProperties: true` auf oberster Ebene. Erweiterungen
sind ausdrücklich erwünscht.

Ein **Profil** ist ein benanntes JSON Schema, das zusätzliche Felder definiert
und bestehende verschärft, aber nie lockert. Ein Dokument nennt die von ihm
erfüllten Profile:

```json
{ "profiles": ["cra-0.1"] }
```

Ein Konsument, der ein Profil nicht kennt, MUSS das Dokument weiterhin nach
dieser Spezifikation auswerten. Ein Profil DARF NICHT die Bedeutung eines in
dieser Spezifikation definierten Feldes ändern.

Herstellerspezifische Felder SOLLTEN mit `x_` beginnen.

### 7.1 Veröffentlichte Profile

| Profil | Zweck | Ort |
| ------ | ----- | --- |
| `report-0.1` | Aufbau einer eingehenden Meldung | `schema/profiles/report-0.1.schema.json` |

`report-0.1` beschreibt den Inhalt einer Meldung, nicht den einer Policy. Ein
Dokument verweist über `report_requirements.intake.profile` darauf;
der dort genannte Endpunkt nimmt Meldungen nach diesem Profil an.

Pflicht sind drei Felder: Titel, betroffenes Ziel und Beschreibung. Alles andere
ist freiwillig, auch Reproduktion und Auswirkung — beides liegt nicht immer vor,
und ein fehlendes Feld darf niemanden davon abhalten, überhaupt zu melden. Darin folgt das
Profil der ISO/IEC 29147 sowie den Empfehlungen von CISA, CERT/CC und FIRST.

Zwei Festlegungen im Profil sind bewusst so gewählt:

- **Ausnutzung kennt drei Zustände**: `yes`, `no` und `unknown`. Ein nicht
  gesetztes Häkchen ist keine Verneinung; wer es als solche speichert, erzeugt
  falsche Sicherheit. Bei `yes` ist ein Beleg Pflicht, und er bleibt eine Angabe
  der meldenden Person, keine bestätigte Feststellung.
- **Einwilligung besteht aus drei getrennten Entscheidungen**: Kontaktdaten
  angeben, deren Weitergabe an die betroffene Organisation erlauben, öffentlich
  genannt werden. Keine folgt aus einer anderen, keine ist vorbelegt. Eine
  Meldung ohne all das MUSS angenommen werden.

---

## 8 Sicherheitsbetrachtungen

**Kein Rechtsschutz.** Ein Policy-Dokument ist eine einseitige Erklärung. Es
begründet keinen Vertrag, keine Einwilligung im Sinne des Strafrechts und keinen
Haftungsausschluss. Wer sich darauf verlässt, handelt auf eigenes Risiko. Das
gilt in beide Richtungen: Auch die veröffentlichende Organisation erwirbt daraus
keinen Anspruch.

**Falsche Autorität.** Wer die Kontrolle über einen Webserver erlangt, kann dort
eine Policy veröffentlichen, die zu Tests einlädt. Konsumenten SOLLTEN ein Dokument
nicht als alleinige Grundlage für eingriffsintensive Handlungen verwenden.

**Aussagen über fremde Systeme.** Nichts hindert eine veröffentlichende
Organisation daran, in `scope` oder in `conditions.targets` einen Host zu nennen,
den sie gar nicht betreibt. Ein solcher Eintrag ist
eine Behauptung, nie eine Erlaubnis. Konsumenten MÜSSEN Abschnitt 5.2 anwenden
und DÜRFEN keine Erlaubnis für einen Host ableiten, über den das Dokument keine
Autorität hat. Eine Organisation mit mehreren Domains und ein Dienstleister, der
für einen Kunden handelt, sind über die Delegationsregel abgedeckt: Jeder Host
verweist auf das Dokument, an dem er gemessen werden will.

**Informationspreisgabe.** Wer einen Ausschluss mit dem Grund `legacy` versieht,
benennt damit ein schwaches System. Das ist eine bewusste Abwägung der
veröffentlichenden Organisation; das Feld `reason` ist deshalb optional.

**Verarbeitung durch Konsumenten.** Ein Policy-Dokument stammt von einem
fremden Server. Konsumenten MÜSSEN Größenbegrenzungen, Timeouts und
Redirect-Limits durchsetzen und DÜRFEN NICHT auf private, Loopback-,
Link-Local- oder Metadata-Adressen zugreifen.

---

## 9 IANA-Erwägungen

Diese Fassung beantragt nichts. Vorgesehen sind:

- Registrierung des `security.txt`-Feldes `CVD-Policy` im Well-Known-Feldregister
  zu RFC 9116
- Registrierung des Media-Type `application/cvd-policy+json`

Ein Antrag ist erst sinnvoll, wenn reale Nutzung nachweisbar ist.

---

## 10 Beispiele

Vollständige Dokumente liegen unter `examples/`:

| Datei                                  | Inhalt                                        |
| -------------------------------------- | --------------------------------------------- |
| `01-manufacturer-report-only.json`     | Maschinenbauer, keine Testeinladung           |
| `02-saas-limited.json`                 | SaaS-Anbieter, Tests nur gegen Staging        |
| `03-open-research.json`                | Offene Einladung mit Ratenbegrenzung          |
| `04-prohibited.json`                   | Tests ausgeschlossen                          |
| `05-full-cra-profile.json`             | Alle Felder, Profil `cra-0.1`                 |
| `06-machine-readable-intake.json`      | 0.2, Meldestelle bei einem Dienstleister      |

Meldungen nach dem Profil `report-0.1` liegen unter `examples/reports/`.

Minimalbeispiel:

```json
{
  "cvd_policy": "0.1",
  "canonical": "https://example.de/.well-known/cvd.json",
  "expires": "2027-08-18T00:00:00Z",
  "organization": { "name": "Beispiel GmbH" },
  "contact": { "channels": [{ "type": "email", "value": "security@example.de" }] },
  "research": { "posture": "report_only" },
  "scope": { "precedence": "out_overrides_in", "web": [{ "pattern": "example.de", "state": "in" }] },
  "report_requirements": { "required_fields": ["affected_asset", "description"] }
}
```
