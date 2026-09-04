import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");
const renderer = ts.transpileModule(await read("app/lib/text-pdf.ts"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { createTextPdf } = await import(`data:text/javascript;base64,${Buffer.from(renderer).toString("base64")}`);

function bodyPages(bytes) {
  return [...new TextDecoder().decode(bytes).matchAll(/stream\n([\s\S]*?)\nendstream/g)]
    .map((stream, index) => [...stream[1].matchAll(/BT \/(F[12]) ([\d.]+) Tf [^\n]+ 1 0 0 1 46 ([\d.]+) Tm \(([^\n]*)\) Tj ET/g)]
      .filter((item) => +item[3] <= (index === 0 ? 594 : 670) && +item[3] > 40)
      .map((item) => ({ font: item[1], text: item[4] })));
}

const selection = (await read("app/lib/active-library-selection.ts"))
  .split("export const ACTIVE_DRIVE_FILENAMES = [")[1].split("] as const")[0];
const activeFiles = [...selection.matchAll(/"([^"]+)"/g)].map((match) => match[1]);

test("every active supporting preview has content and no blank pages or orphan headings", async () => {
  assert.equal(activeFiles.length, 43);
  for (const filename of activeFiles) {
    const companion = filename.replace(/\.docx$/, ".preview.txt").replace(/\.mp4$/, "_transcript.md");
    const source = (await read(`public/drive-materials/${companion}`)).replace(/\r\n?/g, "\n");
    assert.ok(source.trim().length > 100, filename);
    const bytes = createTextPdf("Material QA", filename, source);
    assert.deepEqual(bytes, createTextPdf("Material QA", filename, source.replace(/\n/g, "\r\n")), `${filename}: CRLF`);
    assert.deepEqual(bytes, createTextPdf("Material QA", filename, source.replace(/\n/g, "\r")), `${filename}: CR`);
    for (const [index, page] of bodyPages(bytes).entries()) {
      assert.ok(page.length, `${filename}: page ${index + 1} must contain body text`);
      assert.notEqual(page.at(-1).font, "F2", `${filename}: heading at end of page ${index + 1}`);
    }
  }
});

test("all 18 template previews teach the method and retain the reusable original", async () => {
  const templates = activeFiles.filter((filename) => filename.endsWith(".docx"));
  assert.equal(templates.length, 18);
  const openings = new Set();
  for (const filename of templates) {
    const source = await read(`public/drive-materials/${filename.replace(/\.docx$/, ".preview.txt")}`);
    const [guidance, original] = source.split("# Reusable template");
    assert.equal(source.split("# Reusable template").length, 2, filename);
    assert.match(guidance, /Worked example - fictional/);
    assert.match(guidance, /Learning objective:/);
    assert.ok(guidance.split(/\s+/).length >= 180, filename);
    assert.match(original, /personal-entry fields below are intentional/);
    assert.ok(original.trim().length > 250, filename);
    openings.add(guidance.split(/\r?\n/)[0]);
  }
  assert.equal(openings.size, 18, "Each template needs topic-specific guidance");
});

test("preview pagination trims empty tails and carries a heading with its content", () => {
  assert.equal(bodyPages(createTextPdf("Example", "example.txt", "Useful content\n" + "\n".repeat(100))).length, 1);
  assert.equal(bodyPages(createTextPdf("Empty", "empty.txt", "")).length, 1);
  const pages = bodyPages(createTextPdf("Example", "example.txt", "Body line\n".repeat(32) + "\n## Decision checklist\n\nFirst useful action\nSecond useful action"));
  assert.equal(pages.length, 2);
  assert.notEqual(pages[0].at(-1).font, "F2");
  assert.equal(pages[1][0].text, "Decision checklist");
  assert.equal(pages[1][1].text, "First useful action");
});

test("behavioral bank has 50 distinct questions, each with evidence and a probe", async () => {
  const source = await read("scripts/learning-materials/behavioral-question-bank.md");
  const questions = [...source.matchAll(/^### (\d+)\. (.+)$/gm)];
  assert.equal(questions.length, 50);
  assert.deepEqual(questions.map((match) => +match[1]), Array.from({ length: 50 }, (_, index) => index + 1));
  assert.equal(new Set(questions.map((match) => match[2])).size, 50);
  assert.equal((source.match(/^Evidence to prepare:/gm) ?? []).length, 50);
  assert.equal((source.match(/^Probe:/gm) ?? []).length, 50);
  assert.match(source, /Human review remains required/);
});
