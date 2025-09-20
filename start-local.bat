@echo off
echo Starting Movie Finder App Locally...
echo.

echo Starting Flask Backend Server...
start "Flask Backend" cmd /k "cd api && python recommend.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting React Frontend Server...
start "React Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul