@echo off
set /p SRV=Path to the server folder (e.g. C:\minecraft-server): 
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update-stats.ps1" -Server "%SRV%"
pause
