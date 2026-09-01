# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules

hiddenimports = ['flask', 'flask_cors', 'flask_sqlalchemy', 'flask_jwt_extended', 'werkzeug', 'werkzeug.security', 'dotenv', 'reportlab', 'xlsxwriter', 'qrcode', 'PIL', 'google.genai', 'google.genai.types', 'sqlalchemy.dialects.sqlite']
hiddenimports += collect_submodules('google.genai')
hiddenimports += collect_submodules('reportlab')


a = Analysis(
    ['backend\\app.py'],
    pathex=[],
    binaries=[],
    datas=[('.env', '.')],
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='SmartPharmacyBackend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='SmartPharmacyBackend',
)
