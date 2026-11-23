@echo off
setlocal
pushd "%~dp0"
if errorlevel 1 exit /b 1
where npm.cmd >nul 2>nul || (echo Install Node.js LTS first.& pause& exit /b 1)
if not exist "node_modules" (
 echo Dependencies not installed. Run Build-Windows.cmd first.
 pause
 exit /b 1
)
call npm.cmd start
popd
pause
