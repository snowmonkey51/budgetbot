const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;
let serverProcess;
const isDev = process.env.NODE_ENV === 'development';
const serverPort = process.env.PORT || 5000;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../assets/budgetbot-icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    titleBarStyle: 'hiddenInset',
    show: false // Don't show until ready
  });

  // Set the application menu
  createMenu();

  // Wait for server to be ready, then load the app
  const serverUrl = `http://localhost:${serverPort}`;
  
  if (isDev) {
    // In development, wait for the dev server
    mainWindow.loadURL(serverUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, start our server and wait for it
    startServer().then(() => {
      mainWindow.loadURL(serverUrl);
    }).catch((error) => {
      console.error('Failed to start server:', error);
      showErrorDialog('Failed to start BudgetBot server', error.message);
    });
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on the window
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== serverUrl) {
      event.preventDefault();
    }
  });
}

function createMenu() {
  const template = [
    {
      label: 'BudgetBot',
      submenu: [
        {
          label: 'About BudgetBot',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About BudgetBot',
              message: 'BudgetBot v1.0.0',
              detail: 'A playful personal budgeting application with robot-themed interface.\n\nBuilt with React, Node.js, and Electron.',
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/settings';
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Hide BudgetBot',
          accelerator: 'Cmd+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Cmd+Alt+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit BudgetBot',
          accelerator: 'Cmd+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Budget',
      submenu: [
        {
          label: 'First Half',
          accelerator: 'Cmd+1',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/';
            `);
          }
        },
        {
          label: 'Second Half',
          accelerator: 'Cmd+2',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/second-half';
            `);
          }
        },
        {
          label: 'Planning',
          accelerator: 'Cmd+3',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/planning';
            `);
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Cmd+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Cmd+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'Cmd+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'Cmd+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'Cmd+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'Cmd+A',
          role: 'selectall'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Cmd+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'Cmd+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Cmd+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'Cmd+0',
          role: 'resetzoom'
        },
        {
          label: 'Zoom In',
          accelerator: 'Cmd+Plus',
          role: 'zoomin'
        },
        {
          label: 'Zoom Out',
          accelerator: 'Cmd+-',
          role: 'zoomout'
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'Ctrl+Cmd+F',
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Cmd+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'Cmd+W',
          role: 'close'
        },
        { type: 'separator' },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: () => {
            shell.openExternal('https://github.com');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverScript = path.join(__dirname, '../dist/index.js');
    
    // Check if the built server exists
    if (!fs.existsSync(serverScript)) {
      reject(new Error('Server build not found. Please run npm run build first.'));
      return;
    }

    // Start the server process
    serverProcess = spawn('node', [serverScript], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: serverPort.toString()
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let serverStarted = false;

    // Handle server output
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output);
      
      if (output.includes('serving on port') && !serverStarted) {
        serverStarted = true;
        // Wait a bit more to ensure server is fully ready
        setTimeout(() => resolve(), 1000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    serverProcess.on('error', (error) => {
      if (!serverStarted) {
        reject(error);
      }
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      if (!serverStarted && code !== 0) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error('Server startup timeout'));
      }
    }, 10000);
  });
}

function showErrorDialog(title, message) {
  dialog.showErrorBox(title, message);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Kill server process
  if (serverProcess) {
    serverProcess.kill();
  }
  
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Kill server process
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});