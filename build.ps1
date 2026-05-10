# 切换到脚本所在目录
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptRoot

# 检查 node_modules\.bin
$binPath = Join-Path $scriptRoot "node_modules\.bin"
if (-not (Test-Path $binPath)) {
    Write-Host "错误：找不到 node_modules\.bin，请先运行 npm install / yarn / pnpm install / bun install" -ForegroundColor Red
    exit 1
}

# 查找 vite 命令
$viteCmd = $null
if (Test-Path (Join-Path $binPath "vite.cmd")) { $viteCmd = Join-Path $binPath "vite.cmd" }
elseif (Test-Path (Join-Path $binPath "vite")) { $viteCmd = Join-Path $binPath "vite" }
else {
    Write-Host "错误：未找到 vite，请确认已安装" -ForegroundColor Red
    exit 1
}

# 查找 esbuild 命令
$esbuildCmd = $null
if (Test-Path (Join-Path $binPath "esbuild.cmd")) { $esbuildCmd = Join-Path $binPath "esbuild.cmd" }
elseif (Test-Path (Join-Path $binPath "esbuild")) { $esbuildCmd = Join-Path $binPath "esbuild" }
else {
    Write-Host "错误：未找到 esbuild，请确认已安装" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] 构建前端..."
& $viteCmd build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/4] 打包服务端..."
& $esbuildCmd "server/_core/index.ts", "--platform=node", "--packages=external", "--bundle", "--format=esm", "--outdir=dist"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[3/4] 拷贝内容资源..."
if (Test-Path "books") {
    Copy-Item -Path "books" -Destination "dist\books" -Recurse -Force
    Write-Host "  ✓ books → dist\books"
} else { Write-Host "  ⊘ books 目录不存在，跳过" }

if (Test-Path "archives") {
    Copy-Item -Path "archives" -Destination "dist\archives" -Recurse -Force
    Write-Host "  ✓ archives → dist\archives"
} else { Write-Host "  ⊘ archives 目录不存在，跳过" }

if (Test-Path "client\public\about-config.json") {
    $destAbout = "dist\public\about-config.json"
    if (-not (Test-Path $destAbout)) {
        New-Item -ItemType Directory -Path "dist\public" -Force | Out-Null
        Copy-Item "client\public\about-config.json" $destAbout -Force
        Write-Host "  ✓ client\public\about-config.json → dist\public\about-config.json"
    }
}

Write-Host "[4/4] 拷贝部署文件..."
Copy-Item "package.json" "dist\" -Force
if ((-not (Test-Path "dist\.env")) -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" "dist\.env.example" -Force
    Write-Host "  ✓ .env.example → dist\.env.example"
}

Write-Host ""
Write-Host "✓ 打包完成！dist 目录可独立部署。" -ForegroundColor Green
Write-Host ""
Write-Host "部署步骤："
Write-Host "  cd dist"
Write-Host "  npm install --prod   # 或 yarn install --production / pnpm install --prod / bun install --production"
Write-Host "  copy .env.example .env"
Write-Host "  `$env:NODE_ENV='production'"
Write-Host "  node index.js"