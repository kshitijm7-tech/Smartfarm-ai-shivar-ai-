@echo off
echo ==========================================
echo   Smart Farm AI - Backend Server
echo ==========================================
echo.
echo Installing/Checking dependencies...
pip install -r backend/requirements.txt
echo.
echo Initializing Database...
python backend/database.py
echo.
echo Starting Flask Server...
python backend/app.py
pause
