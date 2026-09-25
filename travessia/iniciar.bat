@echo off
chcp 65001 >nul
title Travessia - servidor local
cd /d "%~dp0"
set PORT=8080

echo.
echo   Travessia - atlas navegavel da historia do Brasil
echo   Abrindo em http://localhost:%PORT%
echo   Para encerrar, feche esta janela ou pressione Ctrl+C.
echo.

rem Abre o navegador depois de 2 segundos, dando tempo do servidor subir
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:%PORT%"

where node >nul 2>nul
if %errorlevel%==0 goto node

where python >nul 2>nul
if %errorlevel%==0 goto python

where py >nul 2>nul
if %errorlevel%==0 goto py

echo   Nao encontrei Node.js nem Python neste computador.
echo   Instale um deles e rode este arquivo de novo:
echo     Node.js: https://nodejs.org
echo     Python:  https://www.python.org/downloads/
echo.
pause
goto :eof

:node
call npx --yes http-server . -p %PORT% -c-1
goto end

:python
python -m http.server %PORT%
goto end

:py
py -m http.server %PORT%
goto end

:end
echo.
echo   O servidor parou. Se a porta %PORT% estiver ocupada, edite PORT neste arquivo.
pause
