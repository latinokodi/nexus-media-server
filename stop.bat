@echo off
chcp 65001 >nul
title Deteniendo Nexus Svelte...
echo =========================================
echo   Deteniendo Nexus Media Server - Svelte
echo =========================================
echo.
echo Cerrando procesos en puerto 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do (
    echo Terminando proceso %%a...
    taskkill /PID %%a /F 2>nul
)
echo.
echo Listo. Todos los procesos del frontend Svelte han sido detenidos.
pause
