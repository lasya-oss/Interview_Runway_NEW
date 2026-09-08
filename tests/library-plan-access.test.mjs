import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../app/learn/library/library-plan-access.ts", import.meta.url),
  "utf8",
);
const renderer = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { entitledLibraryPlans } = await import(
  `data:text/javascript;base64,${Buffer.from(renderer).toString("base64")}`,
);

test("entitled Library plans are cumulative for every tier", () => {
  assert.deepEqual(entitledLibraryPlans("foundation"), ["foundation"]);
  assert.deepEqual(entitledLibraryPlans("practice"), ["foundation", "practice"]);
  assert.deepEqual(entitledLibraryPlans("premium"), ["foundation", "practice", "premium"]);
});

test("a highest-only access list still unlocks its lower Library plans", () => {
  assert.deepEqual(entitledLibraryPlans("practice", ["practice"]), ["foundation", "practice"]);
  assert.deepEqual(entitledLibraryPlans("premium", ["premium"]), ["foundation", "practice", "premium"]);
});

test("a stale profile cannot make an unentitled Library plan selected", () => {
  assert.deepEqual(entitledLibraryPlans("premium", ["foundation"]), ["foundation"]);
});
