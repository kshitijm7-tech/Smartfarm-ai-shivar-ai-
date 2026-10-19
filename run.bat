@echo off
echo ==========================================
echo   Smart Farm AI - Full System Startup
echo ==========================================
echo.

echo [1/3] Starting Backend Server...
echo Checking Python dependencies...
python -m pip install -r backend/requirements.txt
echo Initializing Database...
python backend/database.py
echo Starting Flask Server (port 5000)...
start "Smart Farm AI Backend" cmd /k "python backend/app.py"

echo.
echo [2/3] Starting Frontend Server...
echo Checking Node dependencies...
call npm install

echo.
echo [3/3] Launching Application...
echo Starting development server and opening browser...
start "Smart Farm AI Frontend" cmd /k "npm run dev -- --open"

echo.
echo ==========================================
echo Smart Farm AI is now running!
echo - Backend window is running Flask
echo - Frontend window is running Vite
echo Close those command windows when you want to stop the servers.
echo ==========================================
pause
