@echo off
rem ============================================================
rem PFD Editor - one-click start (Windows native, no PowerShell)
rem   - Kills any stale server bound on the chosen port
rem   - Launches node server.js in a fully detached window
rem     (start /B + cmd /C so the process tree survives this script)
rem   - Falls back to python http.server if Node missing
rem   - Falls back to opening editor.html directly if no runtime at all
rem   - Opens the editor in your default browser once the port binds
rem Optional arg: a port number, e.g. `start.cmd 9000`
rem ============================================================
setlocal
cd /d "%~dp0"
set "PORT=%~1"
if not defined PORT set "PORT=8090"
set "URL=http://127.0.0.1:%PORT%/editor"

echo ============================================================
echo  PFD Editor - local dev starter
echo  Repo   : %CD%
echo  Port   : %PORT%
echo  URL    : %URL%
echo ============================================================

rem ---- 1. kill stale listener on this port ----
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /C:":%PORT% " ^| findstr LISTENING') do (
  echo [start] killing stale PID %%P on :%PORT%
  taskkill /F /PID %%P >nul 2>&1
)

rem ---- 2. pick a runtime ----
rem 审计 10.4：原来写死了某个托管 Node 的绝对路径（含具体版本号），换机即失效。
rem 现在：PATH 上的 node 优先；找不到再枚举 WorkBuddy 托管目录（不写死版本号）。
set "NODE_EXE="
for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
if not defined NODE_EXE (
  for /d %%D in ("%USERPROFILE%\.workbuddy\binaries\node\versions\*") do (
    if not defined NODE_EXE if exist "%%D\node.exe" set "NODE_EXE=%%D\node.exe"
  )
)
rem 版本以 .nvmrc 为准（当前 20）；这里只回显，不强制失败，避免阻断旧环境
set "NODE_VER="
if defined NODE_EXE for /f "delims=" %%V in ('"%NODE_EXE%" -v 2^>nul') do set "NODE_VER=%%V"
if defined NODE_VER echo [start] node %NODE_VER%  (expect v20.x per .nvmrc)

set "PY_EXE="
if not defined NODE_EXE (
  if exist "%USERPROFILE%\AppData\Local\Programs\Python\Python312\python.exe" set "PY_EXE=%USERPROFILE%\AppData\Local\Programs\Python\Python312\python.exe"
  if not defined PY_EXE where python >nul 2>&1
  if errorlevel 1 set "PY_EXE=" 2>nul
)

rem ---- 3. launch detached ----
set "LOG=%CD%\pfd-server.out.log"
set "ERR=%CD%\pfd-server.err.log"
del "%LOG%" "%ERR%" 2>nul

if defined NODE_EXE (
  echo [start] runtime: Node (%NODE_EXE%)
  echo [start] log:    %LOG%
  rem /B keeps console hidden, but inherited so PID stays in this cmd family;
  rem a second cmd /C layer makes the process truly detached from Explorer-less shutdown.
  start "PFD-Editor-Server" /B cmd /c ""%NODE_EXE%" "%CD%\server.js" > "%LOG%" 2> "%ERR%""
) else if defined PY_EXE (
  echo [start] runtime: Python static server (no /api proxy)
  echo [start] log:    %LOG%
  start "PFD-Editor-Server" /B cmd /c "cd /d "%CD%" && "%PY_EXE%" -m http.server %PORT% --bind 127.0.0.1 > "%LOG%" 2> "%ERR%""
) else (
  echo [start] no Node/Python found, opening editor.html instead.
  echo [start] note: project library / realtime data need the server.
  start "" "%CD%\editor.html"
  echo [start] press any key to close.
  pause >nul
  exit /b 0
)

rem ---- 4. wait for the port to bind ----
echo [start] waiting for :%PORT% to bind ...
set /a n=0
:wait
  set /a n+=1
  if %n% gtr 40 (
    echo [start] server did not bind in 20s. See log:
    type "%LOG%" 2>nul
    echo.
    type "%ERR%" 2>nul
    echo [start] press any key to close.
    pause >nul
    exit /b 1
  )
  netstat -ano | findstr /C:":%PORT% " | findstr LISTENING >nul
  if not errorlevel 1 goto ready
  ping -n 1 127.0.0.1 >nul
  goto wait
:ready

echo [start] server is up.
type "%LOG%"

rem ---- 5. open browser ----
echo [start] opening default browser: %URL%
start "" "%URL%"

echo ============================================================
echo  Server running. Close this window does NOT stop the server.
echo  Use stop.cmd (or taskkill /F /IM node.exe) to stop it.
echo ============================================================
endlocal
