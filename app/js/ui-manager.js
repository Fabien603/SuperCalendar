// Gestionnaire de l'interface utilisateur pour SuperCalendrier
import { DateUtils } from './utils/date-utils.js';

/**
 * Classe UIManager responsable de la gestion de l'interface utilisateur
 * Coordonne les interactions entre l'utilisateur et les différents gestionnaires
 */
export class UIManager {
    /**
     * Constructeur du gestionnaire d'interface utilisateur
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {EventManager} eventManager - Gestionnaire d'événements
     * @param {CategoryManager} categoryManager - Gestionnaire de catégories
     * @param {ThemeManager} themeManager - Gestionnaire de thèmes
     * @param {NotificationManager} notificationManager - Gestionnaire de notifications
     * @param {PrintManager} printManager - Gestionnaire d'impression
     */
    constructor(calendarManager, eventManager, categoryManager, themeManager, notificationManager, printManager) {
        // Références aux autres gestionnaires
        this.calendarManager = calendarManager;
        this.eventManager = eventManager;
        this.categoryManager = categoryManager;
        this.themeManager = themeManager;
        this.notificationManager = notificationManager;
        this.printManager = printManager;
        
        // Éléments de navigation
        this.viewButtons = document.querySelectorAll('.nav-item[data-view]');
        this.todayBtn = document.getElementById('today-btn');
        this.addEventBtn = document.getElementById('add-event-quick-btn');

        // Modales
        this.settingsModal = document.getElementById('settings-modal');
        this.importExportModal = document.getElementById('import-export-modal');
        this.printModal = document.getElementById('print-modal');
        this.categoriesModal = document.getElementById('categories-modal');
        
        // Boutons d'action
        this.settingsBtn = document.getElementById('settings-btn');
        this.importExportBtn = document.getElementById('import-export-btn');
        this.printBtn = document.getElementById('print-btn');
        this.addCategoryBtn = document.getElementById('add-category-btn');
        
        // Toggle sidebar pour le mode responsive
        this.toggleSidebarBtn = document.querySelector('.toggle-sidebar');
        this.sidebar = document.querySelector('.sidebar');
        
        // État du filtre par catégorie (unifié)
        this.categoryFilter = {
            categoryId: 'all', // 'all' ou ID de catégorie
            active: false      // Indique si un filtre est activé
        };
    }
    
    /**
     * Initialise le gestionnaire d'interface utilisateur
     */
    init() {
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
        
        // Initialiser les évènements personnalisés
        this.initCustomEvents();
        
        // Initialiser les interfaces
        this.updateUI();
    }

