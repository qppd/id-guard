#!/usr/bin/env node
/**
 * Mermaid render check — validates every ```mermaid block in markdown files
 * before committing.
 *
 * Usage:
 *   node scripts/check-mermaid.mjs [file.md ...]   (default: all .md under src/IDGuard)
 *
 * Two layers:
 *   1. Structural lint — catches the known GitHub failure modes:
 *        • node IDs starting with a digit (401[...]) or reserved words (END)
 *        • unquoted labels containing { } (parse errors)
 *        • unquoted labels starting with / (stadium/parallelogram ambiguity)
 *   2. Real parse via mermaid.parse() in Node (jsdom shims) — catches everything else.
 *
 * Exits 1 on any error (so a pre-commit hook can block the commit).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RESERVED_IDS = new Set([
  "end", "subgraph", "direction", "classdef", "class", "click",
  "style", "linkstyle", "graph", "flowchart", "like",
]);

const cliFiles = process.argv.slice(2);
const files = cliFiles.length ? cliFiles : collectMd(ROOT);

if (files.length === 0) {
  console.log("check-mermaid: no markdown files to check");
  process.exit(0);
}

let hadErrors = false;
let parseAvailable = false;
try {
  // Resolve without executing — importing mermaid before the jsdom DOM exists
  // breaks its internal DOMPurify binding.
  createRequire(import.meta.url).resolve("mermaid");
  createRequire(import.meta.url).resolve("jsdom");
  parseAvailable = true;
} catch {
  console.log("check-mermaid: mermaid/jsdom not installed — running structural checks only");
}

for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const block of extractBlocks(text)) {
    const errors = structuralErrors(block.code);

    if (parseAvailable) {
      try {
        await parseWithMermaid(block.code);
      } catch (e) {
        errors.push(`mermaid parse error: ${String(e.message || e).split("\n")[0]}`);
      }
    }

    if (errors.length > 0) {
      hadErrors = true;
      for (const err of errors) {
        console.error(`✗ ${file}:${block.startLine} — ${err}`);
      }
    }
  }
}

if (hadErrors) {
  console.error("\ncheck-mermaid: fix the errors above (quote node labels, avoid numeric/reserved node IDs)");
  process.exit(1);
}
console.log(`check-mermaid: OK (${files.length} file(s)${parseAvailable ? ", full parse" : ", structural only"})`);
process.exit(0);

// ---------- helpers ----------

function collectMd(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...collectMd(p));
    else if (entry.endsWith(".md")) out.push(p);
  }
  return out;
}

function extractBlocks(text) {
  const blocks = [];
  const re = /```mermaid\r?\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) {
    const startLine = text.slice(0, m.index).split("\n").length;
    blocks.push({ startLine, code: m[1] });
  }
  return blocks;
}

function structuralErrors(code) {
  const errors = [];
  code.split("\n").forEach((line, idx) => {
    const n = idx + 1;
    const raw = line.trim();
    if (!raw || raw.startsWith("%%")) return;
    // Skip directive lines that legitimately start with reserved keywords
    if (/^(flowchart|graph|subgraph|direction|classDef|class|style|linkStyle|click)\b/i.test(raw)) return;

    // Node id before any shape opener:  X[  X[[" X([ X[/ X[{ { X( X(( X{{
    const shapeRe = /(?:^|[\s;])([A-Za-z0-9_.-]+)(\[\(|\[\[|\[\/|\[\^|\[|\(\(|\(\[|\(|\{\{|\{)/g;
    let m;
    while ((m = shapeRe.exec(raw))) {
      const id = m[1];
      if (/^\d/.test(id)) {
        errors.push(`line ${n}: node ID "${id}" starts with a digit — use a letter-first ID (e.g. R${id})`);
      } else if (RESERVED_IDS.has(id.toLowerCase())) {
        errors.push(`line ${n}: node ID "${id}" is a mermaid reserved word — rename it`);
      }
    }

    // Unquoted labels containing braces, or starting with '/'
    const labelRe = /\[([^\][]*)\]|\(([^()]*)\)|\{([^{}]*)\}/g;
    while ((m = labelRe.exec(raw))) {
      const content = m[1] ?? m[2] ?? m[3] ?? "";
      if (/^\s*"/.test(content)) continue; // quoted label — safe
      if (/[{}]/.test(content)) {
        errors.push(`line ${n}: unquoted label contains { } — wrap it in double quotes: ["${content.trim()}"]`);
      } else if (m[0].startsWith("[") && /^\s*\//.test(content)) {
        errors.push(`line ${n}: label starts with '/' (ambiguous shape) — wrap it in double quotes: ["${content.trim()}"]`);
      }
    }

    // Edge |labels| with braces
    const pipeRe = /\|([^|]*)\|/g;
    while ((m = pipeRe.exec(raw))) {
      if (!/^\s*"/.test(m[1]) && /[{}]/.test(m[1])) {
        errors.push(`line ${n}: edge label contains { } — wrap it in double quotes`);
      }
    }
  });
  return errors;
}

async function parseWithMermaid(code) {
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
  // First mermaid import must happen AFTER the DOM globals above exist
  const mermaid = (await import("mermaid")).default;
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
  // Throws on invalid syntax; returns true when valid
  await mermaid.parse(code);
}
