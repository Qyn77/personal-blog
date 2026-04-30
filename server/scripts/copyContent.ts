import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DIST_ROOT = path.join(PROJECT_ROOT, "dist");
const SOURCES = ["books", "archives"] as const;

function copyDir(sourceName: (typeof SOURCES)[number]) {
  const sourcePath = path.join(PROJECT_ROOT, sourceName);
  const targetPath = path.join(DIST_ROOT, sourceName);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`[copyContent] Source folder not found: ${sourcePath}`);
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
  console.log(`[copyContent] Copied ${sourceName} -> dist/${sourceName}`);
}

function main() {
  fs.mkdirSync(DIST_ROOT, { recursive: true });
  for (const source of SOURCES) {
    copyDir(source);
  }
}

main();
