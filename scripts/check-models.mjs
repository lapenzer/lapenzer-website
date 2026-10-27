import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import ts from "typescript";

const temporary = mkdtempSync(join(tmpdir(), "lapenzer-model-check-"));
try {
  const require = createRequire(import.meta.url);
  mkdirSync(join(temporary, "fixtures"));
  const fixture = JSON.parse(readFileSync("lib/fixtures/network.json", "utf8"));
  writeFileSync(join(temporary, "fixtures/network.json"), JSON.stringify(fixture));
  for (const name of ["route", "influence", "conflict"]) {
    const source = readFileSync(`lib/${name}.ts`, "utf8");
    writeFileSync(join(temporary, `${name}.cjs`), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText);
  }
  const { predictRoutes, examplePredictions, nodeNames, terminalOutput } = require(join(temporary, "route.cjs"));
  const { influenceExample } = require(join(temporary, "influence.cjs"));
  const { conditionalProbability, evolveStrength, scenario, baseMatrix } = require(join(temporary, "conflict.cjs"));
  const close = (a, b, epsilon = 1e-11) => assert.ok(Math.abs(a - b) < epsilon, `${a} differs from ${b}`);
  const sum = values => values.reduce((a, b) => a + b, 0);
  assert.equal(nodeNames.length, 14); assert.equal(fixture.edges.length, 29);
  const zip = resolve("public/downloads/uzuske-1.0.zip");
  assert.equal(createHash("sha256").update(readFileSync(zip)).digest("hex"), "1589ae116663731413e428f670958165934b10a15160bebc3531724eb6bd215c");
  const cases = [1, 2, 4, 6].map(topK => ({ payload: fixture, topK }));
  cases.push({ payload: { ...fixture, observations: [] }, topK: 4 });
  cases.push({ payload: { ...fixture, edges: fixture.edges.map(e => e.source === "A" && e.target === "C" ? { ...e, weight: 2.6 } : e) }, topK: 4 });
  cases.push({ payload: { ...fixture, start: "C", destination: "M" }, topK: 4 });
  cases.push({ payload: { ...fixture, start: "N", destination: "A" }, topK: 4 });
  cases.push({ payload: { ...fixture, start: "N", destination: "N" }, topK: 4 });
  const python = spawnSync("python3", ["-c", `import sys,json,zipfile,tempfile\nwith tempfile.TemporaryDirectory() as d:\n zipfile.ZipFile(sys.argv[1]).extractall(d)\n sys.path.insert(0,d+'/uzuske-1.0')\n from uzuske import predict_routes\n results=[]\n for case in json.load(sys.stdin):\n  try: results.append({'routes':[{'route':p.route,'probability':p.probability,'score':p.score} for p in predict_routes(case['payload'],case['topK'])]})\n  except ValueError as e: results.append({'error':str(e)})\n print(json.dumps(results))`, zip], { input: JSON.stringify(cases), encoding: "utf8" });
  assert.equal(python.status, 0, python.stderr);
  const pythonResults = JSON.parse(python.stdout);
  cases.forEach((test, i) => {
    if (pythonResults[i].error) { assert.throws(() => predictRoutes(test.payload, test.topK)); return; }
    const actual = predictRoutes(test.payload, test.topK), expected = pythonResults[i].routes;
    assert.equal(actual.length, expected.length); close(sum(actual.map(p => p.probability)), 1);
    actual.forEach((p, j) => { assert.deepEqual(p.route, expected[j].route); close(p.probability, expected[j].probability); close(p.score, expected[j].score); assert.equal(new Set(p.route).size, p.route.length); });
  });
  assert.deepEqual(examplePredictions.map(p => p.route.join("")), ["ACFJN", "ADGKN", "ABEHN", "ADGLN"]);
  for (const p of examplePredictions) assert.ok(terminalOutput.includes((p.probability * 100).toFixed(2)));
  assert.throws(() => predictRoutes({ ...fixture, edges: [{ source: "A", target: "N", weight: 0 }] }));
  close(conditionalProbability(.5, .5, .2), .35); close(conditionalProbability(0, .8, .2), .2); close(conditionalProbability(1, .8, .2), .8);
  for (const row of baseMatrix) close(sum(row), 1);
  for (const reliability of [0, .1, .35, .8, 1]) for (const exposure of [0, .35, 1]) for (const disagreement of [false, true]) { const output = influenceExample(reliability, exposure, disagreement); assert.ok(output.probability > 0 && output.probability < 1); assert.ok(Number.isFinite(output.entropy)); }
  assert.ok(influenceExample(.1, .35).abstain); assert.ok(influenceExample(.8, .35, true).abstain);
  const boundary = evolveStrength(.01, 100, 0, 1, 10); close(boundary[0], 0); close(boundary[1], 100);
  assert.deepEqual(evolveStrength(0, 100, 1, 1, 100), [0, 100]);
  for (const pressure of [0, .35, 1]) for (const hybrid of [false, true]) {
    const output = scenario(pressure, hybrid);
    for (const timestep of output.distributions) for (const distribution of timestep) { close(sum(distribution), 1); for (const p of distribution) assert.ok(p >= 0 && p <= 1); }
    for (const values of output.strengths) for (const value of values) assert.ok(Number.isFinite(value) && value >= 0);
  }
  assert.deepEqual(scenario(.35, true, 64), scenario(.35, true, 64));
  console.log("Passed: nine cross-language route cases; fixture/table/terminal agreement; original ZIP checksum; conditional probability; aggregate forecast and abstention; normalized scenario distributions; deterministic sampling; nonnegative strength and zero-boundary stopping.");
} finally { rmSync(temporary, { recursive: true, force: true }); }
