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
  
  mainWindow.loadURL('https://e286f078-dea3-4595-baaf-ef1a050f4137-00-2a8svkr6avg0t.spock.replit.dev');
  
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
        { label: 'Zoom In', accelerator: 'Cmd+Plus', role: 'zoomin' },
        { label: 'Zoom Out', accelerator: 'Cmd+-', role: 'zoomout' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});