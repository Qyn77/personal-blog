@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

cd /d "%~dp0"

if not exist "node_modules" (
    echo Error: node_modules not found. Please run npm install / yarn / pnpm install / bun install first.
    exit /b 1
)

echo [1/4] Building frontend...
pnpm exec vite build
if %errorlevel% neq 0 exit /b %errorlevel%

echo [2/4] Building server...
pnpm exec esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
if %errorlevel% neq 0 exit /b %errorlevel%

echo [3/4] Copying content files...
if exist books (
    xcopy /E /I /Y books dist\books >nul
    echo   OK: books -> dist\books
) else (
    echo   SKIP: books directory not found
)

if exist archives (
    xcopy /E /I /Y archives dist\archives >nul
    echo   OK: archives -> dist\archives
) else (
    echo   SKIP: archives directory not found
)

if exist "client\public\about-config.json" (
    if not exist "dist\public\about-config.json" (
        mkdir dist\public 2>nul
        copy /Y client\public\about-config.json dist\public\about-config.json >nul
        echo   OK: client\public\about-config.json -> dist\public\about-config.json
    )
)

echo [4/4] Copying deployment files...
copy /Y package.json dist\ >nul
if not exist "dist\.env" (
    if exist ".env.example" (
        copy /Y .env.example dist\.env.example >nul
        echo   OK: .env.example -> dist\.env.example
    )
)

echo.
echo Build completed! The dist directory is ready for deployment.
echo.
echo Deployment steps:
echo   cd dist
echo   npm install --prod   # or yarn install --production / pnpm install --prod / bun install --production
echo   copy .env.example .env
echo   set NODE_ENV=production
echo   node index.js
echo.

exit /b 0