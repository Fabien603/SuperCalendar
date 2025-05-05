
import { DateUtils } from './utils/date-utils.js';

export class UIManager {
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
        this.quitAppBtn = document.getElementById('quit-app-btn');

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
        
        // Propriété pour stocker le filtre actif
        this.activeFilter = 'all'; // 'all' ou ID de catégorie
    }
    
    init() {
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
        
        // Initialiser les évènements personnalisés
        this.initCustomEvents();
        
        // Initialiser les interfaces
        this.updateUI();
    }
    
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
    
    // Initialiser les événements personnalisés
    initCustomEvents() {
        // Écouteur pour les events personnalisés
        window.addEventListener('calendar:eventsUpdated', () => {
            // Force une mise à jour complète des événements
            console.log('Événements mis à jour, rafraîchissement des vues...');
            
            // Mettre à jour les événements dans la vue actuelle
            this.updateCalendarEvents();
        });
        
        window.addEventListener('calendar:viewChanged', () => {
            // Mise à jour nécessaire après un changement de vue
            this.updateCalendarEvents();
        });
        
        window.addEventListener('calendar:dateChanged', () => {
            // Mise à jour nécessaire après un changement de date
            this.updateCalendarEvents();
        });
        
        // Événements liés aux catégories
        window.addEventListener('categories:updated', () => {
            this.updateCategories();
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
    
    quitApplication() {
        // Demander confirmation avant de quitter
        const confirmQuit = confirm('Êtes-vous sûr de vouloir quitter SuperCalendrier?');
        if (confirmQuit) {
            // Sauvegarder les données si nécessaire
            this.categoryManager.dataManager.saveData()
                .then(() => {
                    // Quitter l'application via l'API Electron
                    if (window.electronAPI) {
                        window.electronAPI.quitApp();
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la sauvegarde avant fermeture:', error);
                    // Quitter malgré l'erreur
                    if (window.electronAPI) {
                        window.electronAPI.quitApp();
                    }
                });
        }
    }

    // Mettre à jour l'interface
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
    
    // Mettre à jour les boutons de vue
    updateViewButtons() {
        const currentView = this.calendarManager.currentView;
        
        // Mettre à jour les boutons de navigation
        this.viewButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.view === currentView) {
                button.classList.add('active');
            }
        });
        
        // Mettre à jour le titre de la page
        const viewTitle = document.getElementById('current-view-title');
        if (viewTitle) {
            switch (currentView) {
                case 'yearly':
                    viewTitle.textContent = 'Vue annuelle';
                    break;
                case 'monthly':
                    viewTitle.textContent = 'Vue mensuelle';
                    break;
                case 'weekly':
                    viewTitle.textContent = 'Vue hebdomadaire';
                    break;
                case 'daily':
                    viewTitle.textContent = 'Vue quotidienne';
                    break;
            }
            
            // Si un filtre est actif, ajouter le nom de la catégorie au titre
            if (this.activeFilter !== 'all') {
                try {
                    const category = this.categoryManager.dataManager.getCategoryById(this.activeFilter);
                    if (category) {
                        viewTitle.textContent += ` - ${category.emoji} ${category.name}`;
                    }
                } catch (error) {
                    console.error("Catégorie non trouvée:", error);
                }
            }
        }
    }
    
    // Mettre à jour les événements du calendrier
    updateCalendarEvents() {
        // Vérifier s'il y a un filtre actif
        if (this.activeFilter && this.activeFilter !== 'all') {
            this.updateCalendarEventsWithFilter();
        } else {
            // Comportement standard sans filtre
            this.eventManager.updateEventsInCalendar(this.calendarManager);
            this.eventManager.renderUpcomingEvents();
        }
    }

    // Mettre à jour les événements du calendrier avec un filtre actif
    updateCalendarEventsWithFilter() {
        // Récupérer tous les événements
        const allEvents = this.categoryManager.dataManager.getAllEvents();
        
        // Déterminer quels événements afficher
        let eventsToShow;
        
        if (!this.activeFilter || this.activeFilter === 'all') {
            // Pas de filtre actif, utiliser tous les événements
            eventsToShow = allEvents;
            console.log("Affichage de tous les événements (pas de filtre actif)");
        } else {
            // Filtrer les événements par catégorie
            eventsToShow = allEvents.filter(event => event.categoryId === this.activeFilter);
            console.log(`Affichage des événements de la catégorie ${this.activeFilter}, ${eventsToShow.length} événements trouvés`);
        }
        
        // Mettre à jour les événements dans le calendrier avec les événements filtrés
        this.eventManager.updateEventsInCalendar(this.calendarManager, eventsToShow);
        
        // Mettre à jour la liste des événements à venir
        this.eventManager.renderUpcomingEvents(eventsToShow);
    }
    
    // Mettre à jour les catégories
    updateCategories() {
        // Mettre à jour la liste des catégories
        this.categoryManager.renderCategories();
        
        // Mettre à jour la navigation des catégories
        this.categoryManager.renderCategoriesNav();
        
        // Mettre à jour le sélecteur de catégories
        this.categoryManager.updateCategorySelect();
    }
    
    // Filtrer les événements par catégorie
    filterEventsByCategory(categoryId) {
        console.log('Filtrer les événements par catégorie:', categoryId);
        
        // Obtenir la catégorie sélectionnée
        let category = null;
        try {
            if (categoryId !== 'all') {
                category = this.categoryManager.dataManager.getCategoryById(categoryId);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de la catégorie:', error);
        }
        
        // Mettre à jour le titre pour indiquer le filtrage
        const viewTitle = document.getElementById('current-view-title');
        if (viewTitle) {
            if (category) {
                viewTitle.textContent = `${this.getCurrentViewName()} - ${category.emoji} ${category.name}`;
            } else if (categoryId === 'all') {
                // Réinitialiser le titre en fonction de la vue actuelle
                viewTitle.textContent = this.getCurrentViewName();
            }
        }
        
        // Mettre en évidence la catégorie sélectionnée dans la navigation
        this.highlightSelectedCategory(categoryId);
        
        // Stocker le filtre actif
        this.activeFilter = categoryId;
        
        // Appliquer le filtre aux vues du calendrier et aux événements à venir
        this.updateCalendarEventsWithFilter();
        
        // Afficher une notification
        if (categoryId === 'all') {
            this.notificationManager.showNotification('Affichage de tous les événements');
        } else {
            this.notificationManager.showNotification(`Affichage des événements de la catégorie "${category ? category.name : 'sélectionnée'}"`);
        }
    }
    
    // Obtenir le nom de la vue actuelle
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

    // Réinitialiser le filtre de catégories
    resetCategoryFilter() {
        this.filterEventsByCategory('all');
    }
    
    // Mettre en évidence la catégorie sélectionnée dans la navigation
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

    // Ouvrir la modal des catégories
    openCategoriesModal() {
        if (this.categoriesModal) {
            // Réinitialiser le formulaire de catégorie
            this.categoryManager.resetCategoryForm();
            // Forcer une mise à jour de la liste des catégories
            this.categoryManager.renderCategories();
            // Afficher la modale
            this.categoriesModal.classList.add('active');
        }
    }
    
    // Ouvrir la modal des paramètres
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

    // Sauvegarder les paramètres
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
    
    // Ouvrir la modal d'import/export
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
    
    // Exporter les données
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
                // Pour le format iCal, utiliser ical-generator si disponible
                if (window.icalGenerator) {
                    data = await this.categoryManager.dataManager.exportToICS();
                } else {
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
    
    // Importer des données
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
                        if (!data || !data.events || !data.categories) {
                            throw new Error('Format de données invalide');
                        }
                        
                        // Fusionner ou remplacer les données existantes
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
                        // Importer les données iCal si la fonctionnalité est disponible
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

    // Ouvrir la modal d'impression
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