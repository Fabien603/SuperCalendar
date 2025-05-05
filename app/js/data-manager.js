/**
 * @fileoverview Gestionnaire de données pour SuperCalendrier
 * Responsable du stockage, chargement et manipulation des données de l'application
 * @module DataManager
 */

import { v4 as uuidv4 } from './utils/uuid.js';

/**
 * Classe de gestion des données de l'application
 * Gère le stockage et la manipulation des événements, catégories et préférences
 */
export class DataManager {
    /**
     * Crée une instance du gestionnaire de données
     */
    constructor() {
        /**
         * Structure de données principale de l'application
         * @type {Object}
         * @private
         */
        this.data = {
            events: [],
            categories: [],
            preferences: {
                theme: 'dark',
                firstDayOfWeek: 1, // 0 = Dimanche, 1 = Lundi
                timeFormat: '24h', // '12h' ou '24h'
                notifications: 'all' // 'all', 'important', 'none'
            },
            // Version pour la compatibilité avec les futures mises à jour
            version: '1.0.0',
            // Date de dernière modification
            lastModified: new Date().toISOString()
        };
        
        /**
         * Version minimale compatible pour l'importation
         * @type {string}
         * @private
         */
        this.minCompatibleVersion = '0.9.0';
    }
    
    // ===========================================================================
    // MÉTHODES DE BASE DE STOCKAGE ET CHARGEMENT
    // ===========================================================================
    
    /**
     * Charge les données depuis le stockage local ou Electron
     * @returns {Promise<boolean>} - Vrai si le chargement a réussi
     * @throws {Error} Si le chargement échoue
     */
    async loadData() {
        try {
            console.log('Début du chargement des données');
            
            // Déterminer la source de données (Electron ou localStorage)
            const dataSource = window.electronAPI ? 'Electron Store' : 'localStorage';
            console.log(`Chargement des données depuis ${dataSource}`);
            
            // Tenter de charger les données
            const loadedData = await this._loadDataFromSource();
            
            // Si des données ont été trouvées, les traiter
            if (loadedData && Object.keys(loadedData).length > 0) {
                console.log('Données trouvées, validation en cours');
                
                // Vérifier et valider les données
                if (this._validateImportedData(loadedData)) {
                    console.log('Structure de données valide');
                    this._processLoadedData(loadedData);
                } else {
                    console.error('Structure de données incompatible - initialisation des valeurs par défaut');
                    this._handleInvalidData();
                }
            } else {
                console.log('Aucune donnée trouvée - initialisation des valeurs par défaut');
                this._handleInvalidData();
            }
            
            // Charger les préférences
            await this._loadPreferences();
            
            // S'assurer que les événements référencent des catégories valides
            this._validateEventCategories();
            
            console.log('Données chargées avec succès:', this.data);
            return true;
        } catch (error) {
            this._handleError('Erreur lors du chargement des données', error);
            // En cas d'erreur, initialiser avec des valeurs par défaut
            this._handleInvalidData();
            throw error;
        }
    }
    
    /**
     * Charge les données depuis la source appropriée (Electron ou localStorage)
     * @returns {Promise<Object>} - Les données chargées
     * @private
     */
    async _loadDataFromSource() {
        if (window.electronAPI) {
            return await window.electronAPI.getCalendarData();
        } else {
            const savedData = localStorage.getItem('calendarAppData');
            return savedData ? JSON.parse(savedData) : null;
        }
    }
    
    /**
     * Traite les données chargées en gérant la compatibilité des versions
     * @param {Object} loadedData - Les données chargées
     * @private
     */
    _processLoadedData(loadedData) {
        // Structure compatible avec la version actuelle
        if (loadedData.events) this.data.events = loadedData.events;
        if (loadedData.categories) this.data.categories = loadedData.categories;
        
        // Compatibilité avec les anciennes versions
        if (loadedData.calendarData) {
            // Ancienne structure - migration des données
            console.log('Migration des données d\'une ancienne version');
            if (loadedData.calendarData.events) this.data.events = loadedData.calendarData.events;
            if (loadedData.calendarData.categories) this.data.categories = loadedData.calendarData.categories;
        }
        
        // Mise à jour de la version et de la date de modification
        this.data.version = loadedData.version || this.data.version;
        this.data.lastModified = loadedData.lastModified || new Date().toISOString();
    }
    
    /**
     * Gère le cas où les données sont invalides ou inexistantes
     * @private
     */
    _handleInvalidData() {
        // Si aucune catégorie n'est définie, créer des catégories par défaut
        if (this.data.categories.length === 0) {
            this.initializeDefaultCategories();
        }
    }
    
    /**
     * Charge les préférences depuis la source appropriée
     * @returns {Promise<void>}
     * @private
     */
    async _loadPreferences() {
        try {
            if (window.electronAPI) {
                const preferences = await window.electronAPI.getPreferences();
                if (preferences) {
                    this.data.preferences = { ...this.data.preferences, ...preferences };
                }
            } else {
                const savedPreferences = localStorage.getItem('calendarPreferences');
                if (savedPreferences) {
                    this.data.preferences = { ...this.data.preferences, ...JSON.parse(savedPreferences) };
                }
            }
        } catch (error) {
            this._handleError('Erreur lors du chargement des préférences', error);
        }
    }
    
    /**
     * Sauvegarde les données dans le stockage
     * @returns {Promise<boolean>} - Vrai si la sauvegarde a réussi
     * @throws {Error} Si la sauvegarde échoue
     */
    async saveData() {
        try {
            // Mettre à jour la date de dernière modification
            this.data.lastModified = new Date().toISOString();
            
            // Préparer les données pour la sauvegarde
            const dataToSave = {
                events: this.data.events,
                categories: this.data.categories,
                version: this.data.version,
                lastModified: this.data.lastModified
            };
            
            // Vérifier si l'API Electron est disponible
            if (window.electronAPI) {
                console.log('Sauvegarde des données dans Electron Store');
                await window.electronAPI.saveCalendarData(dataToSave);
            } else {
                console.log('Sauvegarde des données dans localStorage');
                localStorage.setItem('calendarAppData', JSON.stringify(dataToSave));
            }
            
            console.log('Données sauvegardées avec succès');
            return true;
        } catch (error) {
            this._handleError('Erreur lors de la sauvegarde des données', error);
            throw error;
        }
    }
    
