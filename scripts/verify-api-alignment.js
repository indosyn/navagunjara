const fs = require("fs");

const src = fs.readFileSync("lib/openapi.ts", "utf8");
const specPaths = new Set();
const re = /registry\.registerPath\(\{[\s\S]*?method:\s*"(get|post|put|delete|patch)",[\s\S]*?path:\s*"([^"]+)"/g;
let m;
while ((m = re.exec(src))) {
  specPaths.add(m[1].toUpperCase() + " " + m[2]);
}

const col = JSON.parse(fs.readFileSync("collection/navagunjara.postman_collection.json", "utf8"));
const postPaths = new Set();
function walk(items) {
  for (const it of items) {
    if (it.item) walk(it.item);
    if (it.request) {
      const method = it.request.method;
      const raw = (it.request.url && it.request.url.raw) || "";
      let p = raw.replace("{{baseUrl}}", "").split("?")[0];
      p = p.replace(/\{\{(\w+)\}\}/g, "{$1}");
      postPaths.add(method + " " + p);
    }
  }
}
walk(col.item);

function norm(s) {
  const [method, ...rest] = s.split(" ");
  return method + " " + rest.join(" ").replace(/\{[^}]+\}/g, "{X}");
}

const sNorm = new Set([...specPaths].map(norm));
const pNorm = new Set([...postPaths].map(norm));

const onlySpec = [...sNorm].filter((x) => !pNorm.has(x)).sort();
const onlyPost = [...pNorm].filter((x) => !sNorm.has(x)).sort();

console.log("OpenAPI endpoints: " + sNorm.size);
console.log("Postman endpoints: " + pNorm.size);
console.log("\nOnly in OpenAPI:");
onlySpec.forEach((x) => console.log("  " + x));
console.log("\nOnly in Postman:");
onlyPost.forEach((x) => console.log("  " + x));

if (onlySpec.length === 0 && onlyPost.length === 0) {
  console.log("\n✓ PERFECTLY ALIGNED");
}
