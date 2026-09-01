
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');

let mainWindow;
let splashWindow;
let pythonProcess;

const BACKEND_PORT = 5000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const HEALTH_CHECK_INTERVAL = 50; // ms (poll every 50ms for ultra-fast startup)
const MAX_WAIT_TIME = 60000; // 60 seconds max wait for slower PC/Antivirus scan

function getBackendPath() {
    const isPackaged = !process.defaultApp;
    
    if (isPackaged) {
        // In packaged Electron app: backend-dist is next to the exe
        const backendExe = path.join(path.dirname(process.execPath), 'backend-dist', 'SmartPharmacyBackend', 'SmartPharmacyBackend.exe');
        if (require('fs').existsSync(backendExe)) {
            return { exe: backendExe, cwd: path.dirname(backendExe), type: 'exe' };
        }
    }
    
    // Development: try compiled exe first, then fall back to Python script
    const devExe = path.join(__dirname, 'backend', 'dist', 'SmartPharmacyBackend', 'SmartPharmacyBackend.exe');
    if (require('fs').existsSync(devExe)) {
        return { exe: devExe, cwd: path.dirname(devExe), type: 'exe' };
    }
    
    // Fallback: raw Python (for development only)
    return { exe: 'python', args: ['app.py'], cwd: path.join(__dirname, 'backend'), type: 'python' };
}

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 480,
        height: 360,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    const splashHTML = `
    <html>
    <head><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            display: flex; align-items: center; justify-content: center;
            width: 100vw; height: 100vh;
            background: transparent;
            font-family: 'Segoe UI', sans-serif;
            -webkit-app-region: drag;
            user-select: none;
        }
        .card {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            border-radius: 24px;
            padding: 48px 40px;
            text-align: center;
            box-shadow: 0 25px 60px rgba(0,0,0,0.6);
            border: 1px solid rgba(56, 189, 248, 0.2);
            width: 440px;
        }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { color: #f8fafc; font-size: 22px; font-weight: 600; margin-bottom: 8px; }
        p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
        .loader {
            width: 200px; height: 4px; background: rgba(255,255,255,0.1);
            border-radius: 4px; margin: 0 auto; overflow: hidden;
        }
        .loader-bar {
            width: 40%; height: 100%;
            background: linear-gradient(90deg, #0ea5e9, #10b981, #0ea5e9);
            border-radius: 4px;
            animation: slide 1.2s ease-in-out infinite;
        }
        @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
        }
        .status { color: #64748b; font-size: 12px; margin-top: 16px; }
    </style></head>
    <body>
        <div class="card">
            <div class="icon">🏥</div>
            <h1>Smart Pharmacy</h1>
            <p>Starting backend server...</p>
            <div class="loader"><div class="loader-bar"></div></div>
            <div class="status" id="status">Initializing...</div>
        </div>
    </body>
    </html>`;

    splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHTML));
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        title: 'Smart Pharmacy Management System',
        icon: path.join(__dirname, 'frontend', 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));

    mainWindow.once('ready-to-show', () => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
            splashWindow = null;
        }
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function checkBackendHealth() {
    return new Promise((resolve) => {
        const req = http.get(`${BACKEND_URL}/api/login`, { timeout: 1000 }, (res) => {
            resolve(true);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
    });
}

function waitForBackend() {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const poll = async () => {
            const isReady = await checkBackendHealth();
            if (isReady) {
                console.log(`Backend ready in ${Date.now() - startTime}ms`);
                resolve();
                return;
            }
            
            if (Date.now() - startTime > MAX_WAIT_TIME) {
                reject(new Error('Backend failed to start within 60 seconds'));
                return;
            }
            
            setTimeout(poll, HEALTH_CHECK_INTERVAL);
        };
        
        poll();
    });
}

function startPythonBackend() {
    // Kill any orphan/zombie backend process holding port 5000
    try {
        if (process.platform === 'win32') {
            execSync('taskkill /F /IM SmartPharmacyBackend.exe /T', { windowsHide: true, stdio: 'ignore' });
        }
    } catch (e) {
        // Ignore if no process was running
    }

    const backend = getBackendPath();
    console.log(`Starting backend: ${backend.type} — ${backend.exe}`);

    if (backend.type === 'exe') {
        pythonProcess = spawn(backend.exe, [], {
            cwd: backend.cwd,
            windowsHide: true,
            stdio: ['pipe', 'pipe', 'pipe']
        });
    } else {
        // Python fallback for development
        const pythonCmds = ['python', 'py', 'python3'];
        let cmdIndex = 0;
        
        function tryPython() {
            if (cmdIndex >= pythonCmds.length) {
                console.error('Could not start Python backend');
                return;
            }
            const cmd = pythonCmds[cmdIndex];
            console.log(`Trying: ${cmd}`);
            
            pythonProcess = spawn(cmd, backend.args, {
                cwd: backend.cwd,
                windowsHide: true,
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            pythonProcess.on('error', () => {
                cmdIndex++;
                tryPython();
            });
        }
        tryPython();
    }

    if (pythonProcess) {
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Backend: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Backend err: ${data}`);
        });

        pythonProcess.on('exit', (code) => {
            console.log(`Backend exited with code ${code}`);
        });
    }
}

function killBackend() {
    if (pythonProcess) {
        try {
            // On Windows, child processes spawned by the exe may not die with just kill()
            // Use taskkill to forcefully terminate the process tree
            if (process.platform === 'win32' && pythonProcess.pid) {
                try {
                    execSync(`taskkill /PID ${pythonProcess.pid} /T /F`, { windowsHide: true, stdio: 'ignore' });
                } catch (e) {
                    // Process may have already exited
                }
            } else {
                pythonProcess.kill('SIGTERM');
            }
        } catch (e) {
            console.error('Error killing backend:', e);
        }
        pythonProcess = null;
    }
}



app.on('ready', async () => {
    createSplashWindow();
    startPythonBackend();
    // Pre-load mainWindow in the background while splash is visible
    createMainWindow();

    try {
        await waitForBackend();
    } catch (err) {
        console.error('Backend startup failed:', err);
    }

    // Immediately reveal main window as soon as backend is ready
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
    }
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    killBackend();
});

app.on('before-quit', () => {
    killBackend();
});
