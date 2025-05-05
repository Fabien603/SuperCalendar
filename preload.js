const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Convertir les fonctions fs en promesses
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Exposer les fonctionnalités spécifiques à l'application au processus de rendu
contextBridge.exposeInMainWorld('electronAPI', {
  // Gestion des données du calendrier
  getCalendarData: () => ipcRenderer.invoke('get-calendar-data'),
  saveCalendarData: (data) => ipcRenderer.invoke('save-calendar-data', data),
  
  // Gestion des préférences
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  savePreferences: (preferences) => ipcRenderer.invoke('save-preferences', preferences),
  
  // Écouteurs d'événements pour les actions du menu
  onNewCalendar: (callback) => ipcRenderer.on('menu-new-calendar', callback),
  onImportFile: (callback) => ipcRenderer.on('menu-import-file', callback),
  onExportFile: (callback) => ipcRenderer.on('menu-export-file', callback),
  onOpenPreferences: (callback) => ipcRenderer.on('menu-open-preferences', callback),
  // Nouvelle fonction pour quitter l'application
  quitApp: () => ipcRenderer.invoke('quit-app'),

  // Écouteurs pour les changements de vue
  onViewYearly: (callback) => ipcRenderer.on('menu-view-yearly', callback),
  onViewMonthly: (callback) => ipcRenderer.on('menu-view-monthly', callback),
  onViewWeekly: (callback) => ipcRenderer.on('menu-view-weekly', callback),
  onViewDaily: (callback) => ipcRenderer.on('menu-view-daily', callback),
  onViewToday: (callback) => ipcRenderer.on('menu-view-today', callback),
  
  // Fonctions de gestion de fichiers
  fileSystem: {
    readFile: async (filePath, options = {}) => {
      try {
        return await readFile(filePath, options);
      } catch (error) {
        console.error('Erreur de lecture du fichier:', error);
        throw error;
      }
    },
    
    writeFile: async (filePath, data, options = {}) => {
      try {
        await writeFile(filePath, data, options);
        return true;
      } catch (error) {
        console.error('Erreur d\'écriture du fichier:', error);
        throw error;
      }
    },
    
    getPath: (fileName) => {
      return path.join(process.cwd(), fileName);
    },
    
    parseJSON: (content) => {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error('Erreur de parsing JSON:', error);
        throw error;
      }
    },
    
    // Fonction utilitaire pour l'importation/exportation
    importCalendarFile: async (filePath) => {
      try {
        const content = await readFile(filePath, 'utf8');
        const extension = path.extname(filePath).toLowerCase();
        
        if (extension === '.json') {
          return JSON.parse(content);
        } else if (extension === '.ics') {
          // Ici, nous aurions besoin d'une bibliothèque pour parser le format iCal
          // À implémenter plus tard
          throw new Error('Format iCal non encore supporté');
        } else {
          throw new Error('Format de fichier non supporté');
        }
      } catch (error) {
        console.error('Erreur d\'importation:', error);
        throw error;
      }
    }
  }
});

// Informations système
contextBridge.exposeInMainWorld('systemInfo', {
  platform: process.platform,
  appVersion: process.env.npm_package_version
});