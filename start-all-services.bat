@echo off
echo Starting NIDrive Services...

REM Set console title
title NIDrive Services

REM Check if MongoDB is running
echo Checking MongoDB status...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo MongoDB is not installed or not in PATH.
    echo Please make sure MongoDB is installed and available in your PATH.
    goto :error
)

REM Start MongoDB if not already running
netstat -an | find "27017" >nul
if %errorlevel% neq 0 (
    echo Starting MongoDB...
    start "MongoDB" mongod
    timeout /t 5 /nobreak >nul
) else (
    echo MongoDB is already running.
)

REM Start the backend file storage service
echo Starting File Storage Service API...
cd /d %~dp0file_storage_service
start "File Storage Service" cmd /c "python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait for the backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start the frontend
echo Starting React Frontend...
cd /d %~dp0file-storage-frontend
start "React Frontend" cmd /c "npm start"

echo.
echo All services started!
echo.
echo File Storage Service API: http://localhost:8000
echo React Frontend: http://localhost:3000
echo.
echo Press any key to stop all services and close this window.
echo.
pause >nul

REM Clean up when done
taskkill /FI "WINDOWTITLE eq File Storage Service" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq React Frontend" /F >nul 2>&1
echo All services stopped.
goto :end

:error
echo.
echo Error starting services.
pause >nul

:end
exit
