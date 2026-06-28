@echo off
chcp 65001 > nul
title Corrigir build Vercel - MN Animat

echo.
echo ============================================================
echo   CORRECAO DO NPM / VERCEL - MN ANIMAT
echo ============================================================
echo.

if not exist package.json (
  echo ERRO: coloque estes arquivos na pasta principal do projeto.
  echo A pasta correta deve conter package.json, src e public.
  pause
  exit /b 1
)

echo [1/5] Removendo package-lock invalido...
if exist package-lock.json del /F /Q package-lock.json

echo [2/5] Removendo node_modules antigo...
if exist node_modules rmdir /S /Q node_modules

echo [3/5] Limpando cache local do npm...
call npm cache clean --force

echo [4/5] Instalando pelo registro publico do npm...
call npm install --no-audit --no-fund --registry=https://registry.npmjs.org
if errorlevel 1 (
  echo.
  echo ERRO: npm install falhou.
  echo Verifique sua conexao e se o Node.js 22 esta instalado.
  pause
  exit /b 1
)

echo [5/5] Testando o build...
call npm run build
if errorlevel 1 (
  echo.
  echo ERRO: o npm instalou, mas o build falhou.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   CORRECAO CONCLUIDA
echo ============================================================
echo.
echo Agora envie estes arquivos pelo GitHub Desktop:
echo   - .npmrc
echo   - vercel.json
echo   - package-lock.json novo
echo.
echo Commit sugerido:
echo   Corrige instalacao npm na Vercel
echo.
pause
