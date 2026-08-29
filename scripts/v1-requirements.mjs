import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const add = (mapping, requirement, test) => {
  mapping[requirement] ??= [];
  mapping[requirement].push(test);
};

export function expectedRequirements() {
  const mapping = {};
  for (const [file, meta] of Object.entries(read("tests/v1/valid-expected.json"))) {
    for (const requirement of meta.requirements) add(mapping, requirement, `policy-valid:${file}`);
  }
  for (const [file, meta] of Object.entries(read("tests/v1/expected.json"))) {
    for (const requirement of meta.requirements) add(mapping, requirement, `policy-invalid:${file}`);
  }
  for (const [file, meta] of Object.entries(read("tests/v1/raw-expected.json"))) {
    for (const requirement of meta.requirements) add(mapping, requirement, `policy-raw:${file}`);
  }
  for (const [path, prefix] of [["tests/v1/security-txt/cases.json", "security-txt"], ["tests/v1/evaluation/cases.json", "evaluation"], ["tests/v1/assertions.json", "assertion"]]) {
    for (const entry of read(path)) {
      for (const requirement of entry.requirements) add(mapping, requirement, `${prefix}:${entry.id}`);
    }
  }
  return Object.fromEntries(Object.entries(mapping).sort().map(([id, tests]) => [id, [...new Set(tests)].sort()]));
}

export function specificationRequirements() {
  return [...new Set([...readFileSync(join(root, "v1", "SPEC.md"), "utf8").matchAll(/\[([A-Z]+-[0-9]{3})\]/g)].map((match) => match[1]))].sort();
}

export function writeRequirements() {
  const target = join(root, "v1", "requirements.json");
  const content = `${JSON.stringify(expectedRequirements(), null, 2)}\n`;
  if (!existsSync(target) || readFileSync(target, "utf8") !== content) writeFileSync(target, content);
}
