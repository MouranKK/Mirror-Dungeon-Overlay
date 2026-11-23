@echo off
setlocal EnableExtensions DisableDelayedExpansion
pushd "%~dp0"
if errorlevel 1 (echo ERROR: Could not enter folder.& pause& exit /b 1)
title Mirror Dungeon Overlay - Public Beta Build
if not exist "package.json" (echo ERROR: Missing package.json. Unzip everything first.& goto fail)
where node.exe >nul 2>nul
if errorlevel 1 (echo ERROR: Install Node.js LTS from https://nodejs.org/& goto fail)
where npm.cmd >nul 2>nul
if errorlevel 1 (echo ERROR: npm missing.& goto fail)
echo [1/5] Node and npm
node --version
call npm.cmd --version
if errorlevel 1 goto fail
if not exist "package-lock.json" (
 echo [2/5] Creating package-lock.json from pinned versions. COMMIT IT to GitHub once reviewed.
 call npm.cmd install --package-lock-only --ignore-scripts --no-fund
 if errorlevel 1 goto fail
)
echo [3/5] Installing locked dependencies
call npm.cmd ci --no-fund
if errorlevel 1 goto fail
echo [4/5] Source verification AND complete dependency audit
call npm.cmd run verify
if errorlevel 1 goto fail
call npm.cmd audit --audit-level=high
if errorlevel 1 (
 echo ERROR: High or critical dependency advisory found. Do not distribute EXE.
 echo Review the advisory and update the dependency before releasing.
 goto fail
)
echo [5/5] Building local UNSIGNED Windows portable EXE
call npm.cmd run build:win
if errorlevel 1 goto fail
echo.
echo BUILD COMPLETE. This EXE IS UNSIGNED. Do not market as verified/signed.
if exist "dist" explorer "%CD%\dist"
popd
pause
exit /b 0
:fail
echo.
echo Build/verification failed. Review the error ABOVE before distributing.
popd
pause
exit /b 1
