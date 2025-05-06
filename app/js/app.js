// Point d'entrée principal de l'application SuperCalendrier
import { CalendarManager } from './calendar-manager.js';
import { EventManager } from './event-manager.js';
import { CategoryManager } from './category-manager.js';
import { UIManager } from './ui-manager.js';
import { ThemeManager } from './theme-manager.js';
import { NotificationManager } from './notification-manager.js';
import { PrintManager } from './print-manager.js';
import { DataManager } from './data-manager.js';

/**
 * Classe principale de l'application SuperCalendrier.
 * Coordonne l'initialisation et l'interaction entre tous les gestionnaires.
 */
class App {
    constructor() {
        console.log('Initialisation de SuperCalendrier...');
        
        // Initialisation progressive des gestionnaires
        this.initializeManagers();
    }
    
    /**
     * Initialise tous les gestionnaires de l'application
     * dans le bon ordre pour assurer les dépendances
     */
    initializeManagers() {
        // 1. Gestionnaire de données (base pour tous les autres gestionnaires)
        this.dataManager = new DataManager();
        
        // 2. Gestionnaires qui dépendent uniquement du gestionnaire de données
        this.themeManager = new ThemeManager();
        this.calendarManager = new CalendarManager();
        
        // 3. Gestionnaires de notification et d'impression (services utilitaires)
        this.notificationManager = new NotificationManager();
        this.printManager = new PrintManager();
        
        // 4. Gestionnaires qui utilisent les données et les fonctionnalités de base
        this.categoryManager = new CategoryManager(this.dataManager);
        this.eventManager = new EventManager(this.dataManager);
        
        // 5. Gestionnaire d'interface utilisateur (dépend de tous les autres)
        this.uiManager = new UIManager(
            this.calendarManager, 
            this.eventManager, 
            this.categoryManager,
            this.themeManager,
            this.notificationManager,
            this.printManager
        );
        
        // Initialiser l'application
        this.init();
    }
    
