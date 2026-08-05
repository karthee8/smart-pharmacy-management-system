
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: 'Smart Pharmacy Management System',
        icon: path.join(__dirname, 'frontend', 'assets', 'icon.png'), // Will fallback to default if missing
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Remove the default menu bar
    mainWindow.setMenuBarVisibility(false);

    // Load the frontend UI
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startPythonBackend() {
    // Determine path to backend based on current dir
    const backendPath = path.join(__dirname, 'backend', 'app.py');
    
    // Spawn the Python process silently
    pythonProcess = spawn('py', [backendPath], {
        detached: false,
        cwd: path.join(__dirname, 'backend')
    });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Backend stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Backend stderr: ${data}`);
    });

    pythonProcess.on('error', (err) => {
        console.error('Failed to start python backend:', err);
    });

    pythonProcess.on('exit', (code) => {
        console.log(`Backend exited with code ${code}`);
    });
}

app.on('ready', () => {
    startPythonBackend();
    
    // Give Python a tiny bit of time to boot up the server before loading UI
    setTimeout(() => {
        createWindow();
    }, 1000);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // Kill the python background process when the app closes
    if (pythonProcess) {
        pythonProcess.kill('SIGINT');
    }
});

