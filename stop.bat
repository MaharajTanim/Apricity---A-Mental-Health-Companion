@echo off
echo Stopping all Apricity services...

taskkill /F /IM node.exe 2>nul
taskkill /F /FI "WINDOWTITLE eq ML Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Backend*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Frontend*" 2>nul

echo.
echo All services stopped.
pause
