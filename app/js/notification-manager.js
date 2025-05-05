/**
 * @fileoverview Gestionnaire des notifications et des rappels d'événements
 * Responsable de l'affichage des notifications dans l'application et des rappels système
 * @module NotificationManager
 */

/**
 * Classe NotificationManager
 * Gère l'affichage des notifications dans l'application et les rappels système pour les événements
 */
export class NotificationManager {
    /**
     * Crée une instance du gestionnaire de notifications
     */
    constructor() {
        /**
         * Élément DOM de la notification
         * @type {HTMLElement}
         * @private
         */
        this._notificationElement = document.getElementById('notification');
        
        /**
         * Élément DOM pour le message de la notification
         * @type {HTMLElement}
         * @private
         */
        this._notificationMessage = document.getElementById('notification-message');
        
        /**
         * File d'attente des notifications
         * @type {Array<{message: string, isError: boolean, priority: number}>}
         * @private
         */
        this._notificationQueue = [];
        
        /**
         * Indique si une notification est en cours d'affichage
         * @type {boolean}
         * @private
         */
        this._isShowingNotification = false;
        
        /**
         * État d'activation des notifications
         * @type {boolean}
         * @private
         */
        this._notificationsEnabled = true;
        
        /**
         * Stockage des timeouts pour les rappels d'événements
         * @type {Map<string, Array<{id: string, timeoutId: number, label: string, time: Date}>>}
         * @private
         */
        this._reminderTimeouts = new Map();
        
        /**
         * Permissions de notification système
         * @type {string}
         * @private
         */
        this._notificationPermission = 'default';
        
        // Vérifier si les éléments de notification existent
        if (!this._notificationElement || !this._notificationMessage) {
            this._handleError('Éléments de notification non trouvés dans le DOM');
        }
        
        // Initialiser les écouteurs d'événements
        this._initEventListeners();
        
        // Charger les préférences de notification
        this._loadNotificationPreferences();
        
        // Vérifier les permissions de notification
        this._checkNotificationPermission().then(permission => {
            this._notificationPermission = permission;
            console.log(`Permissions de notification: ${permission}`);
        });
    }
    
    /**
     * Initialise tous les écouteurs d'événements pour les notifications
     * @private
     */
    _initEventListeners() {
        // Écouteur pour les événements de notification personnalisés
        window.addEventListener('notification:show', (e) => {
            const { message, isError = false, priority = 1 } = e.detail;
            this.showNotification(message, isError, priority);
        });
        
        // Écouteur pour les modifications des préférences
        window.addEventListener('preferences:updated', (e) => {
            if (e.detail && e.detail.preferences) {
                this._updateNotificationPreferences(e.detail.preferences);
            }
        });
        
        // Écouteur pour les modifications d'événements (pour mettre à jour les rappels)
        window.addEventListener('calendar:eventsUpdated', () => {
            this._updateEventReminders();
        });
        
        // Écouteur pour la fermeture de l'application
        window.addEventListener('beforeunload', () => {
            this.cancelAllReminders();
        });
    }
    
    /**
     * Charge les préférences de notification depuis le gestionnaire de données
     * @private
     */
    _loadNotificationPreferences() {
        try {
            const dataManager = window.app?.dataManager;
            if (dataManager) {
                const preferences = dataManager.getPreferences();
                this._updateNotificationPreferences(preferences);
            }
        } catch (error) {
            this._handleError('Erreur lors du chargement des préférences de notification', error);
        }
    }
    
    /**
     * Met à jour les préférences de notifications
     * @param {Object} preferences - Préférences de l'application
     * @private
     */
    _updateNotificationPreferences(preferences) {
        if (preferences && preferences.notifications) {
            // Mettre à jour l'état d'activation en fonction des préférences
            this._notificationsEnabled = preferences.notifications !== 'none';
            
            // Mise à jour des rappels si changement d'état
            if (this._notificationsEnabled) {
                this._updateEventReminders();
            } else {
                this.cancelAllReminders();
            }
            
            console.log(`Notifications ${this._notificationsEnabled ? 'activées' : 'désactivées'}`);
        }
    }
    
