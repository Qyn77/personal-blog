import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DIST_PUBLIC = path.join(ROOT, "dist", "public");
const ASSETS_DIR = path.join(DIST_PUBLIC, "assets");

const JS_BUDGET_KB = Number(process.env.BUNDLE_BUDGET_JS_KB || 1300);
const CSS_BUDGET_KB = Number(process.env.BUNDLE_BUDGET_CSS_KB || 220);
const ASSET_BUDGET_KB = Number(
  process.env.BUNDLE_BUDGET_TOTAL_ASSETS_KB || 1500
);

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return [fullPath];
  });
}

function toKB(bytes) {
  return Number((bytes / 1024).toFixed(1));
}

function sumSize(files) {
  return files.reduce((total, file) => total + fs.statSync(file).size, 0);
}

if (!fs.existsSync(ASSETS_DIR)) {
  console.error("❌ assets 目录不存在，请先执行 pnpm build");
  process.exit(1);
}

const allAssets = walkFiles(ASSETS_DIR);
const jsAssets = allAssets.filter(file => file.endsWith(".js"));
const cssAssets = allAssets.filter(file => file.endsWith(".css"));

const jsKB = toKB(sumSize(jsAssets));
const cssKB = toKB(sumSize(cssAssets));
const totalAssetKB = toKB(sumSize(allAssets));

console.log(
  `Bundle assets: JS ${jsKB}KB / CSS ${cssKB}KB / Total ${totalAssetKB}KB`
);

const failures = [];
if (jsKB > JS_BUDGET_KB)
  failures.push(`JS 体积超出预算: ${jsKB}KB > ${JS_BUDGET_KB}KB`);
if (cssKB > CSS_BUDGET_KB)
  failures.push(`CSS 体积超出预算: ${cssKB}KB > ${CSS_BUDGET_KB}KB`);
if (totalAssetKB > ASSET_BUDGET_KB)
  failures.push(
    `静态资源体积超出预算: ${totalAssetKB}KB > ${ASSET_BUDGET_KB}KB`
  );

if (failures.length > 0) {
  console.error("❌ Bundle budget 检查失败：");
  failures.forEach(msg => console.error(`- ${msg}`));
  process.exit(1);
}

console.log("✅ Bundle budget 检查通过");
