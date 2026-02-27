const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// DESLIGA A INSTALAÇÃO AUTOMÁTICA AO FECHAR O SISTEMA
autoUpdater.autoInstallOnAppQuit = false;

let mainWindow;
let splashWindow;

function createWindow() {
  // =========================================================
  // 1. A TELA DE ABERTURA SEPARADA (SPLASH SCREEN NATIVA)
  // =========================================================
  splashWindow = new BrowserWindow({
    width: 500,
    height: 320,
    transparent: true, 
    frame: false,      
    alwaysOnTop: true, 
    show: true
  });

  // ATENÇÃO AQUI: Na linha do "animation: load 5s", o 5s significa 5 SEGUNDOS. 
  // Se quiser aumentar para 7 segundos, mude para 7s.
  const splashHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #1e293b; color: #fff; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden; border-radius: 12px; border: 1px solid #334155; }
        h1 { font-size: 26px; margin: 0 0 10px 0; font-weight: 900; letter-spacing: 1px; }
        h3 { color: #38bdf8; font-size: 13px; margin: 0 0 35px 0; font-weight: 400; letter-spacing: 3px; }
        .progress-container { width: 80%; height: 4px; background-color: #334155; border-radius: 2px; overflow: hidden; margin-bottom: 15px; }
        
        /* TEMPO DA BARRINHA DE PROGRESSO (5s = 5 Segundos) */
        .progress-bar { width: 0%; height: 100%; background-color: #06b6d4; animation: load 5s linear forwards; }
        
        p { color: #94a3b8; font-size: 12px; margin: 0 0 20px 0; }
        .version { color: #38bdf8; font-size: 12px; font-weight: bold; margin: 0; }
        @keyframes load { 0% { width: 0%; } 100% { width: 100%; } }
      </style>
    </head>
    <body>
      <h1>CORRETOR INTELIGENTE</h1>
      <h3>SPED FISCAL</h3>
      <div class="progress-container"><div class="progress-bar"></div></div>
      <p>Carregando módulos de auditoria...</p>
      <p class="version">Versão 1.1.27</p>
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
  // 3. A MÁGICA DA TROCA DE TELAS
  // =========================================================
  mainWindow.once('ready-to-show', () => {
    
    // TEMPO DO CRONÔMETRO INTERNO (5000 = 5 Segundos)
    // Se mudou o tempo lá em cima, mude aqui também multiplicando por 1000.
    setTimeout(() => {
      splashWindow.close(); // Destrói a janelinha
      mainWindow.maximize(); // Força o Widescreen Profissional ocupando a tela toda
      mainWindow.show();     // Mostra o sistema

      // Assim que o sistema abre, ele já liga o radar do GitHub em silêncio
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000); 
  });

  // =========================================================
  // 4. ESCUTA DO RADAR DE ATUALIZAÇÃO
  // =========================================================
  autoUpdater.on('update-available', () => {
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