    /**
     * Met à jour les rappels d'événements suite à une modification
     * @private
     */
    _updateEventReminders() {
        // Annuler tous les rappels existants
        this.cancelAllReminders();
        
        // Replanifier les rappels avec les données à jour
        const dataManager = window.app?.dataManager;
        if (dataManager && this._notificationsEnabled) {
            const events = dataManager.getAllEvents();
            const preferences = dataManager.getPreferences();
            
            this.scheduleEventReminders(events, preferences);
        }
    }
    
    /**
     * Gère les erreurs de manière standardisée
     * @param {string} message - Message d'erreur
     * @param {Error} [error] - Objet d'erreur (optionnel)
     * @private
     */
    _handleError(message, error) {
        console.error(`NotificationManager: ${message}`, error || '');
        
        // Enregistrer l'erreur dans les logs si l'API Electron est disponible
        if (window.electronAPI && window.electronAPI.logger) {
            window.electronAPI.logger.error(`NotificationManager: ${message}`, error || '');
        }
    }
    
    /**
     * Définit l'état d'activation des notifications
     * @param {boolean} enabled - État d'activation
     */
    setNotificationsEnabled(enabled) {
        const previousState = this._notificationsEnabled;
        this._notificationsEnabled = enabled;
        
        // Si l'état a changé, mettre à jour les préférences
        if (previousState !== enabled) {
            try {
                const dataManager = window.app?.dataManager;
                if (dataManager) {
                    const preferences = dataManager.getPreferences();
                    dataManager.updatePreferences({
                        ...preferences,
                        notifications: enabled ? 'all' : 'none'
                    });
                }
                
                // Mettre à jour les rappels en fonction de l'état
                if (enabled) {
                    this._updateEventReminders();
                } else {
                    this.cancelAllReminders();
                }
                
                console.log(`Notifications ${enabled ? 'activées' : 'désactivées'}`);
            } catch (error) {
                this._handleError('Erreur lors de la mise à jour des préférences de notification', error);
            }
        }
    }
    
    /**
     * Affiche une notification dans l'application
     * @param {string} message - Message à afficher
     * @param {boolean} [isError=false] - Indique si c'est une erreur
     * @param {number} [priority=1] - Priorité de la notification (1 = normale, 2 = haute, 0 = basse)
     */
    showNotification(message, isError = false, priority = 1) {
        // Vérifier si les notifications sont désactivées
        if (!this._notificationsEnabled) {
            console.log(`Notification non affichée (désactivée): ${message}`);
            return;
        }
        
        // Ajouter la notification à la file d'attente avec sa priorité
        this._notificationQueue.push({ message, isError, priority });
        
        // Trier la file par priorité (décroissante)
        this._notificationQueue.sort((a, b) => b.priority - a.priority);
        
        // Afficher si aucune notification n'est en cours d'affichage
        if (!this._isShowingNotification) {
            this._processNotificationQueue();
        }
    }
    
    /**
     * Traite la file d'attente des notifications
     * @private
     */
    _processNotificationQueue() {
        // Vérifier s'il y a des notifications en attente
        if (this._notificationQueue.length > 0) {
            // Marquer comme en cours d'affichage
            this._isShowingNotification = true;
            
            // Récupérer la prochaine notification
            const notification = this._notificationQueue.shift();
            
            // Afficher la notification
            this._displayNotification(notification.message, notification.isError);
        } else {
            // Aucune notification en attente
            this._isShowingNotification = false;
        }
    }
    
    /**
     * Affiche une notification à l'écran
     * @param {string} message - Message à afficher
     * @param {boolean} isError - Indique si c'est une erreur
     * @private
     */
    _displayNotification(message, isError = false) {
        // Vérifier si les éléments existent
        if (!this._notificationElement || !this._notificationMessage) {
            this._handleError('Éléments de notification non trouvés dans le DOM');
            return;
        }
        
        // Définir le message
        this._notificationMessage.textContent = message;
        
        // Définir la classe en fonction du type
        this._notificationElement.className = isError ? 'notification error show' : 'notification show';
        
        // Masquer la notification après un délai
        const displayDuration = isError ? 5000 : 3000; // Durée plus longue pour les erreurs
        
        setTimeout(() => {
            this._notificationElement.className = isError ? 'notification error' : 'notification';
            
            // Attendre la fin de l'animation avant de traiter la prochaine notification
            setTimeout(() => {
                this._processNotificationQueue();
            }, 300);
        }, displayDuration);
    }
    
