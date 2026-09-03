@echo off
title Werkorder Formulier

set "FRONTEND_DIR=C:\Users\Eigenaar\Desktop\Bedrijf Project\werkorder-formulier\frontend"
set "FRONTEND_URL=http://localhost:5173"

REM Controleer of de frontend al draait
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul

if errorlevel 1 (
    REM Frontend draait nog niet
    start "Werkorder Frontend" /min cmd /c "cd /d ""%FRONTEND_DIR%"" && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"

    REM De frontend opent zelf de browser
    exit
)

REM Frontend draait al, open alleen de bestaande website
start "" "%FRONTEND_URL%"

exit