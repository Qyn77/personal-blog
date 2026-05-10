@echo off
setlocal enabledelayedexpansion

REM 切换到脚本所在目录（项目根目录）
cd /d "%~dp0"

REM 检查 node_modules\.bin 是否存在
if not exist "node_modules\.bin" (
    echo 错误：找不到 node_modules\.bin，请先运行 npm install / yarn / pnpm install / bun install
    exit /b 1
)

REM 查找 vite.cmd
if exist "node_modules\.bin\vite.cmd" (
    set VITE_CMD=node_modules\.bin\vite.cmd
) else if exist "node_modules\.bin\vite" (
    set VITE_CMD=node_modules\.bin\vite
) else (
    echo 错误：未找到 vite，请确认已安装
    exit /b 1
)

REM 查找 esbuild.cmd
if exist "node_modules\.bin\esbuild.cmd" (
    set ESBUILD_CMD=node_modules\.bin\esbuild.cmd
) else if exist "node_modules\.bin\esbuild" (
    set ESBUILD_CMD=node_modules\.bin\esbuild
) else (
    echo 错误：未找到 esbuild，请确认已安装
    exit /b 1
)

echo [1/4] 构建前端...
call %VITE_CMD% build
if %errorlevel% neq 0 exit /b %errorlevel%

echo [2/4] 打包服务端...
call %ESBUILD_CMD% server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
if %errorlevel% neq 0 exit /b %errorlevel%

echo [3/4] 拷贝内容资源...
if exist books (
    xcopy /E /I /Y books dist\books >nul
    echo   ✓ books → dist\books
) else (
    echo   ⊘ books 目录不存在，跳过
)
if exist archives (
    xcopy /E /I /Y archives dist\archives >nul
    echo   ✓ archives → dist\archives
) else (
    echo   ⊘ archives 目录不存在，跳过
)

if exist "client\public\about-config.json" (
    if not exist "dist\public\about-config.json" (
        mkdir dist\public 2>nul
        copy /Y client\public\about-config.json dist\public\about-config.json >nul
        echo   ✓ client\public\about-config.json → dist\public\about-config.json
    )
)

echo [4/4] 拷贝部署文件...
copy /Y package.json dist\ >nul
if not exist "dist\.env" (
    if exist ".env.example" (
        copy /Y .env.example dist\.env.example >nul
        echo   ✓ .env.example → dist\.env.example
    )
)

echo.
echo ✓ 打包完成！dist 目录可独立部署。
echo.
echo 部署步骤：
echo   cd dist
echo   npm install --prod   # 或 yarn install --production / pnpm install --prod / bun install --production
echo   copy .env.example .env
echo   set NODE_ENV=production
echo   node index.js
echo.

exit /b 0