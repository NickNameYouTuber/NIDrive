@echo off
echo Starting File Storage Test Environment...

REM Set the current directory to the script location
cd /d "%~dp0"

REM Check for MongoDB
echo Checking MongoDB status...
where mongod >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo WARNING: MongoDB not found in PATH. Continuing without MongoDB.
    echo The application may not work correctly without a database.
    echo.
    echo You can install MongoDB from: https://www.mongodb.com/try/download/community
) ELSE (
    REM Check if MongoDB is already running
    netstat -an | findstr ":27017" >nul
    IF %ERRORLEVEL% EQU 0 (
        echo MongoDB is already running on port 27017.
    ) ELSE (
        echo Starting MongoDB...
        start "MongoDB" mongod
        echo Waiting for MongoDB to initialize...
        timeout /t 3 /nobreak >nul
    )
)

REM Verify file_storage_service directory exists
IF NOT EXIST "file_storage_service" (
    echo ERROR: file_storage_service directory not found.
    echo Current directory: %CD%
    echo Please run this script from the NIDrive root directory.
    goto :error
)

REM Verify file-storage-frontend directory exists
IF NOT EXIST "file-storage-frontend" (
    echo ERROR: file-storage-frontend directory not found.
    echo Current directory: %CD%
    echo Please run this script from the NIDrive root directory.
    goto :error
)

REM Start the file storage service backend
echo Starting File Storage Service...
start "File Storage Backend" cmd /k "cd /d "%~dp0file_storage_service" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Check if frontend has node_modules installed
IF NOT EXIST "file-storage-frontend\node_modules" (
    echo Frontend dependencies not found. Installing packages...
    cd file-storage-frontend
    call npm install
    cd ..
)

REM Start the frontend
echo Starting Frontend...
start "File Storage Frontend" cmd /k "cd /d "%~dp0file-storage-frontend" && npm start"

echo.
echo Test Environment Started!
echo.
echo Backend API: http://localhost:8000
echo Frontend UI: http://localhost:3000
echo.
echo Press any key to close all services and this window...
pause >nul

REM Clean up when closing
taskkill /FI "WINDOWTITLE eq File Storage Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq File Storage Frontend" /F >nul 2>&1
echo Services stopped.
goto :end

:error
echo.
echo Error starting services.
pause >nul

:end
