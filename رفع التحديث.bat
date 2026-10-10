@echo off
chcp 65001 >nul
cd /d "%~dp0"

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo ERROR: This file must be placed inside the Git project folder.
  pause
  exit /b 1
)

git add .
if errorlevel 1 goto :failed

git diff --cached --quiet
if errorlevel 2 goto :failed
if errorlevel 1 (
  git commit -m "Update Tawafuq Web"
  if errorlevel 1 goto :failed
) else (
  echo No new changes to commit.
)

git push origin main
if errorlevel 1 goto :failed

echo.
echo Updates uploaded successfully!
pause
exit /b 0

:failed
echo.
echo Upload failed. Check the error above.
pause
exit /b 1
