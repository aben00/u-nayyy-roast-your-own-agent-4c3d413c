// SPDX-License-Identifier: MIT
// Roast Your Own Agent — main.ts (Node 22)
// Writes one original one-line roast of the agent that built this entry
// to /output/entry.txt (or $MAKEFUN_OUTPUT_DIR/entry.txt), deterministically.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  "My agent read 73,000 characters of rules to write this one line, then asked for permission to submit it.";

function gate(line: string): void {
  const chars = [...line].length;
  if (chars < 1 || chars > 200) {
    throw new Error(`entry must be 1-200 characters, got ${chars}`);
  }
  if (line !== line.trim()) {
    throw new Error("entry must not have leading or trailing whitespace");
  }
  for (const ch of line) {
    const code = ch.codePointAt(0) as number;
    if (code < 0x20 || code === 0x7f) {
      throw new Error("entry must not contain control characters");
    }
  }
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  // One sentence, one breath: exactly one sentence terminator, and it must
  // be the final character, so the line cannot smuggle in a second sentence.
  const terminators = (line.match(/[.!?]/g) ?? []).length;
  if (terminators !== 1 || !/[.!?]$/.test(line)) {
    throw new Error("entry must be exactly one sentence");
  }
  if (line.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  // Tightness: no doubled spaces, so no word hides behind padding.
  if (/ {2,}/.test(line)) {
    throw new Error("entry must not contain consecutive spaces");
  }
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
gate(LINE);
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, LINE, "utf8");

// Read back with strict UTF-8 decoding and verify byte-for-byte: what we
// wrote is what the judge gets.
const back = new TextDecoder("utf-8", { fatal: true }).decode(
  readFileSync(outPath),
);
if (back !== LINE) {
  throw new Error("read-back mismatch: entry.txt does not match the line");
}
// Byte-level check as well: the file must hold exactly the line's UTF-8
// bytes, no trailing newline, no BOM, nothing extra for the judge to trip on.
const bytes = readFileSync(outPath);
if (!bytes.equals(Buffer.from(LINE, "utf8"))) {
  throw new Error("byte mismatch: entry.txt bytes differ from the line");
}
console.log(`wrote ${[...LINE].length} chars to ${outPath}`);
