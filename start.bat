@echo off
chcp 65001 >nul
title Nexus Media - Svelte (Vite)
echo =========================================
echo   Nexus Media Server - Svelte Frontend
echo =========================================
echo.
echo Iniciando servidor de desarrollo Vite + Svelte...
echo El frontend estara disponible en: http://localhost:5173
echo API backend esperado en: http://localhost:3001
echo.
cd /d "%~dp0"
start "Nexus Svelte" cmd /c "npm run dev"
echo.
echo Servidor iniciado en una ventana separada.
echo Para detenerlo, cierra la ventana o ejecuta stop.bat
echo.
pause
