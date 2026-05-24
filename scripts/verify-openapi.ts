import { openApiSpec } from "../lib/openapi";

const spec = openApiSpec as Record<string, unknown>;
const paths = spec.paths as Record<string, unknown> | undefined;
console.log("paths count:", paths ? Object.keys(paths).length : 0);
console.log("mode:", spec["x-generation-error"] ? "STUB" : "real");
if (spec["x-generation-error"]) {
  console.log("genError:", spec["x-generation-error"]);
}
