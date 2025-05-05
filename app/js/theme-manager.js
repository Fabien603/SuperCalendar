// Gestionnaire du thème de l'application
export class ThemeManager {
    constructor() {
        // Préférences de thème
        this.preferences = {
            theme: 'dark', // 'light', 'dark', 'system'
            timeFormat: '24h', // '12h', '24h'
            notifications: 'all' // 'all', 'important', 'none'
        };
        
        // Éléments DOM
        this.themeToggle = document.getElementById('theme-toggle');
        this.body = document.body;
    }
    
    // Charger les préférences depuis le stockage
    async loadPreferences() {
        try {
            // Vérifier si l'API Electron est disponible
            if (window.electronAPI) {
                console.log('Chargement des préférences depuis Electron Store');
                
                // Charger les préférences
                const preferences = await window.electronAPI.getPreferences();
                if (preferences) {
                    this.preferences = { ...this.preferences, ...preferences };
                }
            } else {
                console.log('Chargement des préférences depuis le localStorage');
                
                // Fallback vers localStorage si Electron n'est pas disponible
                const savedPreferences = localStorage.getItem('calendarPreferences');
                if (savedPreferences) {
                    this.preferences = { ...this.preferences, ...JSON.parse(savedPreferences) };
                }
            }
            
            // Appliquer le thème
            this.applyTheme();
            
            console.log('Préférences chargées avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement des préférences:', error);
            throw error;
        }
    }
    
    // Sauvegarder les préférences
    async savePreferences() {
        try {
            // Vérifier si l'API Electron est disponible
            if (window.electronAPI) {
                console.log('Sauvegarde des préférences dans Electron Store');
                await window.electronAPI.savePreferences(this.preferences);
            } else {
                console.log('Sauvegarde des préférences dans localStorage');
                localStorage.setItem('calendarPreferences', JSON.stringify(this.preferences));
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des préférences:', error);
            throw error;
        }
    }
    
    // Appliquer le thème actuel
    applyTheme() {
        // Mettre à jour le toggle de thème
        if (this.themeToggle) {
            if (this.preferences.theme === 'dark' || 
                (this.preferences.theme === 'system' && this.isSystemDarkTheme())) {
                this.themeToggle.checked = true;
                this.body.classList.add('dark-theme');
            } else {
                this.themeToggle.checked = false;
                this.body.classList.remove('dark-theme');
            }
            
            // Ajouter l'écouteur d'événement si ce n'est pas déjà fait
            if (!this.themeToggle._hasListener) {
                this.themeToggle.addEventListener('change', () => {
                    this.toggleTheme();
                });
                this.themeToggle._hasListener = true;
            }
        }
    }
    
    // Basculer entre les thèmes clair et sombre
    toggleTheme() {
        if (this.themeToggle.checked) {
            this.preferences.theme = 'dark';
            this.body.classList.add('dark-theme');
        } else {
            this.preferences.theme = 'light';
            this.body.classList.remove('dark-theme');
        }
        
        // Sauvegarder les préférences
        this.savePreferences();
    }
    
    // Détecter si le système est en mode sombre
    isSystemDarkTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Observer les changements de thème du système
    startSystemThemeObserver() {
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (this.preferences.theme === 'system') {
                    // Mettre à jour le thème si le mode système est activé
                    this.applyTheme();
                }
            });
        }
    }
}