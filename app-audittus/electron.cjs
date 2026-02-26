const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Mantém a janela invisível até carregar tudo
    autoHideMenuBar: true, // Esconde o menu superior do Windows (Arquivo, Editar, etc) para visual profissional
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // =========================================================
  // CARREGAMENTO DA TELA (VITE OU COMPILADO)
  // =========================================================
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Só mostra a tela quando ela estiver 100% carregada, evitando tela branca
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // =========================================================
  // INTELIGÊNCIA DE ATUALIZAÇÃO AUTOMÁTICA
  // =========================================================
  
  // 1. Assim que a tela terminar de carregar, o Cérebro checa o GitHub em silêncio
  mainWindow.webContents.once('did-finish-load', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  // 2. A PONTE: Se o GitHub disser que tem versão nova, ele injeta o sinal no React!
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.executeJavaScript('if(window.triggerUpdateModal) window.triggerUpdateModal();');
  });

  // 3. Fica ouvindo quando o .exe novo termina de baixar no fundo
  autoUpdater.on('update-downloaded', () => {
    console.log('Atualização baixada e pronta para instalação.');
  });
}

// Inicializa o aplicativo
app.whenReady().then(createWindow);

// =========================================================
// ESCUTAS DO REACT
// =========================================================

// Quando o usuário clicar no botão azul "Instalar Atualização" na tela do sistema
ipcMain.on('iniciar_atualizacao', () => {
  // O comando abaixo força o fechamento do sistema e instala a atualização na hora
  autoUpdater.quitAndInstall(false, true); 
});

// Fecha o aplicativo se todas as janelas forem fechadas (padrão Windows)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});