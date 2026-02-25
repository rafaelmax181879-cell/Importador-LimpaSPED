const { app, BrowserWindow, dialog, ipcMain } = require('electron'); // <-- ipcMain adicionado
const path = require('path');
const { autoUpdater } = require('electron-updater');

// 1. Desativa o download automático para o sistema só baixar se o usuário clicar em "Atualizar Agora"
autoUpdater.autoDownload = false;

function createWindow() {
  const splash = new BrowserWindow({
    width: 550,
    height: 350,
    transparent: true,
    frame: false, 
    alwaysOnTop: true,
    resizable: false,
    icon: path.join(__dirname, 'unnamed.ico')
  });

  splash.loadFile(path.join(__dirname, 'dist', 'splash.html'));

  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    show: false, 
    autoHideMenuBar: true, 
    title: "Corretor Inteligente - SPED Fiscal",
    icon: path.join(__dirname, 'unnamed.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // <-- IMPORTANTE: Permite que o React consiga usar o comando require('electron')
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  setTimeout(() => {
    splash.close(); 
    mainWindow.show(); 
    mainWindow.maximize(); 
    
    // Procura atualizações silenciosamente lá no GitHub assim que a tela principal abre
    autoUpdater.checkForUpdates();
  }, 7500);

  // =========================================================
  // PONTE DE INTELIGÊNCIA: ELECTRON <-> REACT
  // =========================================================

  // 2. Achou versão nova no GitHub? Manda um "sinal" para o React abrir o Modal na tela!
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.executeJavaScript(`if(window.triggerUpdateModal) window.triggerUpdateModal();`);
  });

  // 3. Ouve o clique do botão "Atualizar Agora" vindo do React e inicia o download real
  ipcMain.on('iniciar_atualizacao', () => {
    autoUpdater.downloadUpdate(); 
  });

  // 4. Download concluiu em 100%? Fecha o sistema e abre a versão nova curada!
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});