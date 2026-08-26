import { appendFile, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const directoryPath = fileURLToPath(new URL("../public/video/replays/", import.meta.url));
const fileName = "mock_behavioral_ambiguity_03.mp4";
const outputPath = join(directoryPath, fileName);
const parts = (await readdir(directoryPath))
  .filter((entry) => entry.startsWith(`${fileName}.part-`))
  .sort();

if (parts.length === 0) {
  throw new Error(`No chunks found for ${fileName}`);
}

await rm(outputPath, { force: true });
for (const part of parts) {
  await appendFile(outputPath, await readFile(join(directoryPath, part)));
}
