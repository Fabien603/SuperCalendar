// Gestionnaire de données pour le stockage et le chargement des données du calendrier
import { v4 as uuidv4 } from './utils/uuid.js';

export class DataManager {
    constructor() {
        // Structure de données principale
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
    }
    
    // MÉTHODES DE BASE DE STOCKAGE ET CHARGEMENT
    
    // Charger les données depuis le stockage local ou Electron
    async loadData() {
        try {
            // Vérifier si l'API Electron est disponible
            if (window.electronAPI) {
                console.log('Chargement des données depuis Electron Store');
                
                // Charger les données du calendrier
                const calendarData = await window.electronAPI.getCalendarData();
                if (calendarData && Object.keys(calendarData).length > 0) {
                    console.log('Données trouvées dans Electron Store');
                    
                    // Vérifier et valider les données
                    if (this.validateImportedData(calendarData)) {
                        // Structure compatible avec la version actuelle
                        if (calendarData.events) this.data.events = calendarData.events;
                        if (calendarData.categories) this.data.categories = calendarData.categories;
                        
                        // Compatibilité avec les anciennes versions
                        if (calendarData.calendarData) {
                            // Ancienne structure - migration des données
                            console.log('Migration des données d\'une ancienne version');
                            if (calendarData.calendarData.events) this.data.events = calendarData.calendarData.events;
                            if (calendarData.calendarData.categories) this.data.categories = calendarData.calendarData.categories;
                        }
                    } else {
                        console.error('Structure de données incompatible - initialisation des valeurs par défaut');
                        this.initializeDefaultCategories();
                    }
                } else {
                    console.log('Aucune donnée trouvée - initialisation des valeurs par défaut');
                    this.initializeDefaultCategories();
                }
                
                // Charger les préférences
                const preferences = await window.electronAPI.getPreferences();
                if (preferences) {
                    this.data.preferences = { ...this.data.preferences, ...preferences };
                }
            } else {
                console.log('Chargement des données depuis le localStorage');
                
                // Fallback vers localStorage si Electron n'est pas disponible
                const savedData = localStorage.getItem('calendarAppData');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    
                    // Vérifier et valider les données
                    if (this.validateImportedData(parsedData)) {
                        if (parsedData.events) this.data.events = parsedData.events;
                        if (parsedData.categories) this.data.categories = parsedData.categories;
                        
                        // Compatibilité avec les anciennes versions
                        if (parsedData.calendarData) {
                            if (parsedData.calendarData.events) this.data.events = parsedData.calendarData.events;
                            if (parsedData.calendarData.categories) this.data.categories = parsedData.calendarData.categories;
                        }
                    } else {
                        console.error('Structure de données incompatible - initialisation des valeurs par défaut');
                        this.initializeDefaultCategories();
                    }
                } else {
                    console.log('Aucune donnée trouvée - initialisation des valeurs par défaut');
                    this.initializeDefaultCategories();
                }
                
                // Charger les préférences
                const savedPreferences = localStorage.getItem('calendarPreferences');
                if (savedPreferences) {
                    this.data.preferences = { ...this.data.preferences, ...JSON.parse(savedPreferences) };
                }
            }
            
            // Si aucune catégorie n'est définie, créer des catégories par défaut
            if (this.data.categories.length === 0) {
                this.initializeDefaultCategories();
            }
            
            // S'assurer que tous les événements référencent des catégories valides
            this.validateEventCategories();
            
            console.log('Données chargées avec succès:', this.data);
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            // En cas d'erreur, initialiser avec des valeurs par défaut
            this.initializeDefaultCategories();
            throw error;
        }
    }
    
    // Sauvegarder les données dans le stockage
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
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données:', error);
            throw error;
        }
    }
    
    // Sauvegarder les préférences
    async savePreferences() {
        try {
            if (window.electronAPI) {
                await window.electronAPI.savePreferences(this.data.preferences);
            } else {
                localStorage.setItem('calendarPreferences', JSON.stringify(this.data.preferences));
            }
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des préférences:', error);
            throw error;
        }
    }
    
    // Réinitialiser les données
    async resetData() {
        // Conserver uniquement les catégories et préférences
        this.data.events = [];
        
        // Mettre à jour la date de dernière modification
        this.data.lastModified = new Date().toISOString();
        
        // Sauvegarder les données
        await this.saveData();
        return true;
    }
    
    // Créer des catégories par défaut
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
    }
    
    // MÉTHODES D'IMPORTATION ET D'EXPORTATION
    
    // Valider les données importées
    validateImportedData(data) {
        // Vérifier que les données sont un objet
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Vérifier si les données contiennent les propriétés nécessaires
        // Accepter les données directes ou dans data.calendarData (compatibilité)
        const hasEvents = Array.isArray(data.events) || 
                         (data.calendarData && Array.isArray(data.calendarData.events));
        const hasCategories = Array.isArray(data.categories) || 
                             (data.calendarData && Array.isArray(data.calendarData.categories));
        
        return hasEvents || hasCategories;
    }
    
    // Valider les catégories des événements
    validateEventCategories() {
        // Créer un ensemble des IDs de catégories valides
        const validCategoryIds = new Set(this.data.categories.map(cat => cat.id));
        
        // Parcourir tous les événements et vérifier/corriger leurs catégories
        this.data.events.forEach(event => {
            // Si la catégorie n'existe pas, la définir à null
            if (event.categoryId && !validCategoryIds.has(event.categoryId)) {
                console.warn(`Catégorie invalide pour l'événement "${event.title}" (ID: ${event.id})`);
                event.categoryId = null;
            }
        });
    }
    
    // Importer des données depuis un fichier
    async importFromFile(filePath) {
        try {
            let data;
            
            if (window.electronAPI) {
                data = await window.electronAPI.fileSystem.importCalendarFile(filePath);
            } else {
                // Pour le cas où nous sommes dans un navigateur sans Electron
                // Cette partie serait différente en fonction de l'API Web utilisée
                const fileInput = document.getElementById('import-file');
                if (!fileInput?.files?.length) {
                    throw new Error('Aucun fichier sélectionné');
                }
                
                const file = fileInput.files[0];
                const content = await file.text();
                
                if (file.name.endsWith('.json')) {
                    data = JSON.parse(content);
                } else if (file.name.endsWith('.ics')) {
                    throw new Error('Format iCal non supporté dans ce mode');
                } else {
                    throw new Error('Format de fichier non supporté');
                }
            }
            
            // Vérifier la validité des données
            if (!this.validateImportedData(data)) {
                throw new Error('Format de données invalide');
            }
            
            // Mettre à jour les données
            if (data.events) {
                this.data.events = data.events;
            } else if (data.calendarData && data.calendarData.events) {
                this.data.events = data.calendarData.events;
            }
            
            if (data.categories) {
                this.data.categories = data.categories;
            } else if (data.calendarData && data.calendarData.categories) {
                this.data.categories = data.calendarData.categories;
            }
            
            // Valider les catégories des événements
            this.validateEventCategories();
            
            // Sauvegarder les données importées
            await this.saveData();
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'importation:', error);
            throw error;
        }
    }
    
    // Exporter les données vers un fichier
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
                
                await window.electronAPI.fileSystem.writeFile(
                    finalPath,
                    JSON.stringify(dataToExport, null, 2),
                    { encoding: 'utf8' }
                );
            } else {
                // Pour le cas où nous sommes dans un navigateur sans Electron
                const dataStr = JSON.stringify(dataToExport, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                
                const link = document.createElement('a');
                link.setAttribute('href', dataUri);
                link.setAttribute('download', 'calendrier-donnees.json');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'exportation:', error);
            throw error;
        }
    }
    
    // Exporter au format iCal (à implémenter ultérieurement)
    async exportToICS() {
        // Cette fonction serait utilisée pour exporter au format iCal
        throw new Error('Exportation iCal non encore implémentée');
    }
    
    // MÉTHODES DE GESTION DES ÉVÉNEMENTS
    
    // Ajouter un nouvel événement
    addEvent(eventData) {
        // Vérifier que les propriétés obligatoires sont présentes
        if (!eventData.title || !eventData.startDate || !eventData.endDate) {
            throw new Error('Les propriétés title, startDate et endDate sont obligatoires');
        }
        
        // Générer un ID unique pour l'événement
        const newEvent = {
            id: uuidv4(),
            ...eventData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Vérifier si la catégorie existe si elle est spécifiée
        if (newEvent.categoryId) {
            const categoryExists = this.data.categories.some(cat => cat.id === newEvent.categoryId);
            if (!categoryExists) {
                console.warn(`La catégorie avec l'ID ${newEvent.categoryId} n'existe pas. L'événement sera créé sans catégorie.`);
                newEvent.categoryId = null;
            }
        }
        
        // Ajouter l'événement à la liste
        this.data.events.push(newEvent);
        
        // Sauvegarder les modifications
        this.saveData().catch(error => {
            console.error('Erreur lors de la sauvegarde après ajout d\'événement:', error);
        });
        
        return newEvent;
    }
    
    // Mettre à jour un événement existant
    updateEvent(eventId, updatedData) {
        const eventIndex = this.data.events.findIndex(event => event.id === eventId);
        
        if (eventIndex === -1) {
            throw new Error('Événement non trouvé');
        }
        
        // Vérifier si la catégorie existe si elle est spécifiée
        if (updatedData.categoryId) {
            const categoryExists = this.data.categories.some(cat => cat.id === updatedData.categoryId);
            if (!categoryExists) {
                console.warn(`La catégorie avec l'ID ${updatedData.categoryId} n'existe pas. L'événement sera mis à jour sans catégorie.`);
                updatedData.categoryId = null;
            }
        }
        
        // Mettre à jour l'événement
        this.data.events[eventIndex] = {
            ...this.data.events[eventIndex],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
        
        // Sauvegarder les modifications
        this.saveData().catch(error => {
            console.error('Erreur lors de la sauvegarde après mise à jour d\'événement:', error);
        });
        
        return this.data.events[eventIndex];
    }
    
    // Supprimer un événement
    deleteEvent(eventId) {
        const initialLength = this.data.events.length;
        this.data.events = this.data.events.filter(event => event.id !== eventId);
        
        if (this.data.events.length === initialLength) {
            throw new Error('Événement non trouvé');
        }
        
        // Sauvegarder les modifications
        this.saveData().catch(error => {
            console.error('Erreur lors de la sauvegarde après suppression d\'événement:', error);
        });
        
        return true;
    }
    
    // Supprimer tous les événements d'une catégorie
    deleteEventsByCategory(categoryId) {
        const initialLength = this.data.events.length;
        this.data.events = this.data.events.filter(event => event.categoryId !== categoryId);
        
        // Sauvegarder les modifications (même si aucun événement n'a été supprimé)
        this.saveData().catch(error => {
            console.error('Erreur lors de la sauvegarde après suppression d\'événements par catégorie:', error);
        });
        
        return initialLength - this.data.events.length; // Retourne le nombre d'événements supprimés
    }
    
    // Obtenir tous les événements
    getAllEvents() {
        return [...this.data.events];
    }
    
    // Obtenir un événement par ID
    getEventById(eventId) {
        const event = this.data.events.find(event => event.id === eventId);
        
        if (!event) {
            throw new Error('Événement non trouvé');
        }
        
        return { ...event };
    }
    
    // Obtenir les événements par jour
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
            
            return (
                (eventStartDate <= endOfDay && eventEndDate >= startOfDay)
            );
        });
    }
    
    // Obtenir les événements par mois
    getEventsByMonth(year, month) {
        // Créer des objets Date pour la comparaison
        const startOfMonth = new Date(year, month, 1, 0, 0, 0);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        return this.data.events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            return (
                (eventStartDate <= endOfMonth && eventEndDate >= startOfMonth)
            );
        });
    }
    
    // Obtenir les événements futurs
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
    
    // MÉTHODES DE GESTION DES CATÉGORIES
    
    // Ajouter une nouvelle catégorie
    addCategory(categoryData) {
        // S'assurer que les propriétés obligatoires sont présentes
        if (!categoryData.name || !categoryData.emoji || !categoryData.color) {
            throw new Error('Les propriétés name, emoji et color sont obligatoires');
        }
        
        // Générer un ID unique
        const newId = uuidv4();
        
        const newCategory = {
            id: newId,
            ...categoryData,
            createdAt: new Date().toISOString()
        };
        
        this.data.categories.push(newCategory);
        
        // Sauvegarder les modifications
        this.saveData().catch(error => {
            console.error('Erreur lors de la sauvegarde après ajout de catégorie:', error);
        });
        
        return newCategory;
    }
    
    // Mettre à jour une catégorie existante
    updateCategory(categoryId, updatedData) {
        const categoryIndex = this.data.categories.findIndex(category => category.id === categoryId);
        
        if (categoryIndex === -1) {
            throw new Error('Catégorie non trouvée');
        }
        
        // Mettre à jour la catégorie
        this.data.categories[categoryIndex] = {
            ...this.data.categories[categoryIndex],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
        
        // Sauvegarder les modifications
        this.saveData().catch(error => {
            console.error('Erreur lors de la sauvegarde après mise à jour de catégorie:', error);
        });
        
        return this.data.categories[categoryIndex];
    }
    
    // Supprimer une catégorie
    deleteCategory(categoryId) {
        const initialLength = this.data.categories.length;
        this.data.categories = this.data.categories.filter(category => category.id !== categoryId);
        
        if (this.data.categories.length === initialLength) {
            throw new Error('Catégorie non trouvée');
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
        
        // Sauvegarder les modifications
        this.saveData().catch(error => {
            console.error('Erreur lors de la sauvegarde après suppression de catégorie:', error);
        });
        
        return true;
    }
    
    // Obtenir toutes les catégories
    getAllCategories() {
        return [...this.data.categories];
    }
    
    // Obtenir une catégorie par ID
    getCategoryById(categoryId) {
        if (!categoryId) return null; // Si l'ID est null ou undefined
        
        const category = this.data.categories.find(category => category.id === categoryId);
        
        if (!category) {
            console.warn(`Catégorie avec ID ${categoryId} non trouvée, utilisation d'une valeur par défaut`);
            return null; // Retourner null au lieu de lancer une erreur
        }
        
        return { ...category };
    }
    
    // Obtenir les événements par catégorie
    getEventsByCategory(categoryId) {
        return this.data.events.filter(event => event.categoryId === categoryId);
    }
    
    // MÉTHODES DE GESTION DES PRÉFÉRENCES
    
    // Obtenir toutes les préférences
    getPreferences() {
        return { ...this.data.preferences };
    }
    
    // Mettre à jour les préférences
    updatePreferences(newPreferences) {
        this.data.preferences = {
            ...this.data.preferences,
            ...newPreferences
        };
        
        // Sauvegarder les préférences
        this.savePreferences().catch(error => {
            console.error('Erreur lors de la sauvegarde des préférences:', error);
        });
        
        return this.data.preferences;
    }
}