@echo off
setlocal
cd /d "%~dp0smart_kiosk"
echo 🚀 Starting Smart Kiosk AI Server...
echo 📍 Access it at: http://127.0.0.1:5000
echo ------------------------------------------
..\.venv\Scripts\python.exe server.py
if %ERRORLEVEL% neq 0 (
    echo ❌ Server failed to start.
    pause
)
endlocal