    /**
     * Affiche une notification système native (si disponible via Electron)
     * @param {string} title - Titre de la notification
     * @param {string} body - Corps de la notification
     * @param {Object} [options={}] - Options supplémentaires
     * @param {string} [options.icon] - Chemin de l'icône
     * @param {boolean} [options.silent] - Indique si la notification doit être silencieuse
     * @param {Function} [options.onClick] - Fonction appelée lors du clic sur la notification
     * @returns {Notification|null} - L'objet Notification ou null si non disponible
     */
    showSystemNotification(title, body, options = {}) {
        // Vérifier si les notifications sont désactivées
        if (!this._notificationsEnabled) {
            console.log(`Notification système non affichée (désactivée): ${title} - ${body}`);
            return null;
        }
        
        // Définir les options par défaut
        const defaultOptions = {
            icon: '/app/assets/icon.png',
            silent: false,
            onClick: null
        };
        
        // Fusionner avec les options fournies
        const notificationOptions = { ...defaultOptions, ...options };
        
        try {
            // Essayer d'utiliser les notifications Electron d'abord (plus fiables)
            if (window.electronAPI && window.electronAPI.showNotification) {
                window.electronAPI.showNotification({
                    title,
                    body,
                    icon: notificationOptions.icon,
                    silent: notificationOptions.silent
                });
                
                // Afficher également dans l'application pour la cohérence
                this.showNotification(body);
                
                return null; // Pas d'objet à retourner car géré par Electron
            }
            
            // Sinon, utiliser l'API Web Notifications si disponible
            else if (window.Notification) {
                // Vérifier l'autorisation
                if (this._notificationPermission === 'granted') {
                    // Créer la notification
                    const notification = new Notification(title, {
                        body,
                        icon: notificationOptions.icon,
                        silent: notificationOptions.silent
                    });
                    
                    // Événement de clic sur la notification
                    if (notificationOptions.onClick) {
                        notification.onclick = notificationOptions.onClick;
                    } else {
                        // Comportement par défaut: mettre le focus sur l'application
                        notification.onclick = () => {
                            window.focus();
                            notification.close();
                        };
                    }
                    
                    // Afficher également dans l'application pour la cohérence
                    this.showNotification(body);
                    
                    return notification;
                } 
                else if (this._notificationPermission === 'default') {
                    // Demander l'autorisation et réessayer
                    this._requestNotificationPermission().then(permission => {
                        if (permission === 'granted') {
                            return this.showSystemNotification(title, body, options);
                        } else {
                            // Fallback vers la notification interne
                            this.showNotification(body);
                            return null;
                        }
                    });
                }
                else {
                    // Permissions refusées, fallback vers la notification interne
                    this.showNotification(body);
                    return null;
                }
            } 
            else {
                // API non disponible, fallback vers la notification interne
                this.showNotification(body);
                return null;
            }
        } catch (error) {
            this._handleError('Erreur lors de l\'affichage de la notification système', error);
            
            // Fallback vers la notification interne
            this.showNotification(body);
            return null;
        }
        
        return null;
    }
    
    /**
     * Vérifie si les notifications sont autorisées
     * @returns {Promise<string>} - La permission ('granted', 'denied', 'default')
     * @private
     */
    async _checkNotificationPermission() {
        if (window.Notification) {
            return Notification.permission;
        }
        return 'denied';
    }
    
    /**
     * Demande l'autorisation pour les notifications
     * @returns {Promise<string>} - La permission accordée
     * @private
     */
    async _requestNotificationPermission() {
        if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            try {
                const permission = await Notification.requestPermission();
                this._notificationPermission = permission;
                return permission;
            } catch (error) {
                this._handleError('Erreur lors de la demande d\'autorisation pour les notifications', error);
                return 'denied';
            }
        }
        
