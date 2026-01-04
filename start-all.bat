@echo off
title AISLA - Start All Services
echo.
echo =====================================================
echo   AISLA - AI Self-Learning Lab Assistant
echo   Starting all services...
echo =====================================================
echo.

:: Start the server in a new window
echo [1/2] Starting Server (Port 5000)...
start "AISLA Server" cmd /k "cd /d %~dp0server && npm run dev"

:: Wait a moment for server to initialize
timeout /t 3 /nobreak > nul

:: Start the client in a new window
echo [2/2] Starting Client (React App)...
start "AISLA Client" cmd /k "cd /d %~dp0client && npm start"

echo.
echo =====================================================
echo   All services started successfully!
echo =====================================================
echo.
echo   Server: http://localhost:5000
echo   Client: http://localhost:3000
echo.
echo   Press any key to close this window...
echo   (The server and client will continue running)
echo =====================================================
pause > nul
