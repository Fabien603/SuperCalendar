const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configuration du système de log
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Configuration du stockage des données
const store = new Store({
  name: 'supercalendrier-data',
  fileExtension: 'json'
});

// Variable qui stockera la fenêtre principale
let mainWindow;

// Création de la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, 'build/icons/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Masquer la barre de menu
  mainWindow.setMenuBarVisibility(false);

  // Chargement du fichier HTML de l'application
  mainWindow.loadFile(path.join(__dirname, 'app/index.html'));

  // Affichage de la fenêtre une fois chargée
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Vérification des mises à jour (en production uniquement)
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  // Gestion de la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Création du menu de l'application
  createMenu();
}

// Création du menu de l'application
function createMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouveau calendrier',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-new-calendar');
            }
          }
        },
        {
          label: 'Importer...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog({
              properties: ['openFile'],
              filters: [
                { name: 'Fichiers JSON', extensions: ['json'] },
                { name: 'Fichiers iCal', extensions: ['ics'] },
                { name: 'Tous les fichiers', extensions: ['*'] }
              ]
            });
            
            if (filePaths && filePaths.length > 0) {
              mainWindow.webContents.send('menu-import-file', filePaths[0]);
            }
          }
        },
        {
          label: 'Exporter...',
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog({
              title: 'Exporter le calendrier',
              filters: [
                { name: 'Fichiers JSON', extensions: ['json'] },
                { name: 'Fichiers iCal', extensions: ['ics'] }
              ]
            });
            
            if (filePath) {
              mainWindow.webContents.send('menu-export-file', filePath);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Imprimer...',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.print({
                silent: false,
                printBackground: true,
                deviceName: ''
              });
            }
          }
        },
        {
          label: 'Exporter en PDF...',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog({
              title: 'Exporter en PDF',
              defaultPath: 'calendrier.pdf',
              filters: [{ name: 'Fichiers PDF', extensions: ['pdf'] }]
            });
            
            if (filePath) {
              const data = await mainWindow.webContents.printToPDF({
                printBackground: true,
                landscape: false,
                pageSize: 'A4'
              });
              
              fs.writeFile(filePath, data, (error) => {
                if (error) {
                  log.error('Erreur lors de l\'export PDF', error);
                  dialog.showErrorBox('Erreur d\'exportation', 'Impossible d\'exporter le PDF.');
                }
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Préférences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-open-preferences');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edition',
      submenu: [
        { label: 'Annuler', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Rétablir', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Couper', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copier', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Coller', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Tout sélectionner', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Vue annuelle',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-view-yearly');
            }
          }
        },
        {
          label: 'Vue mensuelle',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-view-monthly');
            }
          }
        },
        {
          label: 'Vue hebdomadaire',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-view-weekly');
            }
          }
        },
        {
          label: 'Vue quotidienne',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-view-daily');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Aujourd\'hui',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-view-today');
            }
          }
        },
        { type: 'separator' },
        { label: 'Recharger', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Zoom avant', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom arrière', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Taille normale', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Plein écran', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos de SuperCalendrier',
          click: () => {
            dialog.showMessageBox({
              title: 'À propos de SuperCalendrier',
              message: 'SuperCalendrier v1.0.0',
              detail: 'Une application de calendrier moderne et personnalisable.\n\n© 2025 SuperCalendrier'
            });
          }
        },
        {
          label: 'Rechercher des mises à jour...',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Gestion des mises à jour automatiques
autoUpdater.on('update-available', () => {
  log.info('Mise à jour disponible');
  dialog.showMessageBox({
    type: 'info',
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version de SuperCalendrier est disponible. Elle sera téléchargée automatiquement.'
  });
});

autoUpdater.on('update-downloaded', () => {
  log.info('Mise à jour téléchargée');
  dialog.showMessageBox({
    type: 'info',
    title: 'Mise à jour prête',
    message: 'Une mise à jour a été téléchargée. Redémarrez l\'application pour l\'installer.',
    buttons: ['Redémarrer', 'Plus tard'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

// Événements IPC pour la communication entre le processus principal et le renderer
ipcMain.handle('get-calendar-data', () => {
  return store.get('calendarData', {});
});

ipcMain.handle('save-calendar-data', (event, data) => {
  store.set('calendarData', data);
  return true;
});

ipcMain.handle('get-preferences', () => {
  return store.get('preferences', { theme: 'light' });
});

ipcMain.handle('save-preferences', (event, data) => {
  store.set('preferences', data);
  return true;
});

// Événements de l'application Electron
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});