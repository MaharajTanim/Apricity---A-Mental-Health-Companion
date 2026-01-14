@echo off
echo ========================================
echo    Starting Apricity Application
echo ========================================
echo.

echo [1/3] Starting ML Service (Port 8000)...
start "ML Service" cmd /k "cd /d C:\Apricity\ml_service && python -m uvicorn predict_server:app --host 0.0.0.0 --port 8000"

timeout /t 5 /nobreak > nul

echo [2/3] Starting Backend (Port 5000)...
start "Backend" cmd /k "cd /d C:\Apricity\backend && npm start"

timeout /t 3 /nobreak > nul

echo [3/3] Starting Frontend (Port 3000)...
start "Frontend" cmd /k "cd /d C:\Apricity\frontend && npm run dev"

timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo    All services started!
echo ========================================
echo.
echo    Frontend:   http://localhost:3000
echo    Backend:    http://localhost:5000
echo    ML Service: http://localhost:8000
echo.
echo    Opening browser...
start http://localhost:3000

pause
