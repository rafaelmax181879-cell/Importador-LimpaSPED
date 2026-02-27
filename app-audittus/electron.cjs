const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// DESLIGA A INSTALAÇÃO AUTOMÁTICA AO FECHAR O SISTEMA
autoUpdater.autoInstallOnAppQuit = false; 

let mainWindow;
let splashWindow;

function createWindow() {
  // =========================================================
  // 1. A TELA DE ABERTURA SEPARADA (SPLASH SCREEN 600x420)
  // =========================================================
  splashWindow = new BrowserWindow({
    width: 600,
    height: 420,
    transparent: true, 
    frame: false,      
    alwaysOnTop: true, 
    show: true
  });

  // Pega o caminho absoluto da imagem do SPED para o fundo
  const imagePath = `file://${path.join(__dirname, 'image_d785e2.png').replace(/\\/g, '/')}`;

  const splashHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          margin: 0; padding: 0; 
          color: #fff; 
          font-family: system-ui, sans-serif; 
          display: flex; flex-direction: column; align-items: center; justify-content: center; 
          height: 100vh; overflow: hidden; 
          border-radius: 16px; 
          border: 1px solid rgba(255,255,255,0.1);
          
          /* A MÁGICA: Película Escura + A Imagem do SPED no Fundo */
          background: 
            linear-gradient(rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.95)), 
            url('${imagePath}') center center no-repeat;
          background-size: 50%;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }
        h1 { font-size: 32px; margin: 0 0 10px 0; font-weight: 900; letter-spacing: 2px; text-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        h3 { color: #38bdf8; font-size: 15px; margin: 0 0 50px 0; font-weight: 600; letter-spacing: 4px; }
        
        .progress-container { width: 70%; height: 6px; background-color: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 20px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.3); }
        .progress-bar { width: 0%; height: 100%; background-color: #06b6d4; box-shadow: 0 0 15px #06b6d4; animation: load 5s linear forwards; }
        
        p { color: #cbd5e1; font-size: 14px; margin: 0 0 20px 0; }
        .version { position: absolute; bottom: 20px; color: #38bdf8; font-size: 12px; font-weight: bold; margin: 0; opacity: 0.8; }
        
        @keyframes load { 0% { width: 0%; } 100% { width: 100%; } }
      </style>
    </head>
    <body>
      <h1>CORRETOR INTELIGENTE</h1>
      <h3>SPED FISCAL</h3>
      <div class="progress-container"><div class="progress-bar"></div></div>
      <p>Carregando módulos de auditoria...</p>
      <p class="version">Versão 1.1.31</p>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);

  // =========================================================
  // 2. A TELA DO SISTEMA (CARREGANDO INVISÍVEL NO FUNDO)
  // =========================================================
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Começa invisível!
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // =========================================================
  // 3. A MÁGICA DA TROCA DE TELAS (5 SEGUNDOS)
  // =========================================================
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      splashWindow.close(); 
      mainWindow.maximize(); 
      mainWindow.show();     

      // Inicia a busca por atualizações no GitHub de forma silenciosa
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000); 
  });

  // =========================================================
  // 4. ESCUTA DO RADAR DE ATUALIZAÇÃO (CORRIGIDO PARA O LOOP)
  // =========================================================
  // Só avisa a tela do React DEPOIS que o .exe novo baixar completamente
  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.executeJavaScript('if(window.triggerUpdateModal) window.triggerUpdateModal();');
  });
}

app.whenReady().then(createWindow);

ipcMain.on('iniciar_atualizacao', () => {
  autoUpdater.quitAndInstall(false, true); 
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});