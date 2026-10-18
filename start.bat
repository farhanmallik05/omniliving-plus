@echo off
echo ================================================================
echo 🌟 OmniLiving+ One-Click Demo Launcher
echo ================================================================
echo.
echo Installing dependencies if needed...
call npm run install:all
echo.
echo Launching MCP Server and Alexa+ Web Simulator...
call npm start
