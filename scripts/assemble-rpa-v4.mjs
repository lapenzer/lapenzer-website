import fs from "node:fs/promises";
import path from "node:path";

async function assemble(partsDir, destination) {
  const names = (await fs.readdir(partsDir)).filter((name) => name.startsWith("part")).sort();
  if (!names.length) throw new Error(`No RPA source fragments found in ${partsDir}`);
  const chunks = await Promise.all(names.map((name) => fs.readFile(path.join(partsDir, name), "utf8")));
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, chunks.join(""));
  return { destination, parts: names.length, bytes: chunks.reduce((sum, chunk) => sum + Buffer.byteLength(chunk), 0) };
}

const results = [];
results.push(await assemble("src/rpa-v4/framework", "lib/rpaFrameworkV4.ts"));
results.push(await assemble("src/rpa-v4/lab", "components/RPALabV4.tsx"));
results.push(await assemble("src/rpa-v4/css", "components/RPALabV4.module.css"));
console.log("Assembled RPA v4 sources", results);
