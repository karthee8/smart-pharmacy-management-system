@echo off
echo ============================================================
echo   Smart Pharmacy — Full Portable Build
echo   Creates a pendrive-ready app (no Python/Node required)
echo ============================================================
echo.

cd /d "%~dp0"

echo ============================================
echo  STEP 1: Building Python Backend (.exe)
echo ============================================
echo.

cd backend

echo Running PyInstaller...
pyinstaller --noconfirm --onedir --console ^
    --name SmartPharmacyBackend ^
    --add-data ".env;." ^
    --hidden-import=flask ^
    --hidden-import=flask_cors ^
    --hidden-import=flask_sqlalchemy ^
    --hidden-import=flask_jwt_extended ^
    --hidden-import=werkzeug ^
    --hidden-import=werkzeug.security ^
    --hidden-import=dotenv ^
    --hidden-import=reportlab ^
    --hidden-import=reportlab.lib ^
    --hidden-import=reportlab.lib.colors ^
    --hidden-import=reportlab.lib.pagesizes ^
    --hidden-import=reportlab.platypus ^
    --hidden-import=reportlab.lib.styles ^
    --hidden-import=reportlab.lib.units ^
    --hidden-import=reportlab.lib.enums ^
    --hidden-import=reportlab.pdfgen ^
    --hidden-import=reportlab.pdfbase ^
    --hidden-import=reportlab.pdfbase.pdfmetrics ^
    --hidden-import=reportlab.pdfbase.ttfonts ^
    --hidden-import=xlsxwriter ^
    --hidden-import=qrcode ^
    --hidden-import=PIL ^
    --hidden-import=PIL.Image ^
    --hidden-import=google.genai ^
    --hidden-import=google.genai.types ^
    --hidden-import=sqlalchemy.dialects.sqlite ^
    --collect-submodules google.genai ^
    --collect-submodules reportlab ^
    app.py

if errorlevel 1 (
    echo.
    echo [ERROR] PyInstaller build failed!
    pause
    exit /b 1
)

echo Copying .env to output...
copy /Y ".env" "dist\SmartPharmacyBackend\.env" >nul

echo Creating data directory...
if not exist "dist\SmartPharmacyBackend\data" mkdir "dist\SmartPharmacyBackend\data"

cd /d "%~dp0"

echo.
echo ============================================
echo  STEP 2: Building Electron App
echo ============================================
echo.

call npx electron-builder --win --dir

if errorlevel 1 (
    echo.
    echo [ERROR] Electron build failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  BUILD COMPLETE!
echo.
echo  Portable app is ready at:
echo    dist\win-unpacked\
echo.
echo  To use on a pendrive:
echo    1. Copy the entire 'win-unpacked' folder to your pendrive
echo    2. Double-click 'Smart Pharmacy Management System.exe'
echo    3. No installation or Python needed!
echo ============================================================
echo.
pause