    /**
     * Initialise l'application en chargeant les données 
     * et en configurant les interactions
     */
    async init() {
        try {
            // 1. Charger les préférences (thème, format d'heure, etc.)
            await this.themeManager.loadPreferences();
            console.log('Préférences chargées avec succès');
            
            // 2. Charger les données (événements, catégories)
            await this.dataManager.loadData();
            console.log('Données chargées avec succès');
            
            // 3. Initialiser l'interface utilisateur et s'assurer que tous les éléments sont chargés
            // Attendre que le DOM soit complètement chargé pour éviter les problèmes d'initialisation des écouteurs
            if (document.readyState === 'complete') {
                this.uiManager.init();
            } else {
                window.addEventListener('load', () => {
                    this.uiManager.init();
                });
            }
            console.log('Interface utilisateur initialisée');
            
            // 4. Initialiser les événements Electron si disponible
            this.initElectronEvents();
            
            // 5. Afficher le calendrier initial
            this.calendarManager.renderCurrentView();
            console.log('Vue du calendrier rendue');
            
            // 6. Mise à jour forcée des événements après initialisation avec un délai suffisant
            setTimeout(() => {
                // Mettre à jour les événements dans la vue actuelle
                this.eventManager.updateEventsInCalendar(this.calendarManager);
                
                // Mettre à jour la liste des événements à venir
                this.eventManager.renderUpcomingEvents();
                
                console.log('Mise à jour initiale des événements effectuée');
                
                // 7. Planifier les notifications pour les événements à venir
                this.notificationManager.scheduleEventReminders(
                    this.dataManager.getAllEvents(),
                    this.themeManager.preferences
                );
                console.log('Rappels d\'événements planifiés');
                
                // 8. Afficher une notification de bienvenue
                this.notificationManager.showNotification('SuperCalendrier démarré avec succès');
                
                // 9. Vérification supplémentaire pour s'assurer que les écouteurs d'événements sont bien attachés
                console.log('Vérification des écouteurs d\'événements...');
                this.uiManager.verifyEventListeners();
            }, 500); // Augmenter le délai pour s'assurer que tout est bien initialisé
            
            console.log('SuperCalendrier initialisé avec succès!');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'application:', error);
            this.notificationManager.showNotification(
                'Erreur lors de l\'initialisation de l\'application. Veuillez réessayer.',
                true
            );
        }
    }

    /**
     * Initialise les événements spécifiques à Electron
     * si l'application est exécutée en mode desktop
     */
    initElectronEvents() {
        // Vérifier si l'API Electron est disponible
        if (!window.electronAPI) {
            console.warn('API Electron non disponible, le mode hors ligne sera utilisé');
            return;
        }
        
        console.log('Initialisation des événements Electron');
        
        // Événements du menu
        window.electronAPI.onNewCalendar(() => {
            if (confirm('Voulez-vous créer un nouveau calendrier ? Toutes les données existantes seront effacées.')) {
                this.dataManager.resetData();
                this.uiManager.updateUI();
                this.notificationManager.showNotification('Nouveau calendrier créé avec succès');
            }
        });
        
        window.electronAPI.onImportFile((event, filePath) => {
            console.log('Importation du fichier:', filePath);
            this.dataManager.importFromFile(filePath)
                .then(() => {
                    this.uiManager.updateUI();
                    this.notificationManager.showNotification('Données importées avec succès');
                })
                .catch(error => {
                    console.error('Erreur lors de l\'importation:', error);
                    this.notificationManager.showNotification(
                        'Erreur lors de l\'importation des données',
                        true
                    );
                });
        });
        
        window.electronAPI.onExportFile((event, filePath) => {
            console.log('Exportation vers le fichier:', filePath);
            this.dataManager.exportToFile(filePath)
                .then(() => {
                    this.notificationManager.showNotification('Données exportées avec succès');
                })
                .catch(error => {
                    console.error('Erreur lors de l\'exportation:', error);
                    this.notificationManager.showNotification(
                        'Erreur lors de l\'exportation des données',
                        true
                    );
                });
        });
        
        window.electronAPI.onOpenPreferences(() => {
            this.uiManager.openSettingsModal();
        });
        
        // Événements de vue
        window.electronAPI.onViewYearly(() => {
            this.calendarManager.setView('yearly');
            this.uiManager.updateViewButtons();
        });
        
        window.electronAPI.onViewMonthly(() => {
            this.calendarManager.setView('monthly');
            this.uiManager.updateViewButtons();
        });
        
        window.electronAPI.onViewWeekly(() => {
            this.calendarManager.setView('weekly');
            this.uiManager.updateViewButtons();
        });
        
        window.electronAPI.onViewDaily(() => {
            this.calendarManager.setView('daily');
            this.uiManager.updateViewButtons();
        });
        
        window.electronAPI.onViewToday(() => {
            this.calendarManager.goToToday();
        });
        
        // Événement d'exportation PDF
        window.addEventListener('print:exportPdf', (e) => {
            // Déléguer à Electron pour l'exportation PDF
            window.electronAPI.exportToPdf(e.detail);
        });
        
        console.log('Événements Electron initialisés');
    }
    
    /**
     * Arrête proprement l'application, en sauvegardant les données
     * et en nettoyant les ressources
     */
    async shutdown() {
        try {
            // Sauvegarder les données
            await this.dataManager.saveData();
            
            // Autres tâches de nettoyage si nécessaire
            
            console.log('SuperCalendrier arrêté avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'arrêt de SuperCalendrier:', error);
            return false;
        }
    }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Créer une instance de l'application
    const app = new App();
    
    // Exposer l'instance pour le débogage
    window.app = app;
    
    // Ajouter un gestionnaire pour la fermeture de la page
    window.addEventListener('beforeunload', async (e) => {
        // Tenter de sauvegarder les données avant la fermeture
        const success = await app.shutdown();
        
        // Si la sauvegarde a échoué, demander confirmation
        if (!success) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
});