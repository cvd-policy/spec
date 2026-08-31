const WS = new Set([" ", "\t", "\n", "\r"]);

export class DuplicateMemberError extends SyntaxError {
  constructor(path) {
    super(`duplicate member at ${path}`);
    this.path = path;
  }
}

/** Parses strict RFC 8259 JSON while rejecting duplicate object member names. */
export function parseJsonText(text) {
  let index = 0;
  const pointer = (parts) =>
    parts.length === 0
      ? ""
      : `/${parts.map((part) => String(part).replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}`;
  const fail = (message) => {
    throw new SyntaxError(`${message} at character ${index}`);
  };
  const whitespace = () => {
    while (index < text.length && WS.has(text[index])) index++;
  };
  const string = () => {
    const start = index;
    if (text[index++] !== '"') fail("expected string");
    while (index < text.length) {
      const char = text[index++];
      if (char === '"') {
        try {
          return JSON.parse(text.slice(start, index));
        } catch {
          fail("invalid string");
        }
      }
      if (char === "\\") {
        const escaped = text[index++];
        if (escaped === "u") {
          if (!/^[0-9A-Fa-f]{4}$/.test(text.slice(index, index + 4))) fail("invalid Unicode escape");
          index += 4;
        } else if (!'"\\/bfnrt'.includes(escaped ?? "")) {
          fail("invalid escape");
        }
      } else if (char === undefined || char.charCodeAt(0) < 0x20) {
        fail("invalid string character");
      }
    }
    fail("unterminated string");
  };
  const number = () => {
    const rest = text.slice(index);
    const match = rest.match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
    if (!match) fail("invalid number");
    index += match[0].length;
  };
  const value = (parts) => {
    whitespace();
    const char = text[index];
    if (char === "{") return object(parts);
    if (char === "[") return array(parts);
    if (char === '"') return string();
    if (char === "-" || /[0-9]/.test(char ?? "")) return number();
    for (const literal of ["true", "false", "null"]) {
      if (text.startsWith(literal, index)) {
        index += literal.length;
        return;
      }
    }
    fail("expected JSON value");
  };
  const object = (parts) => {
    index++;
    whitespace();
    const names = new Set();
    if (text[index] === "}") {
      index++;
      return;
    }
    while (true) {
      whitespace();
      if (text[index] !== '"') fail("expected object member name");
      const name = string();
      if (names.has(name)) throw new DuplicateMemberError(pointer([...parts, name]));
      names.add(name);
      whitespace();
      if (text[index++] !== ":") fail("expected colon");
      value([...parts, name]);
      whitespace();
      if (text[index] === "}") {
        index++;
        return;
      }
      if (text[index++] !== ",") fail("expected comma or closing brace");
    }
  };
  const array = (parts) => {
    index++;
    whitespace();
    if (text[index] === "]") {
      index++;
      return;
    }
    let item = 0;
    while (true) {
      value([...parts, item++]);
      whitespace();
      if (text[index] === "]") {
        index++;
        return;
      }
      if (text[index++] !== ",") fail("expected comma or closing bracket");
    }
  };

  value([]);
  whitespace();
  if (index !== text.length) fail("unexpected trailing data");
  try {
    return JSON.parse(text);
  } catch {
    fail("invalid JSON");
  }
}

const GRANDFATHERED = new Set([
  "art-lojban", "cel-gaulish", "en-gb-oed", "i-ami", "i-bnn", "i-default", "i-enochian",
  "i-hak", "i-klingon", "i-lux", "i-mingo", "i-navajo", "i-pwn", "i-tao", "i-tay", "i-tsu",
  "no-bok", "no-nyn", "sgn-be-fr", "sgn-be-nl", "sgn-ch-de", "zh-guoyu", "zh-hakka", "zh-min",
  "zh-min-nan", "zh-xiang",
]);

export function isLanguageTag(value) {
  if (GRANDFATHERED.has(value.toLowerCase())) return true;
  try {
    Intl.getCanonicalLocales(value);
    return true;
  } catch {
    return false;
  }
}

