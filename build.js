/**
 * 一键打包脚本 (纯 Node.js 实现)
 * 执行 `node build.js` 即可构建前端+后端+资源
 * 产出 dist/ 目录可独立部署
 *
 * 兼容性：不依赖 shell，直接调用 node_modules/.bin 下的可执行文件
 * 要求：已执行过 npm/yarn/pnpm/bun install，确保 vite 和 esbuild 已安装
 */

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前脚本所在目录（项目根目录）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

// 获取平台相关的可执行文件后缀
const isWin = process.platform === "win32";
const getBinPath = binName => {
  let binPath = path.join(ROOT, "node_modules", ".bin", binName);
  if (isWin) {
    // Windows 上优先尝试 .cmd，然后 .ps1，最后无扩展名
    const cmdPath = binPath + ".cmd";
    const psPath = binPath + ".ps1";
    if (fs.existsSync(cmdPath)) return cmdPath;
    if (fs.existsSync(psPath)) return psPath;
  }
  // Unix 或 Windows 上的其他情况（例如直接的可执行文件）
  return binPath;
};

// 执行命令，参数为数组
// 使用 pnpm exec 来处理 pnpm 虚拟存储中的可执行文件
function run(command, args) {
  console.log(`\n▸ ${command} ${args.join(" ")}`);
  try {
    // 使用 pnpm exec 来执行命令，处理虚拟存储问题
    const fullArgs = ["exec", command, ...args];
    
    // Windows 上 pnpm 是 PowerShell 脚本，需要通过 powershell 执行
    if (isWin) {
      // 使用 cmd /c 来执行 pnpm 命令，这样能正确处理 PowerShell 脚本
      execFileSync("cmd.exe", ["/c", "pnpm", ...fullArgs], { stdio: "inherit", cwd: ROOT });
    } else {
      execFileSync("pnpm", fullArgs, { stdio: "inherit", cwd: ROOT });
    }
  } catch (err) {
    console.error(`执行失败: ${command} ${args.join(" ")}`);
    process.exit(1);
  }
}

// 拷贝目录（递归）
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`  ⊘ 跳过 ${src}（不存在）`);
    return;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`  ✓ ${path.relative(ROOT, src)} → ${path.relative(ROOT, dest)}`);
}

// 拷贝文件
function copyFile(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${path.relative(ROOT, src)} → ${path.relative(ROOT, dest)}`);
}

// 检查依赖是否已安装
function checkBin(binName) {
  // 使用 pnpm exec 时不需要检查 .bin 目录
  // 只需检查 node_modules 是否存在即可
  if (!fs.existsSync(path.join(ROOT, "node_modules"))) {
    console.error(
      `错误：未找到 node_modules，请先运行 npm install / yarn / pnpm install / bun install`
    );
    process.exit(1);
  }
  return binName;
}

// ─── Step 1: 前端构建 ─────────────────────────────────────────
console.log("\n[1/4] 构建前端...");
const viteBin = checkBin("vite");
run(viteBin, ["build"]);

// ─── Step 2: 后端打包 ─────────────────────────────────────────
console.log("\n[2/4] 打包服务端...");
const esbuildBin = checkBin("esbuild");
run(esbuildBin, [
  "server/_core/index.ts",
  "--platform=node",
  "--packages=external",
  "--bundle",
  "--format=esm",
  "--outdir=dist",
]);

// ─── Step 3: 拷贝内容资源 ─────────────────────────────────────
console.log("\n[3/4] 拷贝内容资源...");
copyDir(path.join(ROOT, "books"), path.join(DIST, "books"));
copyDir(path.join(ROOT, "archives"), path.join(DIST, "archives"));

const aboutConfigDest = path.join(DIST, "public", "about-config.json");
if (!fs.existsSync(aboutConfigDest)) {
  copyFile(path.join(ROOT, "client/public/about-config.json"), aboutConfigDest);
}

// ─── Step 4: 拷贝部署文件 ─────────────────────────────────────
console.log("\n[4/4] 拷贝部署文件...");
copyFile(path.join(ROOT, "package.json"), path.join(DIST, "package.json"));
// 不拷贝 lock 文件，避免包管理器冲突
// 如果需要可在此添加：copyFile(path.join(ROOT, 'pnpm-lock.yaml'), path.join(DIST, 'pnpm-lock.yaml'));

const envExample = path.join(DIST, ".env.example");
if (!fs.existsSync(path.join(DIST, ".env"))) {
  copyFile(path.join(ROOT, ".env.example"), envExample);
}

// ─── 完成 ─────────────────────────────────────────────────────
console.log("\n✓ 打包完成！dist/ 目录可独立部署。");
console.log("\n部署步骤：");
console.log("  cd dist");
console.log("  # 使用你喜欢的包管理器安装生产依赖");
console.log(
  "  npm install --prod   # 或 yarn install --production / pnpm install --prod / bun install --production"
);
console.log("  cp .env.example .env  # 编辑填入真实配置");
console.log("  node index.js\n");