    /**
     * Sauvegarde les préférences
     * @returns {Promise<boolean>} - Vrai si la sauvegarde a réussi
     * @throws {Error} Si la sauvegarde échoue
     */
    async savePreferences() {
        try {
            if (window.electronAPI) {
                await window.electronAPI.savePreferences(this.data.preferences);
            } else {
                localStorage.setItem('calendarPreferences', JSON.stringify(this.data.preferences));
            }
            
            console.log('Préférences sauvegardées avec succès');
            return true;
        } catch (error) {
            this._handleError('Erreur lors de la sauvegarde des préférences', error);
            throw error;
        }
    }
    
    /**
     * Réinitialise les données (événements uniquement)
     * @returns {Promise<boolean>} - Vrai si la réinitialisation a réussi
     */
    async resetData() {
        // Conserver uniquement les catégories et préférences
        this.data.events = [];
        
        // Mettre à jour la date de dernière modification
        this.data.lastModified = new Date().toISOString();
        
        // Sauvegarder les données
        await this.saveData();
        
        console.log('Données réinitialisées avec succès');
        return true;
    }
    
    /**
     * Crée des catégories par défaut
     */
    initializeDefaultCategories() {
        this.data.categories = [
            { id: uuidv4(), name: 'Travail', color: '#2196f3', emoji: '💼', createdAt: new Date().toISOString() },
            { id: uuidv4(), name: 'Personnel', color: '#4caf50', emoji: '🏠', createdAt: new Date().toISOString() },
            { id: uuidv4(), name: 'Rendez-vous', color: '#f44336', emoji: '🔔', createdAt: new Date().toISOString() },
            { id: uuidv4(), name: 'Vacances', color: '#ff9800', emoji: '🏝️', createdAt: new Date().toISOString() },
            { id: uuidv4(), name: 'Sport', color: '#9c27b0', emoji: '🏃', createdAt: new Date().toISOString() },
            { id: uuidv4(), name: 'Événement', color: '#795548', emoji: '🎉', createdAt: new Date().toISOString() },
            { id: uuidv4(), name: 'Golf', color: '#4caf50', emoji: '🏌️', createdAt: new Date().toISOString() }
        ];
        
        console.log('Catégories par défaut créées');
    }
    
    // ===========================================================================
    // MÉTHODES D'IMPORTATION ET D'EXPORTATION
    // ===========================================================================
    
    /**
     * Valide les données importées
     * @param {Object} data - Données à valider
     * @returns {boolean} - Vrai si les données sont valides
     * @private
     */
    _validateImportedData(data) {
        // Vérifier que les données sont un objet
        if (!data || typeof data !== 'object') {
            console.error('Les données importées ne sont pas un objet valide');
            return false;
        }
        
        // Vérifier la version (si elle existe)
        if (data.version && this._compareVersions(data.version, this.minCompatibleVersion) < 0) {
            console.error(`Version incompatible: ${data.version} (min: ${this.minCompatibleVersion})`);
            return false;
        }
        
        // Vérifier si les données contiennent les propriétés nécessaires
        // Accepter les données directes ou dans data.calendarData (compatibilité)
        const hasEvents = Array.isArray(data.events) || 
                         (data.calendarData && Array.isArray(data.calendarData.events));
        const hasCategories = Array.isArray(data.categories) || 
                             (data.calendarData && Array.isArray(data.calendarData.categories));
        
        if (!hasEvents && !hasCategories) {
            console.error('Les données ne contiennent ni événements ni catégories');
            return false;
        }
        
        return true;
    }
    