export function normalizeHost(value) {
  if (typeof value !== "string" || value === "" || /[*/?#@\s]/.test(value)) throw new TypeError("invalid host");
  try {
    const unbracketed = value.startsWith("[") && value.endsWith("]") ? value.slice(1, -1) : value;
    if (unbracketed.includes(":")) {
      const url = new URL(`http://[${unbracketed}]/`);
      return { host: url.hostname.slice(1, -1).toLowerCase(), ip: true };
    }
    const withoutDot = unbracketed.endsWith(".") ? unbracketed.slice(0, -1) : unbracketed;
    const url = new URL(`http://${withoutDot}/`);
    if (url.port || url.username || url.password || url.pathname !== "/") throw new TypeError("invalid host");
    const host = url.hostname.toLowerCase();
    return { host, ip: /^\d+(?:\.\d+){3}$/.test(host) };
  } catch (error) {
    throw new TypeError("invalid host", { cause: error });
  }
}

export function semanticIssues(doc, now = new Date("2026-08-29T10:00:00Z")) {
  const issues = [];
  const add = (code, path) => issues.push({ code, path });
  const updated = Date.parse(doc.last_updated);
  const expires = Date.parse(doc.expires);
  if (Number.isFinite(updated) && Number.isFinite(expires) && expires <= updated) add("policy_time_order_invalid", "/expires");
  if (Number.isFinite(expires) && expires <= now.getTime()) add("policy_expired", "/expires");

  const httpsUris = [[doc.organization?.uri, "/organization/uri"]];
  for (const [value, path] of httpsUris) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.username || url.password) add("policy_uri_invalid", path);
    } catch {
      add("policy_uri_invalid", path);
    }
  }
  for (const [index, channel] of (doc.contact?.channels ?? []).entries()) {
    try {
      const url = new URL(channel);
      if (url.protocol === "https:" && (url.username || url.password || url.hash)) {
        add("policy_uri_invalid", `/contact/channels/${index}`);
      }
    } catch {
      add("policy_uri_invalid", `/contact/channels/${index}`);
    }
  }
  for (const [index, language] of (doc.contact?.preferred_languages ?? []).entries()) {
    if (!isLanguageTag(language)) add("policy_language_tag_invalid", `/contact/preferred_languages/${index}`);
  }

  const ids = new Set();
  const webById = new Map();
  for (const [index, entry] of (doc.reporting_scope?.web ?? []).entries()) {
    if (ids.has(entry.id)) add("policy_scope_id_duplicate", `/reporting_scope/web/${index}/id`);
    ids.add(entry.id);
    webById.set(entry.id, entry);
    try {
      const normalized = normalizeHost(entry.host);
      if (normalized.ip && entry.include_subdomains) add("policy_scope_invalid", `/reporting_scope/web/${index}/include_subdomains`);
    } catch {
      add("policy_scope_invalid", `/reporting_scope/web/${index}/host`);
    }
  }
  for (const [index, entry] of (doc.reporting_scope?.products ?? []).entries()) {
    if (ids.has(entry.id)) add("policy_scope_id_duplicate", `/reporting_scope/products/${index}/id`);
    ids.add(entry.id);
  }
  for (const [index, rule] of (doc.testing?.rules ?? []).entries()) {
    if (ids.has(rule.id)) add("policy_scope_id_duplicate", `/testing/rules/${index}/id`);
    ids.add(rule.id);
    for (const [targetIndex, target] of (rule.target_ids ?? []).entries()) {
      if (webById.get(target)?.state !== "in") add("policy_target_reference_invalid", `/testing/rules/${index}/target_ids/${targetIndex}`);
    }
    if ((doc.research?.posture === "report_only" || doc.research?.posture === "prohibited") && rule.state === "permitted") {
      add("policy_posture_conflict", `/testing/rules/${index}/state`);
    }
  }
  for (const [index, extension] of (doc.critical_extensions ?? []).entries()) {
    if (!Object.hasOwn(doc.extensions ?? {}, extension)) add("policy_critical_extension_missing", `/critical_extensions/${index}`);
  }
  return issues;
}

export function applyPointerValues(input, values) {
  const result = structuredClone(input);
  for (const [pointer, value] of Object.entries(values ?? {})) {
    const parts = pointer.slice(1).split("/").map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
    let target = result;
    for (const part of parts.slice(0, -1)) target = target[part];
    target[parts.at(-1)] = value;
  }
  return result;
}
