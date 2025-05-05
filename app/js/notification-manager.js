// Gestionnaire des notifications de l'application SuperCalendrier
export class NotificationManager {
    constructor() {
        // Élément de notification
        this.notificationElement = document.getElementById('notification');
        this.notificationMessage = document.getElementById('notification-message');
        
        // File des notifications
        this.notificationQueue = [];
        
        // État des notifications
        this.isShowingNotification = false;
        
        // État d'activation des notifications
        this.notificationsEnabled = true;
        
        // Vérifier si les éléments de notification existent
        if (!this.notificationElement || !this.notificationMessage) {
            console.warn('Éléments de notification non trouvés dans le DOM');
        }
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
        
        // Charger les préférences de notification
        this.loadNotificationPreferences();
    }
    
    // Initialiser les écouteurs d'événements
    initEventListeners() {
        // Écouteur pour les événements de notification personnalisés
        window.addEventListener('notification:show', (e) => {
            const { message, isError = false } = e.detail;
            this.showNotification(message, isError);
        });
    }
    
    // Charger les préférences de notification depuis le gestionnaire de données
    loadNotificationPreferences() {
        try {
            const dataManager = window.app?.dataManager;
            if (dataManager) {
                const preferences = dataManager.getPreferences();
                if (preferences && preferences.notifications) {
                    // Mettre à jour l'état d'activation en fonction des préférences
                    this.notificationsEnabled = preferences.notifications !== 'none';
                    console.log(`Notifications ${this.notificationsEnabled ? 'activées' : 'désactivées'}`);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des préférences de notification:', error);
        }
    }
    
    // Définir l'état d'activation des notifications
    setNotificationsEnabled(enabled) {
        this.notificationsEnabled = enabled;
        
        // Mettre à jour les préférences
        try {
            const dataManager = window.app?.dataManager;
            if (dataManager) {
                const preferences = dataManager.getPreferences();
                dataManager.updatePreferences({
                    ...preferences,
                    notifications: enabled ? 'all' : 'none'
                });
                console.log(`Notifications ${enabled ? 'activées' : 'désactivées'}`);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des préférences de notification:', error);
        }
    }
    
    // Afficher une notification
    showNotification(message, isError = false) {
        // Vérifier si les notifications sont désactivées
        if (!this.notificationsEnabled) {
            console.log(`Notification non affichée (désactivée): ${message}`);
            return;
        }
        
        // Ajouter la notification à la file d'attente
        this.notificationQueue.push({ message, isError });
        
        // Afficher si aucune notification n'est en cours d'affichage
        if (!this.isShowingNotification) {
            this.processNotificationQueue();
        }
    }
    
    // Traiter la file d'attente des notifications
    processNotificationQueue() {
        // Vérifier s'il y a des notifications en attente
        if (this.notificationQueue.length > 0) {
            // Marquer comme en cours d'affichage
            this.isShowingNotification = true;
            
            // Récupérer la prochaine notification
            const notification = this.notificationQueue.shift();
            
            // Afficher la notification
            this.displayNotification(notification.message, notification.isError);
        } else {
            // Aucune notification en attente
            this.isShowingNotification = false;
        }
    }
    
    // Afficher une notification à l'écran
    displayNotification(message, isError = false) {
        // Vérifier si les éléments existent
        if (!this.notificationElement || !this.notificationMessage) {
            console.error('Éléments de notification non trouvés dans le DOM');
            return;
        }
        
        // Définir le message
        this.notificationMessage.textContent = message;
        
        // Définir la classe en fonction du type
        this.notificationElement.className = isError ? 'notification error show' : 'notification show';
        
        // Masquer la notification après un délai
        setTimeout(() => {
            this.notificationElement.className = isError ? 'notification error' : 'notification';
            
            // Attendre la fin de l'animation avant de traiter la prochaine notification
            setTimeout(() => {
                this.processNotificationQueue();
            }, 300);
        }, 3000);
    }
    
    // Afficher une notification système native (si disponible via Electron)
    showSystemNotification(title, body, options = {}) {
        // Vérifier si les notifications sont désactivées
        if (!this.notificationsEnabled) {
            console.log(`Notification système non affichée (désactivée): ${title} - ${body}`);
            return;
        }
        
        // Vérifier si les notifications système sont disponibles
        if (window.Notification) {
            // Vérifier l'autorisation
            if (Notification.permission === 'granted') {
                // Créer la notification
                const notification = new Notification(title, {
                    body,
                    icon: options.icon || '/app/assets/icon.png',
                    silent: options.silent || false
                });
                
                // Événement de clic sur la notification
                if (options.onClick) {
                    notification.onclick = options.onClick;
                }
            } else if (Notification.permission !== 'denied') {
                // Demander l'autorisation
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.showSystemNotification(title, body, options);
                    }
                });
            }
        } else if (window.electronAPI) {
            // Tenter d'utiliser les notifications via Electron
            try {
                window.electronAPI.showNotification({
                    title,
                    body,
                    ...options
                });
            } catch (error) {
                console.error('Erreur lors de l\'affichage de la notification système:', error);
                // Fallback vers notre notification interne
                this.showNotification(body, false);
            }
        } else {
            // Fallback vers notre notification interne
            this.showNotification(body, false);
        }
    }
    
