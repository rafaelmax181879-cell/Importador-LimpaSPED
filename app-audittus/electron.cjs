const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater'); // O motor de atualização

function createWindow() {
  const splash = new BrowserWindow({
    width: 550,
    height: 350,
    transparent: true,
    frame: false, 
    alwaysOnTop: true,
    resizable: false
  });

  splash.loadFile(path.join(__dirname, 'dist', 'splash.html'));

  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    show: false, 
    autoHideMenuBar: true, 
    title: "Corretor Inteligente - SPED Fiscal",
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  setTimeout(() => {
    splash.close(); 
    mainWindow.show(); 
    mainWindow.maximize(); 
    
    // Procura atualizações silenciosamente
    autoUpdater.checkForUpdatesAndNotify();
  }, 7500);
}

app.whenReady().then(createWindow);
autoUpdater.checkForUpdatesAndNotify();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Avisa o usuário quando a atualização for baixada
autoUpdater.on('update-downloaded', () => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Reiniciar e Atualizar', 'Mais tarde'],
    title: 'Atualização do Sistema',
    message: 'Uma nova versão do Corretor Inteligente foi baixada.',
    detail: 'O sistema precisa ser reiniciado para instalar a atualização. Deseja fazer isso agora?'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});