    /**
     * Initialise tous les écouteurs d'événements d'interface
     */
    initEventListeners() {
        // Navigation entre les vues
        this.viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const view = button.dataset.view;
                this.calendarManager.setView(view);
                this.updateViewButtons();
            });
        });
        
        // Bouton "Aujourd'hui"
        if (this.todayBtn) {
            this.todayBtn.addEventListener('click', () => {
                this.calendarManager.goToToday();
            });
        }
        
        // Bouton d'ajout rapide d'événement
        if (this.addEventBtn) {
            this.addEventBtn.addEventListener('click', () => {
                this.eventManager.openAddEventForm(new Date());
            });
        }

        // Bouton pour quitter l'application
        const quitAppBtn = document.getElementById('quit-app-btn');
        if (quitAppBtn) {
            quitAppBtn.addEventListener('click', () => {
                this.quitApplication();
            });
        }

        // Bouton d'ouverture de la modal des catégories
        if (this.addCategoryBtn) {
            this.addCategoryBtn.addEventListener('click', () => {
                this.openCategoriesModal();
            });
        }
        
        // Ouvrir la modal des paramètres
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => {
                this.openSettingsModal();
            });
        }
        
        // Ouvrir la modal d'import/export
        if (this.importExportBtn) {
            this.importExportBtn.addEventListener('click', () => {
                this.openImportExportModal();
            });
        }
        
        // Ouvrir la modal d'impression
        if (this.printBtn) {
            this.printBtn.addEventListener('click', () => {
                this.openPrintModal();
            });
        }
        
        // Toggle sidebar en mode responsive
        if (this.toggleSidebarBtn && this.sidebar) {
            this.toggleSidebarBtn.addEventListener('click', () => {
                this.sidebar.classList.toggle('active');
            });
        }
        
        // Fermer les modals en cliquant en dehors
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Fermer les modals avec le bouton de fermeture
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal-overlay').classList.remove('active');
            });
        });
        
        // Écouteurs pour l'import/export
        const exportJsonBtn = document.getElementById('export-json');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                this.exportData('json');
            });
        }
        
        const exportIcsBtn = document.getElementById('export-ics');
        if (exportIcsBtn) {
            exportIcsBtn.addEventListener('click', () => {
                this.exportData('ics');
            });
        }
        
        const importDataBtn = document.getElementById('import-data');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => {
                this.importData();
            });
        }
        
        // Écouteurs pour l'impression
        const printNowBtn = document.getElementById('print-now');
        if (printNowBtn) {
            printNowBtn.addEventListener('click', () => {
                this.printManager.print();
            });
        }
        
        const printPreviewBtn = document.getElementById('print-preview');
        if (printPreviewBtn) {
            printPreviewBtn.addEventListener('click', () => {
                this.printManager.preview();
            });
        }
        
        const exportPdfBtn = document.getElementById('export-pdf');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                this.printManager.exportToPdf();
            });
        }
        
        // Écouteurs pour les paramètres
        const saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
    }
    
    /**
     * Quitte l'application après confirmation et sauvegarde des données
     */
    quitApplication() {
        // Demander confirmation avant de quitter
        const confirmQuit = confirm('Êtes-vous sûr de vouloir quitter SuperCalendrier?');
        if (confirmQuit) {
            // Sauvegarder les données si nécessaire
            this.categoryManager.dataManager.saveData()
                .then(() => {
                    // Quitter l'application via l'API Electron
                    if (window.electronAPI) {
                        console.log('Tentative de fermeture de l\'application...');
                        window.electronAPI.quitApp()
                            .then(success => {
                                console.log('Résultat de la tentative de fermeture:', success);
                                // Si la fermeture par IPC échoue, tenter de fermer la fenêtre
                                if (!success && window.close) {
                                    console.log('Tentative de fermeture de la fenêtre...');
                                    window.close();
                                }
                            })
                            .catch(err => {
                                console.error('Erreur lors de la tentative de fermeture:', err);
                            });
                    } else if (window.close) {
                        // Fallback pour les navigateurs
                        window.close();
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la sauvegarde avant fermeture:', error);
                    // Quitter malgré l'erreur
                    if (window.electronAPI) {
                        window.electronAPI.quitApp();
                    } else if (window.close) {
                        window.close();
                    }
                });
        }
    }

    /**
     * Initialise les écouteurs d'événements personnalisés
     */
    initCustomEvents() {
        // Événements du calendrier
        window.addEventListener('calendar:eventsUpdated', () => {
            console.log('Événements mis à jour, rafraîchissement des vues...');
            this.updateCalendarEvents();
        });
        
        window.addEventListener('calendar:viewChanged', () => {
            this.updateCalendarEvents();
        });
        
        window.addEventListener('calendar:dateChanged', () => {
            this.updateCalendarEvents();
        });
        
        // Événements liés aux catégories
        window.addEventListener('categories:updated', () => {
            this.updateCategories();
            this.updateCalendarEvents();
        });
        
        window.addEventListener('categories:filter', (e) => {
            this.filterEventsByCategory(e.detail.categoryId);
        });
        
        window.addEventListener('categories:resetFilter', () => {
            this.resetCategoryFilter();
        });
        
        // Événement pour afficher les notifications
        window.addEventListener('notification:show', (e) => {
            this.notificationManager.showNotification(
                e.detail.message,
                e.detail.isError || false
            );
        });
    }

    /**
     * Met à jour l'ensemble de l'interface utilisateur
     */
    updateUI() {
        // Mettre à jour les catégories
        this.updateCategories();
        
        // Mettre à jour les événements
        this.updateCalendarEvents();
        
        // Mettre à jour les boutons de vue
        this.updateViewButtons();
        
        // Appliquer le thème
        this.themeManager.applyTheme();
    }
    
    /**
     * Met à jour le titre de la vue avec indication du filtre si actif
     */
    updateViewTitle() {
        const viewTitle = document.getElementById('current-view-title');
        if (!viewTitle) return;
        
        // Définir le titre de base selon la vue
        viewTitle.textContent = this.getCurrentViewName();
        
        // Ajouter l'indication du filtre si actif
        if (this.categoryFilter.active && this.categoryFilter.categoryId !== 'all') {
            try {
                const category = this.categoryManager.dataManager.getCategoryById(this.categoryFilter.categoryId);
                if (category) {
                    viewTitle.textContent += ` - ${category.emoji} ${category.name}`;
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de la catégorie:", error);
            }
        }
    }

    /**
     * Met à jour les boutons de vue en fonction de la vue active
     */
    updateViewButtons() {
        const currentView = this.calendarManager.currentView;
        
        // Mettre à jour les boutons de navigation
        this.viewButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.view === currentView) {
                button.classList.add('active');
            }
        });
        
        // Mettre à jour le titre avec prise en compte du filtre
        this.updateViewTitle();
    }
    
    /**
     * Met à jour les événements affichés dans le calendrier 
     * en appliquant le filtre actif si nécessaire
     */
    updateCalendarEvents() {
        // Récupérer tous les événements
        const allEvents = this.categoryManager.dataManager.getAllEvents();
        
        // Appliquer le filtre si nécessaire
        let eventsToShow = allEvents;
        
        if (this.categoryFilter.active && this.categoryFilter.categoryId !== 'all') {
            eventsToShow = allEvents.filter(event => 
                event.categoryId === this.categoryFilter.categoryId
            );
            console.log(`Filtre actif: ${this.categoryFilter.categoryId}, ${eventsToShow.length} événements correspondants`);
        }
        
        // Mise à jour des événements dans toutes les vues
        this.eventManager.updateEventsInCalendar(this.calendarManager, eventsToShow);
        
        // Mise à jour de la liste des événements à venir
        this.eventManager.renderUpcomingEvents(eventsToShow);
        
        // Mise à jour du titre pour indiquer le filtrage si actif
        this.updateViewTitle();
    }
    
    /**
     * Met à jour les catégories dans l'interface
     */
    updateCategories() {
        // Mettre à jour la liste des catégories
        this.categoryManager.renderCategories();
        
        // Mettre à jour la navigation des catégories
        this.categoryManager.renderCategoriesNav();
        
        // Mettre à jour le sélecteur de catégories
        this.categoryManager.updateCategorySelect();
    }
    
    /**
     * Applique un filtre par catégorie pour les événements
     * @param {string} categoryId - ID de la catégorie ou 'all' pour toutes les catégories
     */
    filterEventsByCategory(categoryId) {
        console.log('Application du filtre de catégorie:', categoryId);
        
        // Vérifier si c'est une réinitialisation
        const isReset = categoryId === 'all';
        
        // Mettre à jour l'état du filtre
        this.categoryFilter = {
            active: !isReset,
            categoryId: categoryId
        };
        
        // Mettre en évidence la catégorie dans la navigation
        this.highlightSelectedCategory(categoryId);
        
        // Appliquer le filtre à toutes les vues
        this.updateCalendarEvents();
        
        // Afficher une notification
        let message;
        if (isReset) {
            message = 'Affichage de tous les événements';
        } else {
            try {
                const category = this.categoryManager.dataManager.getCategoryById(categoryId);
                message = `Affichage des événements de la catégorie "${category ? category.name : 'sélectionnée'}"`;
            } catch (error) {
                message = "Filtrage par catégorie appliqué";
            }
        }
        
        this.notificationManager.showNotification(message);
    }

    /**
     * Réinitialise le filtre de catégories (affiche tous les événements)
     */
    resetCategoryFilter() {
        this.filterEventsByCategory('all');
    }
    
    /**
     * Vérifie si un filtre de catégorie est actuellement actif
     * @returns {boolean} Vrai si un filtre est actif
     */
    isCategoryFilterActive() {
        return this.categoryFilter.active;
    }
    
    /**
     * Retourne l'ID de la catégorie actuellement filtrée
     * @returns {string} ID de la catégorie ou 'all'
     */
    getCategoryFilterId() {
        return this.categoryFilter.categoryId;
    }

    /**
     * Obtient le nom de la vue actuelle en français
     * @returns {string} Nom de la vue actuelle
     */
    getCurrentViewName() {
        switch (this.calendarManager.currentView) {
            case 'yearly':
                return 'Vue annuelle';
            case 'monthly':
                return 'Vue mensuelle';
            case 'weekly':
                return 'Vue hebdomadaire';
            case 'daily':
                return 'Vue quotidienne';
            default:
                return 'Calendrier';
        }
    }
    
    /**
     * Met en évidence la catégorie sélectionnée dans la navigation
     * @param {string} categoryId - ID de la catégorie sélectionnée
     */
    highlightSelectedCategory(categoryId) {
        // Supprimer la classe active de tous les éléments de navigation de catégorie
        const categoryItems = document.querySelectorAll('#categories-nav .nav-item');
        categoryItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.categoryId === categoryId) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Ouvre la modal de gestion des catégories
     */
    openCategoriesModal() {
        if (this.categoriesModal) {
            // Réinitialiser le formulaire de catégorie
            this.categoryManager.resetCategoryForm();
            
            // Forcer une mise à jour de la liste des catégories
            this.categoryManager.renderCategoryList();
            
            // Afficher la modale
            this.categoriesModal.classList.add('active');
        }
    }
    
    /**
     * Ouvre la modal des paramètres
     */
    openSettingsModal() {
        if (!this.settingsModal) return;
        
        // Remplir les champs avec les valeurs actuelles
        const themeSelect = document.getElementById('settings-theme');
        const firstDaySelect = document.getElementById('settings-first-day');
        const timeFormatSelect = document.getElementById('settings-time-format');
        const notificationsSelect = document.getElementById('settings-notifications');
        const disableNotificationsTemp = document.getElementById('disable-notifications-temp');
        
        if (themeSelect) {
            themeSelect.value = this.themeManager.preferences.theme || 'system';
        }
        
        if (firstDaySelect) {
            firstDaySelect.value = this.calendarManager.firstDayOfWeek;
        }
        
        if (timeFormatSelect) {
            timeFormatSelect.value = this.themeManager.preferences.timeFormat || '24h';
        }
        
        if (notificationsSelect) {
            notificationsSelect.value = this.themeManager.preferences.notifications || 'all';
        }
        
        // Définir l'état de la case à cocher de désactivation temporaire des notifications
        if (disableNotificationsTemp && this.notificationManager) {
            disableNotificationsTemp.checked = !this.notificationManager.notificationsEnabled;
            
            // Ajouter un écouteur d'événement pour le changement de la case à cocher
            disableNotificationsTemp.addEventListener('change', () => {
                if (this.notificationManager) {
                    this.notificationManager.setNotificationsEnabled(!disableNotificationsTemp.checked);
                    
                    // Montrer un message à l'utilisateur
                    const message = disableNotificationsTemp.checked
                        ? 'Notifications temporairement désactivées'
                        : 'Notifications réactivées';
                    
                    // Afficher une notification uniquement si on active les notifications
                    if (!disableNotificationsTemp.checked) {
                        this.notificationManager.showNotification(message);
                    } else {
                        // Si désactivé, juste montrer un message dans la console
                        console.log(message);
                    }
                }
            });
        }
        
        // Afficher la modal
        this.settingsModal.classList.add('active');
    }

    /**
     * Sauvegarde les paramètres et applique les changements
     */
    async saveSettings() {
        // Récupérer les valeurs des champs
        const themeSelect = document.getElementById('settings-theme');
        const firstDaySelect = document.getElementById('settings-first-day');
        const timeFormatSelect = document.getElementById('settings-time-format');
        const notificationsSelect = document.getElementById('settings-notifications');
        const disableNotificationsTemp = document.getElementById('disable-notifications-temp');
        
        const newPreferences = {
            theme: themeSelect ? themeSelect.value : 'system',
            firstDayOfWeek: firstDaySelect ? parseInt(firstDaySelect.value) : 1,
            timeFormat: timeFormatSelect ? timeFormatSelect.value : '24h',
            notifications: notificationsSelect ? notificationsSelect.value : 'all'
        };
        
        // Mettre à jour les préférences
        this.themeManager.preferences = {...this.themeManager.preferences, ...newPreferences};
        
        // Mettre à jour le jour de début de semaine du calendrier
        this.calendarManager.firstDayOfWeek = newPreferences.firstDayOfWeek;
        
        // Sauvegarder les préférences
        await this.themeManager.savePreferences();
        
        // Appliquer le thème
        this.themeManager.applyTheme();
        
        // Mettre à jour l'état d'activation des notifications
        if (this.notificationManager) {
            const tempDisabled = disableNotificationsTemp && disableNotificationsTemp.checked;
            this.notificationManager.setNotificationsEnabled(!tempDisabled);
        }
        
        // Rafraîchir la vue du calendrier
        this.calendarManager.renderCurrentView();
        
        // Fermer la modal
        this.settingsModal.classList.remove('active');
        
        // Afficher une notification uniquement si les notifications sont activées
        if (this.notificationManager && this.notificationManager.notificationsEnabled) {
            this.notificationManager.showNotification('Paramètres enregistrés avec succès');
        } else {
            console.log('Paramètres enregistrés avec succès (notification non affichée - désactivée)');
        }
    }
    
    /**
     * Ouvre la modal d'import/export
     */
    openImportExportModal() {
        if (!this.importExportModal) return;
        
        // Réinitialiser les champs
        const importFile = document.getElementById('import-file');
        const importStatus = document.getElementById('import-status');
        
        if (importFile) {
            importFile.value = '';
        }
        
        if (importStatus) {
            importStatus.innerHTML = '';
        }
        
        // Afficher la modal
        this.importExportModal.classList.add('active');
    }
    
    /**
     * Exporte les données du calendrier
     * @param {string} format - Format d'export ('json' ou 'ics')
     */
    async exportData(format = 'json') {
        try {
            // Définir le nom de fichier par défaut
            let defaultFilename = 'supercalendrier-data.json';
            let mimeType = 'application/json';
            
            if (format === 'ics') {
                defaultFilename = 'supercalendrier-events.ics';
                mimeType = 'text/calendar';
            }
            
            // Récupérer les données
            let data;
            
            if (format === 'json') {
                // Exporter toutes les données
                data = JSON.stringify({
                    events: this.categoryManager.dataManager.getAllEvents(),
                    categories: this.categoryManager.dataManager.getAllCategories(),
                    version: '1.0.0',
                    exportDate: new Date().toISOString()
                }, null, 2);
            } else if (format === 'ics') {
                // Pour le format iCal, utiliser la méthode d'exportation du gestionnaire de données
                try {
                    data = await this.categoryManager.dataManager.exportToICS();
                } catch (error) {
                    throw new Error('Format iCal non encore pris en charge dans cette version');
                }
            }
            
            // Si l'API Electron est disponible, utiliser l'API de fichier native
            if (window.electronAPI && window.electronAPI.fileSystem) {
                // Proposer d'enregistrer le fichier
                const filePath = await window.electronAPI.fileSystem.saveFile({
                    title: 'Exporter les données',
                    defaultPath: defaultFilename,
                    filters: [
                        { name: format === 'json' ? 'Fichiers JSON' : 'Fichiers iCal', extensions: [format] }
                    ]
                });
                
                if (filePath) {
                    await window.electronAPI.fileSystem.writeFile(filePath, data);
                    this.notificationManager.showNotification('Données exportées avec succès');
                }
            } else {
                // Fallback pour les navigateurs : créer un lien de téléchargement
                const blob = new Blob([data], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = defaultFilename;
                a.click();
                
                // Nettoyer l'URL
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                
                this.notificationManager.showNotification('Données exportées avec succès');
            }
        } catch (error) {
            console.error('Erreur lors de l\'exportation des données:', error);
            this.notificationManager.showNotification('Erreur lors de l\'exportation des données', true);
        }
    }
    
    /**
     * Importe des données depuis un fichier
     */
    async importData() {
        try {
            const importFile = document.getElementById('import-file');
            const importStatus = document.getElementById('import-status');
            
            if (!importFile || !importFile.files || importFile.files.length === 0) {
                throw new Error('Aucun fichier sélectionné');
            }
            
            const file = importFile.files[0];
            
            // Mettre à jour le statut
            if (importStatus) {
                importStatus.innerHTML = '<div style="color: var(--info);">Importation en cours...</div>';
            }
            
            // Lire le fichier
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    
                    // Traiter le contenu en fonction du type de fichier
                    if (file.name.endsWith('.json')) {
                        // Importer les données JSON
                        const data = JSON.parse(content);
                        
                        // Valider les données
                        if (!data || (!data.events && !data.categories)) {
                            throw new Error('Format de données invalide');
                        }
                        
                        // Utiliser la méthode importData du gestionnaire de données
                        await this.categoryManager.dataManager.importData(data);
                        
                        // Mettre à jour l'interface
                        this.updateUI();
                        
                        // Mettre à jour le statut
                        if (importStatus) {
                            importStatus.innerHTML = '<div style="color: var(--success);">Importation réussie!</div>';
                        }
                        
                        // Afficher une notification
                        this.notificationManager.showNotification('Données importées avec succès');
                    } else if (file.name.endsWith('.ics')) {
                        // Importer les données iCal si la méthode existe
                        if (this.categoryManager.dataManager.importFromICS) {
                            await this.categoryManager.dataManager.importFromICS(content);
                            
                            // Mettre à jour l'interface
                            this.updateUI();
                            
                            // Mettre à jour le statut
                            if (importStatus) {
                                importStatus.innerHTML = '<div style="color: var(--success);">Importation réussie!</div>';
                            }
                            
                            // Afficher une notification
                            this.notificationManager.showNotification('Événements iCal importés avec succès');
                        } else {
                            throw new Error('Format iCal non encore pris en charge dans cette version');
                        }
                    } else {
                        throw new Error('Format de fichier non pris en charge');
                    }
                } catch (error) {
                    console.error('Erreur lors du traitement du fichier:', error);
                    
                    // Mettre à jour le statut
                    if (importStatus) {
                        importStatus.innerHTML = `<div style="color: var(--danger);">Erreur: ${error.message}</div>`;
                    }
                    
                    // Afficher une notification
                    this.notificationManager.showNotification('Erreur lors de l\'importation des données', true);
                }
            };
            
            reader.onerror = () => {
                console.error('Erreur lors de la lecture du fichier');
                
                // Mettre à jour le statut
                if (importStatus) {
                    importStatus.innerHTML = '<div style="color: var(--danger);">Erreur lors de la lecture du fichier</div>';
                }
                
                // Afficher une notification
                this.notificationManager.showNotification('Erreur lors de la lecture du fichier', true);
            };
            
            // Lire le fichier en tant que texte
            reader.readAsText(file);
        } catch (error) {
            console.error('Erreur lors de l\'importation des données:', error);
            
            // Mettre à jour le statut
            const importStatus = document.getElementById('import-status');
            if (importStatus) {
                importStatus.innerHTML = `<div style="color: var(--danger);">Erreur: ${error.message}</div>`;
            }
            
            // Afficher une notification
            this.notificationManager.showNotification('Erreur lors de l\'importation des données', true);
        }
    }

    /**
     * Ouvre la modal d'impression
     */
    openPrintModal() {
        if (!this.printModal) return;
        
        // Remplir les champs avec les valeurs actuelles
        const printView = document.getElementById('print-view');
        
        if (printView) {
            printView.value = this.calendarManager.currentView;
        }
        
        // Afficher la modal
        this.printModal.classList.add('active');
    }
}