    /**
     * Compare deux versions sémantiques
     * @param {string} v1 - Première version
     * @param {string} v2 - Deuxième version
     * @returns {number} - -1 si v1 < v2, 0 si v1 = v2, 1 si v1 > v2
     * @private
     */
    _compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            
            if (p1 < p2) return -1;
            if (p1 > p2) return 1;
        }
        
        return 0; // Versions égales
    }
    
    /**
     * Valide les catégories des événements
     * @private
     */
    _validateEventCategories() {
        // Créer un ensemble des IDs de catégories valides
        const validCategoryIds = new Set(this.data.categories.map(cat => cat.id));
        
        let invalidCategoriesCount = 0;
        
        // Parcourir tous les événements et vérifier/corriger leurs catégories
        this.data.events.forEach(event => {
            // Si la catégorie n'existe pas, la définir à null
            if (event.categoryId && !validCategoryIds.has(event.categoryId)) {
                console.warn(`Catégorie invalide pour l'événement "${event.title}" (ID: ${event.id})`);
                event.categoryId = null;
                invalidCategoriesCount++;
            }
        });
        
        if (invalidCategoriesCount > 0) {
            console.log(`${invalidCategoriesCount} événement(s) avec des catégories invalides corrigés`);
        }
    }
    
    /**
     * Importe des données depuis un fichier
     * @param {string} filePath - Chemin du fichier (ou objet File en mode Web)
     * @returns {Promise<boolean>} - Vrai si l'importation a réussi
     * @throws {Error} Si l'importation échoue
     */
    async importFromFile(filePath) {
        try {
            let data;
            
            if (window.electronAPI) {
                console.log(`Importation depuis le fichier: ${filePath}`);
                data = await window.electronAPI.fileSystem.importCalendarFile(filePath);
            } else {
                // Pour le cas où nous sommes dans un navigateur sans Electron
                console.log('Importation depuis un objet File');
                data = await this._importFromBrowserFile(filePath);
            }
            
            // Vérifier la validité des données
            if (!this._validateImportedData(data)) {
                throw new Error('Format de données invalide');
            }
            
            console.log('Données validées, importation en cours');
            
            // Mettre à jour les données
            this._importDataFromObject(data);
            
            // Valider les catégories des événements
            this._validateEventCategories();
            
            // Sauvegarder les données importées
            await this.saveData();
            
            console.log('Importation terminée avec succès');
            return true;
        } catch (error) {
            this._handleError('Erreur lors de l\'importation', error);
            throw error;
        }
    }
    
    /**
     * Importe des données depuis un objet File du navigateur
     * @param {File} file - L'objet File
     * @returns {Promise<Object>} - Les données importées
     * @private
     * @throws {Error} Si l'importation échoue
     */
    async _importFromBrowserFile(file) {
        // Vérifier si l'argument est bien un objet File
        if (!(file instanceof File)) {
            throw new Error('Argument invalide: objet File attendu');
        }
        
        const content = await file.text();
        
        if (file.name.endsWith('.json')) {
            return JSON.parse(content);
        } else if (file.name.endsWith('.ics')) {
            return this._parseICalData(content);
        } else {
            throw new Error('Format de fichier non supporté');
        }
    }
    
    /**
     * Importe des données à partir d'un objet
     * @param {Object} data - Données à importer
     * @private
     */
    _importDataFromObject(data) {
        // Importer les événements
        if (data.events) {
            this.data.events = data.events;
        } else if (data.calendarData && data.calendarData.events) {
            this.data.events = data.calendarData.events;
        }
        
        // Importer les catégories
        if (data.categories) {
            this.data.categories = data.categories;
        } else if (data.calendarData && data.calendarData.categories) {
            this.data.categories = data.calendarData.categories;
        }
        
        // Mettre à jour les métadonnées
        if (data.version) {
            this.data.version = data.version;
        }
        
        this.data.lastModified = new Date().toISOString();
    }
    
    /**
     * Exporte les données vers un fichier
     * @param {string} filePath - Chemin du fichier
     * @returns {Promise<boolean>} - Vrai si l'exportation a réussi
     * @throws {Error} Si l'exportation échoue
     */
    async exportToFile(filePath) {
        try {
            const dataToExport = {
                events: this.data.events,
                categories: this.data.categories,
                preferences: this.data.preferences,
                exportDate: new Date().toISOString(),
                version: this.data.version
            };
            
            if (window.electronAPI) {
                const extension = filePath.toLowerCase().endsWith('.json') ? '' : '.json';
                const finalPath = filePath + extension;
                
                console.log(`Exportation vers le fichier: ${finalPath}`);
                
                await window.electronAPI.fileSystem.writeFile(
                    finalPath,
                    JSON.stringify(dataToExport, null, 2),
                    { encoding: 'utf8' }
                );
            } else {
                // Pour le cas où nous sommes dans un navigateur sans Electron
                console.log('Exportation via le navigateur');
                
                const dataStr = JSON.stringify(dataToExport, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                
                this._triggerBrowserDownload(dataUri, 'calendrier-donnees.json');
            }
            
            console.log('Exportation terminée avec succès');
            return true;
        } catch (error) {
            this._handleError('Erreur lors de l\'exportation', error);
            throw error;
        }
    }
    
    /**
     * Déclenche un téléchargement dans le navigateur
     * @param {string} dataUri - URI des données
     * @param {string} filename - Nom du fichier
     * @private
     */
    _triggerBrowserDownload(dataUri, filename) {
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    /**
     * Exporte les événements au format iCal
     * @param {Array} [eventIds] - IDs des événements à exporter (tous si non spécifié)
     * @returns {Promise<string>} - Contenu iCal généré
     * @throws {Error} Si l'exportation échoue
     */
    async exportToICS(eventIds) {
        try {
            // Vérifier si la bibliothèque ical-generator est disponible
            if (typeof icalGenerator === 'undefined' && !window.icalGenerator) {
                // Si la bibliothèque n'est pas disponible, utiliser notre implémentation basique
                return this._generateBasicICS(eventIds);
            } else {
                // Utiliser ical-generator si disponible
                const ical = window.icalGenerator || icalGenerator;
                return this._generateICSWithLibrary(ical, eventIds);
            }
        } catch (error) {
            this._handleError('Erreur lors de l\'exportation iCal', error);
            throw error;
        }
    }
    
    /**
     * Génère un fichier iCal basique sans dépendance externe
     * @param {Array} [eventIds] - IDs des événements à exporter
     * @returns {string} - Contenu iCal généré
     * @private
     */
    _generateBasicICS(eventIds) {
        // Filtrer les événements si des IDs sont spécifiés
        const eventsToExport = eventIds
            ? this.data.events.filter(event => eventIds.includes(event.id))
            : this.data.events;
        
        // Générer l'en-tête
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//SuperCalendrier//FR',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ].join('\r\n') + '\r\n';
        
        // Ajouter chaque événement
        for (const event of eventsToExport) {
            icsContent += this._convertEventToICS(event);
        }
        
        // Fermer le calendrier
        icsContent += 'END:VCALENDAR\r\n';
        
        return icsContent;
    }
    
    /**
     * Convertit un événement en format iCal
     * @param {Object} event - Événement à convertir
     * @returns {string} - Portion iCal pour cet événement
     * @private
     */
    _convertEventToICS(event) {
        // Générer un UID unique pour l'événement
        const uid = event.id || uuidv4();
        
        // Formater les dates
        const dtStart = this._formatICalDateTime(event.startDate, event.startTime, event.isAllDay);
        const dtEnd = this._formatICalDateTime(event.endDate, event.endTime, event.isAllDay);
        
        // Créer la partie VEVENT
        let vevent = [
            'BEGIN:VEVENT',
            `UID:${uid}@supercalendrier.com`,
            `DTSTAMP:${this._formatICalDateTime(new Date().toISOString())}`,
            `DTSTART${event.isAllDay ? ';VALUE=DATE' : ''}:${dtStart}`,
            `DTEND${event.isAllDay ? ';VALUE=DATE' : ''}:${dtEnd}`,
            `SUMMARY:${this._escapeICalText(event.title)}`
        ].join('\r\n') + '\r\n';
        
        // Ajouter la description si elle existe
        if (event.description) {
            vevent += `DESCRIPTION:${this._escapeICalText(event.description)}\r\n`;
        }
        
        // Ajouter le lieu s'il existe
        if (event.location) {
            vevent += `LOCATION:${this._escapeICalText(event.location)}\r\n`;
        }
        
        // Ajouter la catégorie si elle existe
        if (event.categoryId) {
            const category = this.getCategoryById(event.categoryId);
            if (category) {
                vevent += `CATEGORIES:${this._escapeICalText(category.name)}\r\n`;
            }
        }
        
        // Ajouter la récurrence si elle existe
        if (event.recurrence && event.recurrence.type !== 'none') {
            vevent += this._generateRecurrenceRule(event.recurrence) + '\r\n';
        }
        
        // Fermer l'événement
        vevent += 'END:VEVENT\r\n';
        
        return vevent;
    }
    
    /**
     * Formate une date et heure pour iCal
     * @param {string} date - Date au format ISO ou objet Date
     * @param {string} [time] - Heure au format HH:MM
     * @param {boolean} [isAllDay=false] - Indique si c'est un événement toute la journée
     * @returns {string} - Date formatée pour iCal
     * @private
     */
    _formatICalDateTime(date, time, isAllDay = false) {
        let dateObj;
        
        if (date instanceof Date) {
            dateObj = date;
        } else {
            dateObj = new Date(date);
            
            // Ajouter l'heure si spécifiée
            if (time && !isAllDay) {
                const [hours, minutes] = time.split(':').map(Number);
                dateObj.setHours(hours, minutes, 0, 0);
            }
        }
        
        // Format pour les événements toute la journée (juste la date)
        if (isAllDay) {
            return dateObj.toISOString().replace(/[-:]/g, '').split('T')[0];
        }
        
        // Format complet avec date et heure
        return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }
    
    /**
     * Échappe un texte pour le format iCal
     * @param {string} text - Texte à échapper
     * @returns {string} - Texte échappé
     * @private
     */
    _escapeICalText(text) {
        if (!text) return '';
        
        return text
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    }
    
    /**
     * Génère une règle de récurrence pour iCal
     * @param {Object} recurrence - Configuration de récurrence
     * @returns {string} - Règle RRULE formatée
     * @private
     */
    _generateRecurrenceRule(recurrence) {
        if (!recurrence || recurrence.type === 'none') {
            return '';
        }
        
        let rrule = 'RRULE:';
        
        // Fréquence
        switch (recurrence.type) {
            case 'daily':
                rrule += 'FREQ=DAILY';
                break;
            case 'weekly':
                rrule += 'FREQ=WEEKLY';
                break;
            case 'monthly':
                rrule += 'FREQ=MONTHLY';
                break;
            case 'yearly':
                rrule += 'FREQ=YEARLY';
                break;
            case 'custom':
                // Déterminer la fréquence en fonction de l'unité
                if (recurrence.unit === 'days') rrule += 'FREQ=DAILY';
                else if (recurrence.unit === 'weeks') rrule += 'FREQ=WEEKLY';
                else if (recurrence.unit === 'months') rrule += 'FREQ=MONTHLY';
                else if (recurrence.unit === 'years') rrule += 'FREQ=YEARLY';
                else rrule += 'FREQ=DAILY'; // Par défaut
                break;
            default:
                rrule += 'FREQ=DAILY'; // Par défaut
        }
        
        // Intervalle
        if (recurrence.interval && recurrence.interval > 1) {
            rrule += `;INTERVAL=${recurrence.interval}`;
        }
        
        // Jours de la semaine (pour récurrence hebdomadaire)
        if (recurrence.type === 'weekly' && recurrence.days && recurrence.days.length > 0) {
            const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            const byDays = recurrence.days.map(day => dayMap[day]).join(',');
            rrule += `;BYDAY=${byDays}`;
        }
        
        // Règle de fin
        if (recurrence.end) {
            if (recurrence.end.type === 'after' && recurrence.end.occurrences) {
                rrule += `;COUNT=${recurrence.end.occurrences}`;
            } else if (recurrence.end.type === 'on-date' && recurrence.end.date) {
                const untilDate = new Date(recurrence.end.date);
                untilDate.setHours(23, 59, 59);
                rrule += `;UNTIL=${this._formatICalDateTime(untilDate)}`;
            }
        }
        
        return rrule;
    }
    
    /**
     * Génère un fichier iCal en utilisant la bibliothèque ical-generator
     * @param {Object} ical - Instance de la bibliothèque ical-generator
     * @param {Array} [eventIds] - IDs des événements à exporter
     * @returns {string} - Contenu iCal généré
     * @private
     */
    _generateICSWithLibrary(ical, eventIds) {
        // Cette méthode serait implémentée si la bibliothèque ical-generator était disponible
        // Pour l'instant, nous utilisons notre implémentation basique
        console.warn('Bibliothèque ical-generator non utilisée, utilisation de l\'implémentation basique à la place');
        return this._generateBasicICS(eventIds);
    }
    
    /**
     * Analyse des données iCal pour les importer
     * @param {string} icalData - Contenu iCal à analyser
     * @returns {Object} - Données extraites
     * @private
     * @throws {Error} Si l'analyse échoue
     */
    _parseICalData(icalData) {
        try {
            console.log('Analyse des données iCal');
            
            // Initialiser les tableaux d'événements et de catégories
            const events = [];
            const categories = new Map(); // Utiliser une Map pour éviter les doublons
            
            // Analyser le contenu iCal
            const lines = icalData.split(/\r\n|\n|\r/);
            let currentEvent = null;
            let inEvent = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Début d'un nouvel événement
                if (line === 'BEGIN:VEVENT') {
                    inEvent = true;
                    currentEvent = {
                        id: uuidv4(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    continue;
                }
                
                // Fin d'un événement
                if (line === 'END:VEVENT' && inEvent) {
                    inEvent = false;
                    if (currentEvent && currentEvent.title && currentEvent.startDate) {
                        events.push(currentEvent);
                    }
                    currentEvent = null;
                    continue;
                }
                
                // Traiter les lignes de l'événement
                if (inEvent && currentEvent) {
                    // Séparer la clé et la valeur
                    const [key, ...valueParts] = line.split(':');
                    const value = valueParts.join(':');
                    
                    // Ignorer les lignes sans valeur
                    if (!value) continue;
                    
                    // Traiter les propriétés communes
                    this._processICalProperty(currentEvent, key, value, categories);
                }
            }
            
            // Convertir les catégories en tableau
            const uniqueCategories = Array.from(categories.values());
            
            console.log(`${events.length} événements et ${uniqueCategories.length} catégories importés`);
            
            return {
                events,
                categories: uniqueCategories,
                version: this.data.version,
                lastModified: new Date().toISOString()
            };
        } catch (error) {
            this._handleError('Erreur lors de l\'analyse des données iCal', error);
            throw new Error('Format iCal invalide ou non supporté');
        }
    }
    
    /**
     * Traite une propriété iCal pour l'importation
     * @param {Object} event - Événement en cours de construction
     * @param {string} key - Clé de la propriété
     * @param {string} value - Valeur de la propriété
     * @param {Map} categories - Map des catégories
     * @private
     */
    _processICalProperty(event, key, value, categories) {
        // Supprimer les caractères d'échappement
        const unescapedValue = this._unescapeICalText(value);
        
        // Traiter la propriété en fonction de la clé
        switch (key) {
            case 'SUMMARY':
                event.title = unescapedValue;
                break;
                
            case 'DESCRIPTION':
                event.description = unescapedValue;
                break;
                
            case 'LOCATION':
                event.location = unescapedValue;
                break;
                
            case 'DTSTART':
            case 'DTSTART;VALUE=DATE':
                const startInfo = this._parseICalDate(key, value);
                event.startDate = startInfo.date;
                if (startInfo.time) event.startTime = startInfo.time;
                event.isAllDay = key.includes('VALUE=DATE');
                break;
                
            case 'DTEND':
            case 'DTEND;VALUE=DATE':
                const endInfo = this._parseICalDate(key, value);
                event.endDate = endInfo.date;
                if (endInfo.time) event.endTime = endInfo.time;
                break;
                
            case 'CATEGORIES':
                // Traiter les catégories (séparées par des virgules)
                const categoryNames = unescapedValue.split(',');
                categoryNames.forEach(name => {
                    const categoryName = name.trim();
                    if (!categoryName) return;
                    
                    // Si la catégorie n'existe pas encore, la créer
                    if (!categories.has(categoryName)) {
                        categories.set(categoryName, {
                            id: uuidv4(),
                            name: categoryName,
                            color: this._getRandomColor(),
                            emoji: '📅', // Emoji par défaut
                            createdAt: new Date().toISOString()
                        });
                    }
                    
                    // Assigner la catégorie à l'événement
                    event.categoryId = categories.get(categoryName).id;
                });
                break;
                
            case 'RRULE':
                // Traiter la règle de récurrence
                event.recurrence = this._parseRecurrenceRule(unescapedValue);
                break;
        }
    }
    
    /**
     * Analyse une date iCal
     * @param {string} key - Clé de la propriété (pour déterminer le format)
     * @param {string} value - Valeur de la date
     * @returns {Object} - Objet avec la date formatée et l'heure si disponible
     * @private
     */
    _parseICalDate(key, value) {
        // Déterminer si c'est une date simple ou une date+heure
        const isDateOnly = key.includes('VALUE=DATE');
        
        if (isDateOnly) {
            // Format: YYYYMMDD
            const year = parseInt(value.substring(0, 4));
            const month = parseInt(value.substring(4, 6)) - 1;
            const day = parseInt(value.substring(6, 8));
            
            const date = new Date(year, month, day);
            return {
                date: this._formatYYYYMMDD(date),
                time: null
            };
        } else {
            // Format: YYYYMMDDTHHmmssZ
            const dateTimeStr = value.replace('Z', '');
            const dateStr = dateTimeStr.split('T')[0];
            const timeStr = dateTimeStr.split('T')[1];
            
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            
            let hours = 0, minutes = 0;
            if (timeStr) {
                hours = parseInt(timeStr.substring(0, 2));
                minutes = parseInt(timeStr.substring(2, 4));
            }
            
            const date = new Date(year, month, day);
            return {
                date: this._formatYYYYMMDD(date),
                time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
            };
        }
    }
    
    /**
     * Formate une date au format YYYY-MM-DD
     * @param {Date} date - Date à formater
     * @returns {string} - Date formatée
     * @private
     */
    _formatYYYYMMDD(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Génère une couleur aléatoire au format hexadécimal
     * @returns {string} - Couleur au format #RRGGBB
     * @private
     */
    _getRandomColor() {
        const colors = [
            '#4361ee', '#2196f3', '#4caf50', '#f44336', '#ff9800', 
            '#9c27b0', '#795548', '#607d8b', '#f72585', '#4cc9f0'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Analyse une règle de récurrence iCal
     * @param {string} rruleStr - Règle RRULE à analyser
     * @returns {Object} - Configuration de récurrence
     * @private
     */
    _parseRecurrenceRule(rruleStr) {
        const recurrence = {
            type: 'none',
            interval: 1
        };
        
        // Séparer les différentes parties de la règle
        const parts = rruleStr.split(';');
        
        // Parcourir chaque partie
        for (const part of parts) {
            const [key, value] = part.split('=');
            
            switch (key) {
                case 'FREQ':
                    // Déterminer le type de récurrence
                    if (value === 'DAILY') recurrence.type = 'daily';
                    else if (value === 'WEEKLY') recurrence.type = 'weekly';
                    else if (value === 'MONTHLY') recurrence.type = 'monthly';
                    else if (value === 'YEARLY') recurrence.type = 'yearly';
                    break;
                    
                case 'INTERVAL':
                    recurrence.interval = parseInt(value) || 1;
                    break;
                    
                case 'BYDAY':
                    // Jours de la semaine pour récurrence hebdomadaire
                    if (recurrence.type === 'weekly') {
                        const dayMap = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
                        recurrence.days = value.split(',')
                            .map(day => dayMap[day])
                            .filter(day => day !== undefined);
                    }
                    break;
                    
                case 'COUNT':
                    // Nombre d'occurrences
                    recurrence.end = {
                        type: 'after',
                        occurrences: parseInt(value) || 10
                    };
                    break;
                    
                case 'UNTIL':
                    // Date de fin
                    const untilDate = this._parseICalDate('DTEND', value);
                    recurrence.end = {
                        type: 'on-date',
                        date: untilDate.date
                    };
                    break;
            }
        }
        
        // Si aucune fin n'est spécifiée, utiliser "jamais"
        if (!recurrence.end) {
            recurrence.end = { type: 'never' };
        }
        
        return recurrence;
    }
    
    /**
     * Supprime les caractères d'échappement d'un texte iCal
     * @param {string} text - Texte à désescapper
     * @returns {string} - Texte déseschappé
     * @private
     */
    _unescapeICalText(text) {
        if (!text) return '';
        
        return text
            .replace(/\\;/g, ';')
            .replace(/\\,/g, ',')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\');
    }
    
    // ===========================================================================
    // MÉTHODES DE GESTION DES ÉVÉNEMENTS
    // ===========================================================================
    
    /**
     * Ajoute un nouvel événement
     * @param {Object} eventData - Données de l'événement
     * @returns {Object} - Événement créé
     * @throws {Error} Si les données sont invalides
     */
    addEvent(eventData) {
        try {
            // Vérifier que les propriétés obligatoires sont présentes
            if (!eventData.title) {
                throw new Error('Le titre est obligatoire');
            }
            
            if (!eventData.startDate) {
                throw new Error('La date de début est obligatoire');
            }
            
            if (!eventData.endDate) {
                // Si la date de fin n'est pas spécifiée, utiliser la date de début
                eventData.endDate = eventData.startDate;
            }
            
            // Générer un ID unique pour l'événement
            const id = eventData.id || uuidv4();
            
            // Créer le nouvel événement
            const newEvent = {
                id,
                title: eventData.title,
                startDate: eventData.startDate,
                endDate: eventData.endDate,
                startTime: eventData.startTime || null,
                endTime: eventData.endTime || null,
                isAllDay: eventData.isAllDay || false,
                location: eventData.location || null,
                description: eventData.description || null,
                categoryId: eventData.categoryId || null,
                recurrence: eventData.recurrence || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Vérifier si la catégorie existe si elle est spécifiée
            if (newEvent.categoryId) {
                this._validateCategory(newEvent.categoryId);
            }
            
            // Ajouter l'événement à la liste
            this.data.events.push(newEvent);
            
            // Sauvegarder les modifications (asynchrone, sans attendre)
            this.saveData().catch(error => {
                this._handleError('Erreur lors de la sauvegarde après ajout d\'événement', error);
            });
            
            return { ...newEvent }; // Retourner une copie pour éviter les modifications directes
        } catch (error) {
            this._handleError('Erreur lors de l\'ajout d\'un événement', error);
            throw error;
        }
    }
    
    /**
     * Met à jour un événement existant
     * @param {string} eventId - ID de l'événement à mettre à jour
     * @param {Object} updatedData - Nouvelles données
     * @returns {Object} - Événement mis à jour
     * @throws {Error} Si l'événement n'existe pas ou si les données sont invalides
     */
    updateEvent(eventId, updatedData) {
        try {
            const eventIndex = this._findEventIndex(eventId);
            
            // Vérifier les données minimales requises
            if (updatedData.title === '') {
                throw new Error('Le titre ne peut pas être vide');
            }
            
            if (updatedData.startDate && !updatedData.endDate) {
                // Si seule la date de début est mise à jour, ajuster la date de fin
                updatedData.endDate = updatedData.startDate;
            }
            
            // Vérifier si la catégorie existe si elle est spécifiée
            if (updatedData.categoryId) {
                this._validateCategory(updatedData.categoryId);
            }
            
            // Mettre à jour l'événement
            this.data.events[eventIndex] = {
                ...this.data.events[eventIndex],
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
            
            // Sauvegarder les modifications (asynchrone, sans attendre)
            this.saveData().catch(error => {
                this._handleError('Erreur lors de la sauvegarde après mise à jour d\'événement', error);
            });
            
            return { ...this.data.events[eventIndex] }; // Retourner une copie
        } catch (error) {
            this._handleError('Erreur lors de la mise à jour d\'un événement', error);
            throw error;
        }
    }
    
    /**
     * Trouve l'index d'un événement dans le tableau
     * @param {string} eventId - ID de l'événement
     * @returns {number} - Index de l'événement
     * @throws {Error} Si l'événement n'existe pas
     * @private
     */
    _findEventIndex(eventId) {
        const eventIndex = this.data.events.findIndex(event => event.id === eventId);
        
        if (eventIndex === -1) {
            throw new Error(`Événement non trouvé: ${eventId}`);
        }
        
        return eventIndex;
    }
    
    /**
     * Valide qu'une catégorie existe
     * @param {string} categoryId - ID de la catégorie
     * @returns {boolean} - Vrai si la catégorie existe
     * @throws {Error} Si la catégorie n'existe pas
     * @private
     */
    _validateCategory(categoryId) {
        const categoryExists = this.data.categories.some(cat => cat.id === categoryId);
        
        if (!categoryExists) {
            console.warn(`La catégorie avec l'ID ${categoryId} n'existe pas. Utilisation de null à la place.`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Supprime un événement
     * @param {string} eventId - ID de l'événement à supprimer
     * @returns {boolean} - Vrai si la suppression a réussi
     * @throws {Error} Si l'événement n'existe pas
     */
    deleteEvent(eventId) {
        try {
            const initialLength = this.data.events.length;
            this.data.events = this.data.events.filter(event => event.id !== eventId);
            
            if (this.data.events.length === initialLength) {
                throw new Error(`Événement non trouvé: ${eventId}`);
            }
            
            // Sauvegarder les modifications (asynchrone, sans attendre)
            this.saveData().catch(error => {
                this._handleError('Erreur lors de la sauvegarde après suppression d\'événement', error);
            });
            
            return true;
        } catch (error) {
            this._handleError('Erreur lors de la suppression d\'un événement', error);
            throw error;
        }
    }
    
    /**
     * Supprime tous les événements d'une catégorie
     * @param {string} categoryId - ID de la catégorie
     * @returns {number} - Nombre d'événements supprimés
     */
    deleteEventsByCategory(categoryId) {
        try {
            const initialLength = this.data.events.length;
            this.data.events = this.data.events.filter(event => event.categoryId !== categoryId);
            
            const deletedCount = initialLength - this.data.events.length;
            
            // Sauvegarder les modifications (asynchrone, sans attendre)
            this.saveData().catch(error => {
                this._handleError('Erreur lors de la sauvegarde après suppression d\'événements par catégorie', error);
            });
            
            return deletedCount;
        } catch (error) {
            this._handleError('Erreur lors de la suppression des événements par catégorie', error);
            return 0;
        }
    }
    
    /**
     * Obtient tous les événements
     * @returns {Array} - Liste des événements
     */
    getAllEvents() {
        return [...this.data.events]; // Retourner une copie du tableau
    }
    
    /**
     * Obtient un événement par ID
     * @param {string} eventId - ID de l'événement
     * @returns {Object} - L'événement
     * @throws {Error} Si l'événement n'existe pas
     */
    getEventById(eventId) {
        const event = this.data.events.find(event => event.id === eventId);
        
        if (!event) {
            throw new Error(`Événement non trouvé: ${eventId}`);
        }
        
        return { ...event }; // Retourner une copie pour éviter les modifications directes
    }
    
    /**
     * Obtient les événements par jour
     * @param {Date} date - Date à rechercher
     * @returns {Array} - Liste des événements pour ce jour
     */
    getEventsByDay(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        
        // Créer des objets Date pour la comparaison
        const startOfDay = new Date(year, month, day, 0, 0, 0);
        const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
        
        return this.data.events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            return (eventStartDate <= endOfDay && eventEndDate >= startOfDay);
        });
    }
    
    /**
     * Obtient les événements par mois
     * @param {number} year - Année
     * @param {number} month - Mois (0-11)
     * @returns {Array} - Liste des événements pour ce mois
     */
    getEventsByMonth(year, month) {
        // Créer des objets Date pour la comparaison
        const startOfMonth = new Date(year, month, 1, 0, 0, 0);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        return this.data.events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            return (eventStartDate <= endOfMonth && eventEndDate >= startOfMonth);
        });
    }
    
    /**
     * Obtient les événements à venir
     * @param {number} [limit] - Nombre maximum d'événements à retourner
     * @returns {Array} - Liste des événements à venir
     */
    getUpcomingEvents(limit = null) {
        const now = new Date();
        
        // Filtrer les événements qui commencent maintenant ou dans le futur
        const futureEvents = this.data.events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            return eventStartDate >= now;
        });
        
        // Trier par date de début
        futureEvents.sort((a, b) => {
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            return dateA - dateB;
        });
        
        // Limiter le nombre d'événements si demandé
        if (limit && typeof limit === 'number' && limit > 0) {
            return futureEvents.slice(0, limit);
        }
        
        return futureEvents;
    }
    
    /**
     * Recherche des événements selon des critères
     * @param {Object} criteria - Critères de recherche
     * @returns {Array} - Liste des événements correspondants
     */
    searchEvents(criteria = {}) {
        let results = [...this.data.events];
        
        // Filtre par titre
        if (criteria.title) {
            const titleLower = criteria.title.toLowerCase();
            results = results.filter(event => 
                event.title.toLowerCase().includes(titleLower)
            );
        }
        
        // Filtre par catégorie
        if (criteria.categoryId) {
            results = results.filter(event => 
                event.categoryId === criteria.categoryId
            );
        }
        
        // Filtre par lieu
        if (criteria.location) {
            const locationLower = criteria.location.toLowerCase();
            results = results.filter(event => 
                event.location && event.location.toLowerCase().includes(locationLower)
            );
        }
        
        // Filtre par description
        if (criteria.description) {
            const descLower = criteria.description.toLowerCase();
            results = results.filter(event => 
                event.description && event.description.toLowerCase().includes(descLower)
            );
        }
        
        // Filtre par plage de dates
        if (criteria.startDate) {
            const startDate = new Date(criteria.startDate);
            startDate.setHours(0, 0, 0, 0);
            results = results.filter(event => 
                new Date(event.endDate) >= startDate
            );
        }
        
        if (criteria.endDate) {
            const endDate = new Date(criteria.endDate);
            endDate.setHours(23, 59, 59, 999);
            results = results.filter(event => 
                new Date(event.startDate) <= endDate
            );
        }
        
        // Trier par date de début
        results.sort((a, b) => {
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            return dateA - dateB;
        });
        
        return results;
    }
    
    // ===========================================================================
    // MÉTHODES DE GESTION DES CATÉGORIES
    // ===========================================================================
    
    /**
     * Ajoute une nouvelle catégorie
     * @param {Object} categoryData - Données de la catégorie
     * @returns {Object} - Catégorie créée
     * @throws {Error} Si les données sont invalides
     */
    addCategory(categoryData) {
        try {
            // S'assurer que les propriétés obligatoires sont présentes
            if (!categoryData.name) {
                throw new Error('Le nom de la catégorie est obligatoire');
            }
            
            if (!categoryData.emoji) {
                throw new Error('L\'emoji de la catégorie est obligatoire');
            }
            
            if (!categoryData.color) {
                throw new Error('La couleur de la catégorie est obligatoire');
            }
            
            // Générer un ID unique
            const newId = categoryData.id || uuidv4();
            
            const newCategory = {
                id: newId,
                name: categoryData.name,
                emoji: categoryData.emoji,
                color: categoryData.color,
                createdAt: new Date().toISOString()
            };
            
            this.data.categories.push(newCategory);
            
            // Sauvegarder les modifications (asynchrone, sans attendre)
            this.saveData().catch(error => {
                this._handleError('Erreur lors de la sauvegarde après ajout de catégorie', error);
            });
            
            return { ...newCategory }; // Retourner une copie
        } catch (error) {
            this._handleError('Erreur lors de l\'ajout d\'une catégorie', error);
            throw error;
        }
    }
    
    /**
     * Met à jour une catégorie existante
     * @param {string} categoryId - ID de la catégorie à mettre à jour
     * @param {Object} updatedData - Nouvelles données
     * @returns {Object} - Catégorie mise à jour
     * @throws {Error} Si la catégorie n'existe pas ou si les données sont invalides
     */
    updateCategory(categoryId, updatedData) {
        try {
            const categoryIndex = this._findCategoryIndex(categoryId);
            
            // Vérifier les données minimales requises
            if (updatedData.name === '') {
                throw new Error('Le nom de la catégorie ne peut pas être vide');
            }
            
            // Mettre à jour la catégorie
            this.data.categories[categoryIndex] = {
                ...this.data.categories[categoryIndex],
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
            
            // Sauvegarder les modifications (asynchrone, sans attendre)
            this.saveData().catch(error => {
                this._handleError('Erreur lors de la sauvegarde après mise à jour de catégorie', error);
            });
            
            return { ...this.data.categories[categoryIndex] }; // Retourner une copie
        } catch (error) {
            this._handleError('Erreur lors de la mise à jour d\'une catégorie', error);
            throw error;
        }
    }
    
    /**
     * Trouve l'index d'une catégorie dans le tableau
     * @param {string} categoryId - ID de la catégorie
     * @returns {number} - Index de la catégorie
     * @throws {Error} Si la catégorie n'existe pas
     * @private
     */
    _findCategoryIndex(categoryId) {
        const categoryIndex = this.data.categories.findIndex(category => category.id === categoryId);
        
        if (categoryIndex === -1) {
            throw new Error(`Catégorie non trouvée: ${categoryId}`);
        }
        
        return categoryIndex;
    }
    
    /**
     * Supprime une catégorie
     * @param {string} categoryId - ID de la catégorie à supprimer
     * @returns {boolean} - Vrai si la suppression a réussi
     * @throws {Error} Si la catégorie n'existe pas
     */
    deleteCategory(categoryId) {
        try {
            const initialLength = this.data.categories.length;
            this.data.categories = this.data.categories.filter(category => category.id !== categoryId);
            
            if (this.data.categories.length === initialLength) {
                throw new Error(`Catégorie non trouvée: ${categoryId}`);
            }
            
            // Mettre à jour les événements qui utilisaient cette catégorie
            let affectedEvents = 0;
            this.data.events.forEach(event => {
                if (event.categoryId === categoryId) {
                    event.categoryId = null;
                    event.updatedAt = new Date().toISOString();
                    affectedEvents++;
                }
            });
            
            if (affectedEvents > 0) {
                console.log(`${affectedEvents} événement(s) modifié(s) suite à la suppression de la catégorie`);
            }
            
            // Sauvegarder les modifications (asynchrone, sans attendre)
            this.saveData().catch(error => {
                this._handleError('Erreur lors de la sauvegarde après suppression de catégorie', error);
            });
            
            return true;
        } catch (error) {
            this._handleError('Erreur lors de la suppression d\'une catégorie', error);
            throw error;
        }
    }
    
    /**
     * Obtient toutes les catégories
     * @returns {Array} - Liste des catégories
     */
    getAllCategories() {
        return [...this.data.categories]; // Retourner une copie du tableau
    }
    
    /**
     * Obtient une catégorie par ID
     * @param {string} categoryId - ID de la catégorie
     * @returns {Object|null} - La catégorie ou null si non trouvée
     */
    getCategoryById(categoryId) {
        if (!categoryId) return null;
        
        const category = this.data.categories.find(category => category.id === categoryId);
        
        if (!category) {
            console.warn(`Catégorie avec ID ${categoryId} non trouvée`);
            return null;
        }
        
        return { ...category }; // Retourner une copie pour éviter les modifications directes
    }
    
    /**
     * Obtient les événements par catégorie
     * @param {string} categoryId - ID de la catégorie
     * @returns {Array} - Liste des événements pour cette catégorie
     */
    getEventsByCategory(categoryId) {
        return this.data.events.filter(event => event.categoryId === categoryId);
    }
    
    // ===========================================================================
    // MÉTHODES DE GESTION DES PRÉFÉRENCES
    // ===========================================================================
    
    /**
     * Obtient toutes les préférences
     * @returns {Object} - Préférences de l'application
     */
    getPreferences() {
        return { ...this.data.preferences }; // Retourner une copie pour éviter les modifications directes
    }
    
    /**
     * Met à jour les préférences
     * @param {Object} newPreferences - Nouvelles préférences
     * @returns {Object} - Préférences mises à jour
     */
    updatePreferences(newPreferences) {
        try {
            // Fusionner les nouvelles préférences avec les existantes
            this.data.preferences = {
                ...this.data.preferences,
                ...newPreferences
            };
            
            // Sauvegarder les préférences
            this.savePreferences().catch(error => {
                this._handleError('Erreur lors de la sauvegarde des préférences', error);
            });
            
            return { ...this.data.preferences }; // Retourner une copie
        } catch (error) {
            this._handleError('Erreur lors de la mise à jour des préférences', error);
            throw error;
        }
    }
    
    // ===========================================================================
    // MÉTHODES UTILITAIRES
    // ===========================================================================
    
    /**
     * Gère les erreurs de manière standardisée
     * @param {string} message - Message d'erreur pour l'utilisateur
     * @param {Error} error - L'objet d'erreur
     * @private
     */
    _handleError(message, error) {
        // Journaliser l'erreur
        console.error(`${message}:`, error);
        
        // Déclencher un événement d'erreur pour la notification
        this._triggerErrorEvent(message);
        
        // Si des métriques de suivi sont implémentées, les mettre à jour ici
        // this._trackError(message, error);
    }
    
    /**
     * Déclenche un événement d'erreur pour afficher une notification
     * @param {string} message - Message d'erreur
     * @private
     */
    _triggerErrorEvent(message) {
        window.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                message: message,
                isError: true
            }
        }));
    }
    
    /**
     * Importe des données à partir d'un objet
     * @param {Object} data - Données à importer
     * @throws {Error} Si les données sont invalides
     */
    importData(data) {
        // Valider les données
        if (!this._validateImportedData(data)) {
            throw new Error('Format de données invalide');
        }
        
        // Mettre à jour les données
        this._importDataFromObject(data);
        
        // Valider les catégories des événements
        this._validateEventCategories();
        
        // Sauvegarder les données (asynchrone, sans attendre)
        this.saveData().catch(error => {
            this._handleError('Erreur lors de la sauvegarde après importation', error);
        });
        
        return true;
    }
}