    // Vérifier si les notifications sont autorisées
    async checkNotificationPermission() {
        if (window.Notification) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                return await Notification.requestPermission();
            }
            return Notification.permission;
        }
        return 'denied';
    }
    
    // Plannifier les notifications pour les rappels d'événements
    scheduleEventReminders(events, preferences) {
        // Vérifier si les notifications sont activées
        if (!preferences || preferences.notifications === 'none' || !this.notificationsEnabled) {
            console.log('Rappels d\'événements non planifiés (notifications désactivées)');
            return;
        }
        
        // Pour chaque événement, planifier les rappels
        events.forEach(event => {
            if (!event.startDate) return;
            
            const startTime = new Date(event.startDate + 'T' + (event.startTime || '00:00:00'));
            const now = new Date();
            
            // Vérifier si l'événement est dans le futur
            if (startTime > now) {
                // Calculer le délai pour les rappels (15 minutes, 1 heure, 1 jour avant)
                const reminderTimes = [
                    { delay: 15 * 60 * 1000, label: '15 minutes' }, // 15 minutes
                    { delay: 60 * 60 * 1000, label: '1 heure' },     // 1 heure
                    { delay: 24 * 60 * 60 * 1000, label: '1 jour' }  // 1 jour
                ];
                
                reminderTimes.forEach(reminder => {
                    const reminderTime = new Date(startTime.getTime() - reminder.delay);
                    
                    // Vérifier si le rappel est encore dans le futur
                    if (reminderTime > now) {
                        const timeoutId = setTimeout(() => {
                            // Vérifier si les notifications sont toujours activées
                            if (this.notificationsEnabled) {
                                this.showEventReminder(event, reminder.label);
                            }
                        }, reminderTime.getTime() - now.getTime());
                        
                        // Stocker l'ID du timeout pour pouvoir l'annuler si nécessaire
                        this.storeReminderTimeout(event.id, timeoutId, reminder.label);
                        
                        console.log(`Rappel programmé pour "${event.title}" dans ${reminder.label}`);
                    }
                });
            }
        });
    }
    
    // Stocker un ID de timeout pour un rappel
    storeReminderTimeout(eventId, timeoutId, label) {
        // Cette méthode pourrait être étendue pour stocker les timeouts dans une structure
        // qui permettrait de les retrouver facilement pour les annuler si nécessaire
        // Par exemple, utiliser un Map avec l'ID de l'événement comme clé
        if (!this.reminderTimeouts) {
            this.reminderTimeouts = new Map();
        }
        
        if (!this.reminderTimeouts.has(eventId)) {
            this.reminderTimeouts.set(eventId, []);
        }
        
        this.reminderTimeouts.get(eventId).push({ timeoutId, label });
    }
    
    // Annuler les rappels pour un événement
    cancelEventReminders(eventId) {
        if (this.reminderTimeouts && this.reminderTimeouts.has(eventId)) {
            const timeouts = this.reminderTimeouts.get(eventId);
            timeouts.forEach(({ timeoutId }) => {
                clearTimeout(timeoutId);
            });
            this.reminderTimeouts.delete(eventId);
            console.log(`Rappels annulés pour l'événement ${eventId}`);
        }
    }
    
    // Annuler tous les rappels
    cancelAllReminders() {
        if (this.reminderTimeouts) {
            this.reminderTimeouts.forEach((timeouts, eventId) => {
                timeouts.forEach(({ timeoutId }) => {
                    clearTimeout(timeoutId);
                });
            });
            this.reminderTimeouts.clear();
            console.log('Tous les rappels ont été annulés');
        }
    }
    
    // Afficher un rappel d'événement
    showEventReminder(event, timeLabel) {
        // Vérifier si les notifications sont activées
        if (!this.notificationsEnabled) {
            console.log(`Rappel d'événement non affiché (désactivé): ${event.title}`);
            return;
        }
        
        const title = `Rappel: ${event.title}`;
        const body = `Cet événement commence dans ${timeLabel} (${event.startTime || 'Toute la journée'})`;
        
        // Afficher une notification système
        this.showSystemNotification(title, body, {
            onClick: () => {
                // Action lorsque l'utilisateur clique sur la notification
                console.log('Notification cliquée pour l\'événement:', event.id);
                
                // Déclencher un événement pour ouvrir les détails de l'événement
                window.dispatchEvent(new CustomEvent('notification:eventClicked', {
                    detail: { eventId: event.id }
                }));
            }
        });
        
        // Afficher également une notification dans l'application
        this.showNotification(`${title} - ${body}`);
    }
}