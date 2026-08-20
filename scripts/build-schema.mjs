// Derives the 0.2 schema from the frozen 0.1 schema plus the delta below, so
// the two can never drift apart in the parts they share.
//
// 0.1 stays exactly as published. 0.2 adds one optional field.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const schemaDir = join(dirname(fileURLToPath(import.meta.url)), "..", "schema");
const base = JSON.parse(readFileSync(join(schemaDir, "cvd-policy-0.1.schema.json"), "utf8"));

const schema = structuredClone(base);

schema.$id = "https://cvd-policy.eu/schema/0.2/cvd-policy.schema.json";
schema.title = "CVD Policy Format 0.2";
schema.properties.cvd_policy = { const: "0.2" };

// The one addition: where a structured report may be submitted, and in what
// shape. A pointer, not a definition — the shape lives in a profile.
schema.properties.report_requirements.properties.intake = {
  type: "object",
  description:
    "Endpoint that accepts a structured report. Consumers must not submit without a person confirming it.",
  required: ["url"],
  properties: {
    url: { type: "string", format: "uri", pattern: "^https://" },
    schema: { type: "string", format: "uri", pattern: "^https://" },
    profile: { type: "string", minLength: 1 },
    anonymous: { type: "boolean" },
    max_bytes: { type: "integer", exclusiveMinimum: 0 },
    attachments: { enum: ["accepted", "after_contact", "not_accepted"] },
  },
  additionalProperties: true,
};

writeFileSync(
  join(schemaDir, "cvd-policy-0.2.schema.json"),
  JSON.stringify(schema, null, 2) + "\n",
);

console.log("schema/cvd-policy-0.2.schema.json written from 0.1 + delta");
