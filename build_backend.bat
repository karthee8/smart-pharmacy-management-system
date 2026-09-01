@echo off
echo ============================================
echo   Building Smart Pharmacy Backend (.exe)
echo ============================================
echo.

cd /d "%~dp0backend"

echo [1/3] Running PyInstaller...
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
    --hidden-import=xlsxwriter ^
    --hidden-import=qrcode ^
    --hidden-import=PIL ^
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

echo.
echo [2/3] Copying .env to output...
copy /Y ".env" "dist\SmartPharmacyBackend\.env" >nul

echo.
echo [3/3] Creating data directory...
if not exist "dist\SmartPharmacyBackend\data" mkdir "dist\SmartPharmacyBackend\data"

echo.
echo ============================================
echo   Backend build complete!
echo   Output: backend\dist\SmartPharmacyBackend\
echo ============================================
echo.
pause