        return this._notificationPermission;
    }
    
    /**
     * Planifie les notifications pour les rappels d'événements
     * @param {Array<Object>} events - Liste des événements
     * @param {Object} preferences - Préférences utilisateur
     */
    scheduleEventReminders(events, preferences) {
        // Vérifier si les notifications sont activées
        if (!preferences || preferences.notifications === 'none' || !this._notificationsEnabled) {
            console.log('Rappels d\'événements non planifiés (notifications désactivées)');
            return;
        }
        
        // Pour chaque événement, planifier les rappels
        events.forEach(event => {
            this._scheduleEventReminder(event, preferences);
        });
        
        console.log(`Rappels programmés pour ${events.length} événements`);
    }
    
    /**
     * Planifie des rappels pour un événement spécifique
     * @param {Object} event - Événement pour lequel planifier des rappels
     * @param {Object} preferences - Préférences utilisateur
     * @private
     */
    _scheduleEventReminder(event, preferences) {
        if (!event.startDate) return;
        
        let startTime;
        
        try {
            // Construire la date de début correctement
            if (event.startTime) {
                const [hours, minutes] = event.startTime.split(':').map(Number);
                startTime = new Date(event.startDate);
                startTime.setHours(hours, minutes, 0, 0);
            } else {
                // Pour les événements toute la journée, utiliser le début de la journée
                startTime = new Date(event.startDate);
                startTime.setHours(0, 0, 0, 0);
            }
            
            const now = new Date();
            
            // Vérifier si l'événement est dans le futur
            if (startTime <= now) {
                return; // Ne pas planifier de rappels pour les événements passés
            }
            
            // Définir les délais de rappel en fonction de l'importance
            const reminderTimes = [];
            
            // Si toutes les notifications sont activées ou si l'événement est important
            if (preferences.notifications === 'all' || 
                (preferences.notifications === 'important' && event.isImportant)) {
                
                // Définir les délais standards
                reminderTimes.push(
                    { delay: 15 * 60 * 1000, label: '15 minutes' },  // 15 minutes
                    { delay: 60 * 60 * 1000, label: '1 heure' },     // 1 heure
                    { delay: 24 * 60 * 60 * 1000, label: '1 jour' }  // 1 jour
                );
                
                // Ajouter un rappel supplémentaire pour les événements importants
                if (event.isImportant) {
                    reminderTimes.push(
                        { delay: 3 * 24 * 60 * 60 * 1000, label: '3 jours' } // 3 jours
                    );
                }
            }
            
            // Planifier les rappels
            reminderTimes.forEach(reminder => {
                const reminderTime = new Date(startTime.getTime() - reminder.delay);
                
                // Vérifier si le rappel est encore dans le futur
                if (reminderTime > now) {
                    // Générer un ID unique pour ce rappel
                    const reminderId = `${event.id}_${reminder.label}_${Date.now()}`;
                    
                    // Créer le timeout
                    const timeoutId = setTimeout(() => {
                        // Vérifier si les notifications sont toujours activées
                        if (this._notificationsEnabled) {
                            this._showEventReminder(event, reminder.label);
                        }
                        
                        // Supprimer le timeout de la Map après exécution
                        this._removeReminderTimeout(event.id, reminderId);
                    }, reminderTime.getTime() - now.getTime());
                    
                    // Stocker l'ID du timeout pour pouvoir l'annuler si nécessaire
                    this._storeReminderTimeout(event.id, reminderId, timeoutId, reminder.label, reminderTime);
                }
            });
        } catch (error) {
            this._handleError(`Erreur lors de la planification des rappels pour l'événement ${event.id}`, error);
        }
    }
    
    /**
     * Stocke un ID de timeout pour un rappel
     * @param {string} eventId - ID de l'événement
     * @param {string} reminderId - ID unique du rappel
     * @param {number} timeoutId - ID du timeout JavaScript
     * @param {string} label - Description du rappel
     * @param {Date} reminderTime - Date et heure du rappel
     * @private
     */
    _storeReminderTimeout(eventId, reminderId, timeoutId, label, reminderTime) {
        if (!this._reminderTimeouts.has(eventId)) {
            this._reminderTimeouts.set(eventId, []);
        }
        
        this._reminderTimeouts.get(eventId).push({
            id: reminderId,
            timeoutId,
            label,
            time: reminderTime
        });
        
        console.log(`Rappel programmé: ${label} pour l'événement ${eventId} à ${reminderTime.toLocaleString()}`);
    }
    
    /**
     * Supprime un rappel spécifique de la liste
     * @param {string} eventId - ID de l'événement
     * @param {string} reminderId - ID du rappel
     * @private
     */
    _removeReminderTimeout(eventId, reminderId) {
        if (this._reminderTimeouts.has(eventId)) {
            const timeouts = this._reminderTimeouts.get(eventId);
            const updatedTimeouts = timeouts.filter(item => item.id !== reminderId);
            
            if (updatedTimeouts.length === 0) {
                this._reminderTimeouts.delete(eventId);
            } else {
                this._reminderTimeouts.set(eventId, updatedTimeouts);
            }
        }
    }
    
    /**
     * Annule les rappels pour un événement
     * @param {string} eventId - ID de l'événement
     * @returns {number} - Nombre de rappels annulés
     */
    cancelEventReminders(eventId) {
        if (!this._reminderTimeouts.has(eventId)) {
            return 0;
        }
        
        const timeouts = this._reminderTimeouts.get(eventId);
        let canceledCount = 0;
        
        timeouts.forEach(({ timeoutId }) => {
            clearTimeout(timeoutId);
            canceledCount++;
        });
        
        this._reminderTimeouts.delete(eventId);
        console.log(`${canceledCount} rappels annulés pour l'événement ${eventId}`);
        
        return canceledCount;
    }
    
    /**
     * Annule tous les rappels
     * @returns {number} - Nombre de rappels annulés
     */
    cancelAllReminders() {
        let totalCanceled = 0;
        
        this._reminderTimeouts.forEach((timeouts, eventId) => {
            timeouts.forEach(({ timeoutId }) => {
                clearTimeout(timeoutId);
                totalCanceled++;
            });
        });
        
        this._reminderTimeouts.clear();
        
        if (totalCanceled > 0) {
            console.log(`${totalCanceled} rappels ont été annulés`);
        }
        
        return totalCanceled;
    }
    
    /**
     * Affiche un rappel d'événement
     * @param {Object} event - L'événement concerné
     * @param {string} timeLabel - Le délai du rappel (ex: "15 minutes")
     * @private
     */
    _showEventReminder(event, timeLabel) {
        // Vérifier si les notifications sont activées
        if (!this._notificationsEnabled) {
            console.log(`Rappel d'événement non affiché (désactivé): ${event.title}`);
            return;
        }
        
        const title = `Rappel: ${event.title}`;
        const body = `Cet événement commence dans ${timeLabel}${event.startTime ? ` (${event.startTime})` : ''}${event.location ? ` à ${event.location}` : ''}`;
        
        // Récupérer la catégorie pour une notification plus contextuelle
        let category = null;
        try {
            if (event.categoryId) {
                category = window.app?.categoryManager?.dataManager?.getCategoryById(event.categoryId);
            }
        } catch (error) {
            // Ignorer les erreurs de récupération de catégorie
        }
        
        // Enrichir le titre avec la catégorie si disponible
        const enrichedTitle = category 
            ? `${category.emoji} Rappel: ${event.title}`
            : title;
        
        // Afficher une notification système
        this.showSystemNotification(enrichedTitle, body, {
            icon: '/app/assets/icon.png',
            silent: false,
            onClick: () => {
                // Ouvrir les détails de l'événement lors du clic
                window.dispatchEvent(new CustomEvent('notification:eventClicked', {
                    detail: { eventId: event.id }
                }));
                
                // Mettre le focus sur l'application si ce n'est pas déjà le cas
                if (window.focus) {
                    window.focus();
                }
            }
        });
        
        // Afficher également une notification dans l'application avec priorité élevée
        this.showNotification(`${title} - ${body}`, false, 2);
    }
    
    /**
     * Obtient des statistiques sur les rappels programmés
     * @returns {Object} - Statistiques sur les rappels
     */
    getReminderStats() {
        const stats = {
            eventCount: this._reminderTimeouts.size,
            reminderCount: 0,
            upcoming: []
        };
        
        const now = new Date();
        
        // Collecter les statistiques
        this._reminderTimeouts.forEach((timeouts, eventId) => {
            stats.reminderCount += timeouts.length;
            
            // Collecter les 5 prochains rappels
            if (stats.upcoming.length < 5) {
                timeouts.forEach(reminder => {
                    if (reminder.time > now) {
                        stats.upcoming.push({
                            eventId,
                            time: reminder.time,
                            label: reminder.label
                        });
                    }
                });
            }
        });
        
        // Trier les prochains rappels par date
        stats.upcoming.sort((a, b) => a.time - b.time);
        stats.upcoming = stats.upcoming.slice(0, 5); // Limiter à 5 items
        
        return stats;
    }
}