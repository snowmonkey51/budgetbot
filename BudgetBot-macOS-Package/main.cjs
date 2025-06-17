const { app, BrowserWindow, Menu } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'hiddenInset'
  });

  createMenu();

  // Connect directly to your live BudgetBot for fast performance
  const replicodeUrl = 'https://e286f078-dea3-4595-baaf-ef1a050f4137-00-2a8svkr6avg0t.spock.replit.dev';
  mainWindow.loadURL(replicodeUrl);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

function createMenu() {
  const template = [
    {
      label: 'BudgetBot',
      submenu: [
        { label: 'About BudgetBot', role: 'about' },
        { type: 'separator' },
        { label: 'Hide BudgetBot', accelerator: 'Cmd+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Cmd+Alt+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Cmd+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Budget',
      submenu: [
        {
          label: 'First Half',
          accelerator: 'Cmd+1',
          click: () => mainWindow.webContents.executeJavaScript("window.location.hash = '/'")
        },
        {
          label: 'Second Half', 
          accelerator: 'Cmd+2',
          click: () => mainWindow.webContents.executeJavaScript("window.location.hash = '/second-half'")
        },
        {
          label: 'Planning',
          accelerator: 'Cmd+3', 
          click: () => mainWindow.webContents.executeJavaScript("window.location.hash = '/planning'")
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'Cmd+R', click: () => mainWindow.reload() },
        { label: 'Toggle DevTools', accelerator: 'Alt+Cmd+I', click: () => mainWindow.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'Cmd+Plus', role: 'zoomin' },
        { label: 'Zoom Out', accelerator: 'Cmd+-', role: 'zoomout' },
        { label: 'Reset Zoom', accelerator: 'Cmd+0', role: 'resetzoom' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});