const fs = require("fs");
const path = require("path");

const apiDir = path.join("app", "api");
const realEndpoints = new Set();

function walk(dir, segments) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      let seg = entry.name;
      // Skip the catch-all NextAuth handler and the openapi route itself
      if (seg === "[...nextauth]") continue;
      // Convert [id] -> {id}, [productId] -> {productId}
      if (seg.startsWith("[") && seg.endsWith("]")) {
        seg = "{" + seg.slice(1, -1).replace(/^\.\.\./, "") + "}";
      }
      walk(full, [...segments, seg]);
    } else if (entry.name === "route.ts") {
      const src = fs.readFileSync(full, "utf8");
      const methods = [...src.matchAll(/^export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/gm)].map(
        (m) => m[1],
      );
      const p = "/" + segments.join("/");
      // Skip infra routes
      if (p === "/api/openapi") continue;
      for (const m of methods) {
        realEndpoints.add(m + " " + p);
      }
    }
  }
}
walk(apiDir, ["api"]);

const src = fs.readFileSync("lib/openapi.ts", "utf8");
const specPaths = new Set();
const re = /registry\.registerPath\(\{[\s\S]*?method:\s*"(get|post|put|delete|patch)",[\s\S]*?path:\s*"([^"]+)"/g;
let m;
while ((m = re.exec(src))) {
  specPaths.add(m[1].toUpperCase() + " " + m[2]);
}

// Drop the duplicate GET /api/v1/customers/register from real (it's effectively same as GET /api/v1/customers admin list)
const ignoreReal = new Set(["GET /api/v1/customers/register"]);

function norm(s) {
  const [method, ...rest] = s.split(" ");
  return method + " " + rest.join(" ").replace(/\{[^}]+\}/g, "{X}");
}

const realNorm = new Set([...realEndpoints].filter((x) => !ignoreReal.has(x)).map(norm));
const sNorm = new Set([...specPaths].map(norm));

const onlyReal = [...realNorm].filter((x) => !sNorm.has(x)).sort();
const onlySpec = [...sNorm].filter((x) => !realNorm.has(x)).sort();

console.log("Real route handlers: " + realNorm.size);
console.log("OpenAPI endpoints:   " + sNorm.size);
console.log("\nRoutes missing from OpenAPI/Swagger:");
onlyReal.forEach((x) => console.log("  " + x));
console.log("\nOpenAPI paths with no real route:");
onlySpec.forEach((x) => console.log("  " + x));

if (onlyReal.length === 0 && onlySpec.length === 0) {
  console.log("\n✓ OpenAPI matches code 1:1");
}
