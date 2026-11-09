import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const fullUri = addFormats.get("uri", "full");
const pchar = String.raw`(?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2}|[!$&'()*+,;=:@])`;
const emptyPathAbsoluteUri = new RegExp(`^[A-Za-z][A-Za-z0-9+.-]*:(?:\\?(?:${pchar}|[/?])*)?$`);
const unreservedOrEscaped = String.raw`(?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2})`;
const subDelims = String.raw`[!$&'()*+,;=]`;
const regName = new RegExp(`^(?:${unreservedOrEscaped}|${subDelims})*$`);
const userInfo = new RegExp(`^(?:${unreservedOrEscaped}|${subDelims}|:)*$`);

function isValidAuthority(authority) {
  const at = authority.indexOf("@");
  if (at >= 0 && (authority.indexOf("@", at + 1) >= 0 || !userInfo.test(authority.slice(0, at)))) return false;

  const hostPort = authority.slice(at + 1);
  if (hostPort.startsWith("[")) {
    const close = hostPort.indexOf("]");
    if (close < 0 || hostPort.indexOf("[", 1) >= 0 || hostPort.indexOf("]", close + 1) >= 0) return false;
    const port = hostPort.slice(close + 1);
    return port === "" || /^:[0-9]*$/.test(port);
  }

  if (/[\[\]]/.test(hostPort)) return false;
  const colon = hostPort.indexOf(":");
  if (colon >= 0 && hostPort.indexOf(":", colon + 1) >= 0) return false;
  const host = colon < 0 ? hostPort : hostPort.slice(0, colon);
  const port = colon < 0 ? "" : hostPort.slice(colon);
  return regName.test(host) && (port === "" || /^:[0-9]*$/.test(port));
}

export function isCsafAbsoluteUri(value) {
  if (typeof value !== "string" || value.includes("#")) return false;
  const hierarchy = value.slice(value.indexOf(":") + 1);
  if (/[\[\]]/.test(hierarchy) && !hierarchy.startsWith("//")) return false;
  if (hierarchy.startsWith("//")) {
    const authorityAndPath = hierarchy.slice(2);
    const authorityEnd = authorityAndPath.search(/[/?]/);
    const authority = authorityEnd < 0 ? authorityAndPath : authorityAndPath.slice(0, authorityEnd);
    const remainder = authorityEnd < 0 ? "" : authorityAndPath.slice(authorityEnd);
    if (!isValidAuthority(authority) || /[\[\]]/.test(remainder)) return false;
  }
  return fullUri(value) || emptyPathAbsoluteUri.test(value);
}

export function createCsafExtensionValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
  addFormats(ajv);
  ajv.addFormat("uri", { type: "string", validate: isCsafAbsoluteUri });
  return ajv.compile(schema);
}

export function assessCsafDeclaration(policy, validateExtension, contract) {
  const id = contract.extension_identifier;
  if (!Object.hasOwn(policy.extensions ?? {}, id)) {
    return { status: "not-advertised", channels: [] };
  }

  const declaration = policy.extensions[id];
  if (!validateExtension(declaration)) return { status: "invalid", channels: [] };

  const declared = new Set();
  for (const { uri } of declaration.channels) {
    if (declared.has(uri) || !policy.contact.channels.includes(uri)) {
      return { status: "invalid", channels: [] };
    }
    declared.add(uri);
  }

  if (
    policy.critical_extensions?.includes(id) ||
    declaration.channels.some(({ specification }) => specification !== contract.supported_specification)
  ) {
    return { status: "unsupported", channels: [] };
  }

  return {
    status: "advertised",
    channels: policy.contact.channels.filter((uri) => declared.has(uri)),
  };
}
