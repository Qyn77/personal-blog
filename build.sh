#!/bin/bash
set -e

# 切换到脚本所在目录（项目根目录）
cd "$(dirname "$0")"

# 自动检测可用的包管理器（只是为了获取 bin 路径，实际直接用 node_modules/.bin）
# 但是更简单：直接将 node_modules/.bin 加入 PATH
NODE_BIN="$(pwd)/node_modules/.bin"
if [[ ! -d "$NODE_BIN" ]]; then
    echo "错误：找不到 node_modules/.bin，请先运行 npm install / yarn / pnpm install"
    exit 1
fi
export PATH="$NODE_BIN:$PATH"

echo "[1/4] 构建前端..."
vite build

echo "[2/4] 打包服务端..."
esbuild server/_core/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist

echo "[3/4] 拷贝内容资源..."
cp -r books dist/ 2>/dev/null || echo "  ⊘ books 目录不存在，跳过"
cp -r archives dist/ 2>/dev/null || echo "  ⊘ archives 目录不存在，跳过"

if [ -f "client/public/about-config.json" ] && [ ! -f "dist/public/about-config.json" ]; then
  mkdir -p dist/public
  cp client/public/about-config.json dist/public/about-config.json
  echo "  ✓ client/public/about-config.json → dist/public/about-config.json"
fi

echo "[4/4] 拷贝部署文件..."
cp package.json dist/

if [ ! -f "dist/.env" ] && [ -f ".env.example" ]; then
  cp .env.example dist/.env.example
  echo "  ✓ .env.example → dist/.env.example"
fi

echo ""
echo "✓ 打包完成！dist/ 目录可独立部署。"
echo ""
echo "部署步骤："
echo "  cd dist"
echo "  # 然后用你喜欢的包管理器安装生产依赖"
echo "  npm install --prod   # 或 yarn install --production / pnpm install --prod / bun install --production"
echo "  cp .env.example .env  # 编辑填入真实配置"
echo "  NODE_ENV=production node index.js"