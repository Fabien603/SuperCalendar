/**
 * @fileoverview Gestionnaire du thème et des préférences visuelles pour SuperCalendrier
 * Responsable du chargement, de l'application et de la sauvegarde des préférences visuelles
 * @module ThemeManager
 */

/**
 * Classe gestionnaire du thème
 * Gère les préférences visuelles et l'application des thèmes
 */
export class ThemeManager {
    /**
     * Crée une instance du gestionnaire de thème
     */
    constructor() {
        /**
         * Préférences visuelles de l'utilisateur
         * @type {Object}
         */
        this.preferences = {
            theme: 'dark',         // 'light', 'dark', 'system'
            timeFormat: '24h',     // '12h', '24h'
            notifications: 'all',  // 'all', 'important', 'none'
            useSystemAccent: false // Utiliser la couleur d'accentuation du système
        };
        
        /**
         * Références aux éléments DOM principaux
         * @type {Object}
         * @private
         */
        this._elements = {
            themeToggle: document.getElementById('theme-toggle'),
            body: document.body,
            root: document.documentElement
        };
        
        /**
         * Variables CSS du thème actuel
         * @type {Object}
         * @private
         */
        this._themeVars = {
            light: {
                '--background': '#f8f9fa',
                '--card-bg': '#ffffff',
                '--text': '#333333',
                '--text-light': '#666666',
                '--border': '#e0e0e0',
                '--shadow': 'rgba(0, 0, 0, 0.1)'
            },
            dark: {
                '--background': '#121212',
                '--card-bg': '#1e1e1e',
                '--text': '#e0e0e0',
                '--text-light': '#aaaaaa',
                '--border': '#333333',
                '--shadow': 'rgba(0, 0, 0, 0.5)'
            }
        };
        
        // Initialiser l'observateur du thème système
        this._mediaQueryDark = window.matchMedia('(prefers-color-scheme: dark)');
        this._initSystemThemeObserver();
    }
    
    /**
     * Charge les préférences depuis le stockage
     * @returns {Promise<boolean>} - Vrai si le chargement a réussi
     * @throws {Error} Si le chargement échoue
     */
    async loadPreferences() {
        try {
            console.log('Chargement des préférences de thème...');
            
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
                    try {
                        const parsedPrefs = JSON.parse(savedPreferences);
                        this.preferences = { ...this.preferences, ...parsedPrefs };
                    } catch (parseError) {
                        console.error('Erreur de parsing JSON des préférences:', parseError);
                        // Continuer avec les préférences par défaut
                    }
                }
            }
            
            // Appliquer le thème chargé
            this.applyTheme();
            
            // Initialiser les écouteurs d'événements
            this._initEventListeners();
            
            console.log('Préférences de thème chargées avec succès:', this.preferences);
            return true;
        } catch (error) {
            this._handleError('Erreur lors du chargement des préférences de thème', error);
            return false;
        }
    }
    
    /**
     * Sauvegarde les préférences de thème
     * @returns {Promise<boolean>} - Vrai si la sauvegarde a réussi
     */
    async savePreferences() {
        try {
            console.log('Sauvegarde des préférences de thème...');
            
            // Vérifier si l'API Electron est disponible
            if (window.electronAPI) {
                console.log('Sauvegarde des préférences dans Electron Store');
                await window.electronAPI.savePreferences(this.preferences);
            } else {
                console.log('Sauvegarde des préférences dans localStorage');
                localStorage.setItem('calendarPreferences', JSON.stringify(this.preferences));
            }
            
            // Déclencher un événement pour notifier de la mise à jour des préférences
            this._triggerPreferencesUpdatedEvent();
            
            console.log('Préférences de thème sauvegardées avec succès');
            return true;
        } catch (error) {
            this._handleError('Erreur lors de la sauvegarde des préférences de thème', error);
            return false;
        }
    }
    
    /**
     * Applique le thème actuel selon les préférences
     */
    applyTheme() {
        // Déterminer le thème à appliquer
        const isDarkTheme = this._shouldUseDarkTheme();
        
        // Appliquer le thème au corps de la page
        if (isDarkTheme) {
            this._elements.body.classList.add('dark-theme');
        } else {
            this._elements.body.classList.remove('dark-theme');
        }
        
        // Mettre à jour l'état du toggle de thème
        if (this._elements.themeToggle) {
            this._elements.themeToggle.checked = isDarkTheme;
        }
        
        // Appliquer les variables CSS du thème
        this._applyThemeVariables(isDarkTheme ? 'dark' : 'light');
        
        // Appliquer la couleur d'accentuation du système si activée
        if (this.preferences.useSystemAccent) {
            this._applySystemAccentColor();
        }
        
        console.log(`Thème appliqué: ${isDarkTheme ? 'sombre' : 'clair'}`);
    }
    
    /**
     * Applique les variables CSS du thème
     * @param {string} themeName - Nom du thème ('light' ou 'dark')
     * @private
     */
    _applyThemeVariables(themeName) {
        if (!this._themeVars[themeName] || !this._elements.root) return;
        
        const themeVars = this._themeVars[themeName];
        Object.entries(themeVars).forEach(([variable, value]) => {
            this._elements.root.style.setProperty(variable, value);
        });
    }
    
    /**
     * Applique la couleur d'accentuation du système si disponible
     * @private
     */
    _applySystemAccentColor() {
        // Essayer de récupérer la couleur d'accentuation du système via une média query
        // Note: Cette fonctionnalité n'est pas encore prise en charge par tous les navigateurs
        if (window.matchMedia('(prefers-color-scheme)').media !== 'not all') {
            // La véritable implémentation dépendrait de l'API CSS Properties and Values ou de la plateforme
            // Pour l'instant, nous utilisons une valeur par défaut adaptée au thème
            const isDarkTheme = this._shouldUseDarkTheme();
            const accentColor = isDarkTheme ? '#4895ef' : '#4361ee';
            
            // Appliquer la couleur d'accentuation aux variables CSS
            if (this._elements.root) {
                this._elements.root.style.setProperty('--primary', accentColor);
            }
        }
    }
    
    /**
     * Détermine si le thème sombre doit être utilisé
     * @returns {boolean} - Vrai si le thème sombre doit être utilisé
     * @private
     */
    _shouldUseDarkTheme() {
        if (this.preferences.theme === 'dark') {
            return true;
        } else if (this.preferences.theme === 'light') {
            return false;
        } else {
            // Pour 'system', utiliser le thème du système
            return this._isSystemDarkTheme();
        }
    }
    
    /**
     * Vérifie si le système est en thème sombre
     * @returns {boolean} - Vrai si le système est en thème sombre
     * @private
     */
    _isSystemDarkTheme() {
        return this._mediaQueryDark.matches;
    }
    
    /**
     * Bascule entre les thèmes clair et sombre
     */
    toggleTheme() {
        // Si le thème est en mode système, basculer vers un mode explicite
        if (this.preferences.theme === 'system') {
            this.preferences.theme = this._isSystemDarkTheme() ? 'light' : 'dark';
        } 
        // Sinon, basculer entre clair et sombre
        else {
            this.preferences.theme = this.preferences.theme === 'dark' ? 'light' : 'dark';
        }
        
        // Appliquer le changement et sauvegarder
        this.applyTheme();
        this.savePreferences();
        
        // Afficher une notification du changement
        this._showThemeChangeNotification();
    }
    
    /**
     * Définit explicitement le thème
     * @param {string} theme - Nom du thème ('light', 'dark' ou 'system')
     */
    setTheme(theme) {
        if (!['light', 'dark', 'system'].includes(theme)) {
            console.error(`Thème non reconnu: ${theme}`);
            return;
        }
        
        // Mettre à jour la préférence de thème
        this.preferences.theme = theme;
        
        // Appliquer le changement et sauvegarder
        this.applyTheme();
        this.savePreferences();
        
        // Afficher une notification du changement
        this._showThemeChangeNotification();
    }
    
    /**
     * Affiche une notification de changement de thème
     * @private
     */
    _showThemeChangeNotification() {
        // Créer un événement pour afficher une notification
        const themeName = this.preferences.theme === 'system' 
            ? 'système' 
            : (this.preferences.theme === 'dark' ? 'sombre' : 'clair');
        
        window.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                message: `Thème ${themeName} appliqué`,
                isError: false
            }
        }));
    }
    
    /**
     * Initialise les écouteurs d'événements
     * @private
     */
    _initEventListeners() {
        // Écouteur pour le toggle de thème
        if (this._elements.themeToggle && !this._elements.themeToggle._hasListener) {
            this._elements.themeToggle.addEventListener('change', () => {
                this.toggleTheme();
            });
            this._elements.themeToggle._hasListener = true;
        }
        
        // Écouter les événements personnalisés qui concernent le thème
        window.addEventListener('theme:change', (e) => {
            if (e.detail && e.detail.theme) {
                this.setTheme(e.detail.theme);
            }
        });
        
        // Écouteur pour les changements de préférences
        window.addEventListener('preferences:updated', (e) => {
            if (e.detail && e.detail.preferences) {
                // Mettre à jour uniquement les préférences liées au thème
                const themePrefs = ['theme', 'timeFormat', 'useSystemAccent'];
                let themeChanged = false;
                
                themePrefs.forEach(pref => {
                    if (e.detail.preferences[pref] !== undefined && 
                        e.detail.preferences[pref] !== this.preferences[pref]) {
                        this.preferences[pref] = e.detail.preferences[pref];
                        themeChanged = true;
                    }
                });
                
                // Appliquer le thème si des préférences ont changé
                if (themeChanged) {
                    this.applyTheme();
                }
            }
        });
    }
    
    /**
     * Initialise l'observateur du thème système
     * @private
     */
    _initSystemThemeObserver() {
        if (this._mediaQueryDark) {
            this._mediaQueryDark.addEventListener('change', (e) => {
                // Si le thème est configuré pour suivre le système, mettre à jour
                if (this.preferences.theme === 'system') {
                    this.applyTheme();
                    
                    // Afficher une notification de changement de thème système
                    const newTheme = e.matches ? 'sombre' : 'clair';
                    window.dispatchEvent(new CustomEvent('notification:show', {
                        detail: {
                            message: `Thème système détecté: ${newTheme}`,
                            isError: false
                        }
                    }));
                }
            });
        }
    }
    
    /**
     * Déclenche un événement de mise à jour des préférences
     * @private
     */
    _triggerPreferencesUpdatedEvent() {
        window.dispatchEvent(new CustomEvent('preferences:updated', {
            detail: { preferences: this.preferences }
        }));
    }
    
    /**
     * Gère les erreurs du gestionnaire de thème
     * @param {string} message - Message d'erreur
     * @param {Error} error - Objet d'erreur
     * @private
     */
    _handleError(message, error) {
        console.error(`ThemeManager: ${message}`, error);
        
        // Afficher une notification d'erreur
        window.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                message: `Erreur de thème: ${message}`,
                isError: true
            }
        }));
    }
    
    /**
     * Crée un thème personnalisé
     * @param {string} name - Nom du thème
     * @param {Object} variables - Variables CSS du thème
     * @returns {boolean} - Vrai si le thème a été créé avec succès
     */
    createCustomTheme(name, variables) {
        try {
            // Vérifier que le nom n'est pas réservé
            if (['light', 'dark', 'system'].includes(name)) {
                throw new Error(`Le nom de thème '${name}' est réservé`);
            }
            
            // Ajouter le thème personnalisé
            this._themeVars[name] = { ...variables };
            
            // Si le thème actuel est ce nouveau thème, l'appliquer
            if (this.preferences.theme === name) {
                this._applyThemeVariables(name);
            }
            
            console.log(`Thème personnalisé '${name}' créé avec succès`);
            return true;
        } catch (error) {
            this._handleError(`Erreur lors de la création du thème personnalisé '${name}'`, error);
            return false;
        }
    }
    
    /**
     * Obtient les informations sur le thème actuel
     * @returns {Object} - Informations sur le thème
     */
    getThemeInfo() {
        const isDarkTheme = this._shouldUseDarkTheme();
        const themeMode = this.preferences.theme;
        const effectiveTheme = isDarkTheme ? 'dark' : 'light';
        
        return {
            mode: themeMode,
            effective: effectiveTheme,
            isSystem: themeMode === 'system',
            isDark: isDarkTheme,
            systemPreference: this._isSystemDarkTheme() ? 'dark' : 'light',
            timeFormat: this.preferences.timeFormat,
            useSystemAccent: this.preferences.useSystemAccent
        };
    }
}