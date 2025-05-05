// Gestionnaire des événements du calendrier
import { DateUtils } from './utils/date-utils.js';
import { v4 as uuidv4 } from './utils/uuid.js';

export class EventManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        
        // Éléments du DOM
        this.eventForm = document.querySelector('.event-form');
        this.eventTitle = document.getElementById('event-title');
        this.eventStartDate = document.getElementById('event-start-date');
        this.eventStartTime = document.getElementById('event-start-time');
        this.eventEndDate = document.getElementById('event-end-date');
        this.eventEndTime = document.getElementById('event-end-time');
        this.eventCategory = document.getElementById('event-category');
        this.eventLocation = document.getElementById('event-location');
        this.eventDescription = document.getElementById('event-description');
        this.eventRecurrence = document.getElementById('event-recurrence');
        this.recurrenceOptions = document.querySelector('.recurrence-options');
        this.eventAllDay = document.getElementById('event-all-day');
        
        // Boutons du formulaire
        this.addEventBtn = document.getElementById('add-event');
        this.updateEventBtn = document.getElementById('update-event');
        this.cancelEditBtn = document.getElementById('cancel-edit');
        
        // ID de l'événement en cours d'édition
        this.currentEditingEventId = null;
        
        // Événements récurrents générés
        this.generatedEvents = [];
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Écouteur pour le bouton d'ajout d'événement
        this.addEventBtn.addEventListener('click', () => this.addEvent());
        
        // Écouteur pour le bouton de mise à jour d'événement
        this.updateEventBtn.addEventListener('click', () => this.updateEvent());
        
        // Écouteur pour le bouton d'annulation
        this.cancelEditBtn.addEventListener('click', () => this.cancelEdit());
        
        // Écouteur pour le changement de récurrence
        this.eventRecurrence.addEventListener('change', () => this.updateRecurrenceOptions());
        
        // Écouteur pour la case à cocher "Toute la journée"
        if (this.eventAllDay) {
            this.eventAllDay.addEventListener('change', () => this.toggleAllDayEvent());
        }
        
        // Écouteur pour les demandes d'ajout d'événement à partir du calendrier
        window.addEventListener('calendar:requestAddEvent', (e) => {
            this.openAddEventForm(e.detail.date);
        });
        
        // Écouteur pour les changements de vue dans le calendrier
        window.addEventListener('calendar:viewChanged', (e) => {
            // Mettre à jour les événements dans la nouvelle vue
            const calendarManager = window.app?.calendarManager;
            if (calendarManager) {
                this.updateEventsInCalendar(calendarManager);
            }
        });
        
        // Écouteur pour les changements de date dans le calendrier
        window.addEventListener('calendar:dateChanged', (e) => {
            // Mettre à jour les événements pour la nouvelle date
            const calendarManager = window.app?.calendarManager;
            if (calendarManager) {
                this.updateEventsInCalendar(calendarManager);
            }
        });
        
        // Initialiser la date et l'heure par défaut
        this.resetForm();
    }
    
    // Activer/désactiver les champs d'heure pour les événements "Toute la journée"
    toggleAllDayEvent() {
        const isAllDay = this.eventAllDay.checked;
        
        // Désactiver les champs d'heure si "Toute la journée" est coché
        this.eventStartTime.disabled = isAllDay;
        this.eventEndTime.disabled = isAllDay;
        
        // Définir des valeurs par défaut pour les heures si nécessaire
        if (isAllDay) {
            // Pour les événements toute la journée, définir l'heure de début à 00:00 et l'heure de fin à 23:59
            this.eventStartTime.value = '00:00';
            this.eventEndTime.value = '23:59';
        } else {
            // Réinitialiser les heures par défaut si l'option est décochée
            const now = new Date();
            const minutes = now.getMinutes();
            const roundedMinutes = minutes - (minutes % 30) + 30;
            const roundedTime = new Date(now);
            roundedTime.setMinutes(roundedMinutes);
            roundedTime.setSeconds(0);
            
            const endTime = new Date(roundedTime);
            endTime.setHours(endTime.getHours() + 1);
            
            this.eventStartTime.value = DateUtils.formatTime24h(roundedTime);
            this.eventEndTime.value = DateUtils.formatTime24h(endTime);
        }
    }
    
    // Mettre à jour les options de récurrence en fonction du type sélectionné
    updateRecurrenceOptions() {
        const recurrenceType = this.eventRecurrence.value;
        
        if (recurrenceType === 'none') {
            this.recurrenceOptions.style.display = 'none';
            return;
        }
        
        // Afficher les options de récurrence
        this.recurrenceOptions.style.display = 'block';
        const optionsContainer = document.getElementById('recurrence-options-container');
        optionsContainer.innerHTML = '';
        
        // Créer les options spécifiques en fonction du type de récurrence
        switch (recurrenceType) {
            case 'daily':
                this.createDailyRecurrenceOptions(optionsContainer);
                break;
            case 'weekly':
                this.createWeeklyRecurrenceOptions(optionsContainer);
                break;
            case 'monthly':
                this.createMonthlyRecurrenceOptions(optionsContainer);
                break;
            case 'yearly':
                this.createYearlyRecurrenceOptions(optionsContainer);
                break;
            case 'custom':
                this.createCustomRecurrenceOptions(optionsContainer);
                break;
        }
    }
    
    // Créer les options pour une récurrence quotidienne
    createDailyRecurrenceOptions(container) {
        const options = document.createElement('div');
        options.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="recurrence-daily-interval">Tous les</label>
                    <input type="number" id="recurrence-daily-interval" class="form-control" min="1" value="1">
                    jour(s)
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="recurrence-end-type">Fin</label>
                    <select id="recurrence-end-type" class="form-control">
                        <option value="never">Jamais</option>
                        <option value="after">Après</option>
                        <option value="on-date">Le</option>
                    </select>
                </div>
                <div class="form-group recurrence-end-after" style="display: none;">
                    <label for="recurrence-end-after">occurrences</label>
                    <input type="number" id="recurrence-end-after" class="form-control" min="1" value="10">
                </div>
                <div class="form-group recurrence-end-on-date" style="display: none;">
                    <label for="recurrence-end-on-date">Date de fin</label>
                    <input type="date" id="recurrence-end-on-date" class="form-control">
                </div>
            </div>
        `;
        container.appendChild(options);
        
        // Gérer l'affichage des options de fin
        const endTypeSelect = options.querySelector('#recurrence-end-type');
        const endAfterGroup = options.querySelector('.recurrence-end-after');
        const endOnDateGroup = options.querySelector('.recurrence-end-on-date');
        
        endTypeSelect.addEventListener('change', () => {
            endAfterGroup.style.display = endTypeSelect.value === 'after' ? 'block' : 'none';
            endOnDateGroup.style.display = endTypeSelect.value === 'on-date' ? 'block' : 'none';
        });
    }
    
    // Créer les options pour une récurrence hebdomadaire
    createWeeklyRecurrenceOptions(container) {
        const options = document.createElement('div');
        options.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="recurrence-weekly-interval">Toutes les</label>
                    <input type="number" id="recurrence-weekly-interval" class="form-control" min="1" value="1">
                    semaine(s)
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Jours de la semaine</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="recurrence-weekly-day" value="1"> Lundi
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="recurrence-weekly-day" value="2"> Mardi
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="recurrence-weekly-day" value="3"> Mercredi
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="recurrence-weekly-day" value="4"> Jeudi
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="recurrence-weekly-day" value="5"> Vendredi
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="recurrence-weekly-day" value="6"> Samedi
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="recurrence-weekly-day" value="0"> Dimanche
                        </label>
                    </div>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="recurrence-end-type-weekly">Fin</label>
                    <select id="recurrence-end-type-weekly" class="form-control">
                        <option value="never">Jamais</option>
                        <option value="after">Après</option>
                        <option value="on-date">Le</option>
                    </select>
                </div>
                <div class="form-group recurrence-end-after-weekly" style="display: none;">
                    <label for="recurrence-end-after-weekly">occurrences</label>
                    <input type="number" id="recurrence-end-after-weekly" class="form-control" min="1" value="10">
                </div>
                <div class="form-group recurrence-end-on-date-weekly" style="display: none;">
                    <label for="recurrence-end-on-date-weekly">Date de fin</label>
                    <input type="date" id="recurrence-end-on-date-weekly" class="form-control">
                </div>
            </div>
        `;
        container.appendChild(options);
        
        // Présélectionner le jour de la semaine actuel
        const currentDay = this.eventStartDate.value ? new Date(this.eventStartDate.value).getDay() : new Date().getDay();
        const checkboxes = options.querySelectorAll('input[name="recurrence-weekly-day"]');
        checkboxes.forEach(checkbox => {
            if (parseInt(checkbox.value) === currentDay) {
                checkbox.checked = true;
            }
        });
        
        // Gérer l'affichage des options de fin
        const endTypeSelect = options.querySelector('#recurrence-end-type-weekly');
        const endAfterGroup = options.querySelector('.recurrence-end-after-weekly');
        const endOnDateGroup = options.querySelector('.recurrence-end-on-date-weekly');
        
        endTypeSelect.addEventListener('change', () => {
            endAfterGroup.style.display = endTypeSelect.value === 'after' ? 'block' : 'none';
            endOnDateGroup.style.display = endTypeSelect.value === 'on-date' ? 'block' : 'none';
        });
    }
   // Créer les options pour une récurrence mensuelle
   createMonthlyRecurrenceOptions(container) {
    const options = document.createElement('div');
    options.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label for="recurrence-monthly-interval">Tous les</label>
                <input type="number" id="recurrence-monthly-interval" class="form-control" min="1" value="1">
                mois
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Type de récurrence</label>
                <div class="radio-group">
                    <label class="radio-label">
                        <input type="radio" name="recurrence-monthly-type" value="day-of-month" checked>
                        Le jour <span id="recurrence-monthly-day-of-month">X</span> du mois
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="recurrence-monthly-type" value="day-of-week">
                        Le <select id="recurrence-monthly-week" class="form-control">
                            <option value="1">premier</option>
                            <option value="2">deuxième</option>
                            <option value="3">troisième</option>
                            <option value="4">quatrième</option>
                            <option value="-1">dernier</option>
                        </select>
                        <select id="recurrence-monthly-day" class="form-control">
                            <option value="1">lundi</option>
                            <option value="2">mardi</option>
                            <option value="3">mercredi</option>
                            <option value="4">jeudi</option>
                            <option value="5">vendredi</option>
                            <option value="6">samedi</option>
                            <option value="0">dimanche</option>
                        </select>
                        du mois
                    </label>
                </div>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="recurrence-end-type-monthly">Fin</label>
                <select id="recurrence-end-type-monthly" class="form-control">
                    <option value="never">Jamais</option>
                    <option value="after">Après</option>
                    <option value="on-date">Le</option>
                </select>
            </div>
            <div class="form-group recurrence-end-after-monthly" style="display: none;">
                <label for="recurrence-end-after-monthly">occurrences</label>
                <input type="number" id="recurrence-end-after-monthly" class="form-control" min="1" value="10">
            </div>
            <div class="form-group recurrence-end-on-date-monthly" style="display: none;">
                <label for="recurrence-end-on-date-monthly">Date de fin</label>
                <input type="date" id="recurrence-end-on-date-monthly" class="form-control">
            </div>
        </div>
    `;
    container.appendChild(options);
    
    // Mettre à jour le jour du mois actuel
    const currentDate = this.eventStartDate.value ? new Date(this.eventStartDate.value) : new Date();
    const dayOfMonth = currentDate.getDate();
    options.querySelector('#recurrence-monthly-day-of-month').textContent = dayOfMonth;
    
    // Présélectionner le jour de la semaine actuel
    const currentDay = currentDate.getDay();
    const weekInMonth = Math.ceil(dayOfMonth / 7);
    
    options.querySelector('#recurrence-monthly-day').value = currentDay;
    options.querySelector('#recurrence-monthly-week').value = weekInMonth > 4 ? -1 : weekInMonth;
    
    // Gérer l'affichage des options de fin
    const endTypeSelect = options.querySelector('#recurrence-end-type-monthly');
    const endAfterGroup = options.querySelector('.recurrence-end-after-monthly');
    const endOnDateGroup = options.querySelector('.recurrence-end-on-date-monthly');
    
    endTypeSelect.addEventListener('change', () => {
        endAfterGroup.style.display = endTypeSelect.value === 'after' ? 'block' : 'none';
        endOnDateGroup.style.display = endTypeSelect.value === 'on-date' ? 'block' : 'none';
    });
}

// Créer les options pour une récurrence annuelle
    createYearlyRecurrenceOptions(container) {
        const options = document.createElement('div');
        options.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="recurrence-yearly-interval">Tous les</label>
                    <input type="number" id="recurrence-yearly-interval" class="form-control" min="1" value="1">
                    an(s)
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Type de récurrence</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="recurrence-yearly-type" value="date" checked>
                            Le <span id="recurrence-yearly-month-day">X</span> <span id="recurrence-yearly-month-name">mois</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="recurrence-yearly-type" value="day-of-week">
                            Le <select id="recurrence-yearly-week" class="form-control">
                                <option value="1">premier</option>
                                <option value="2">deuxième</option>
                                <option value="3">troisième</option>
                                <option value="4">quatrième</option>
                                <option value="-1">dernier</option>
                            </select>
                            <select id="recurrence-yearly-day" class="form-control">
                                <option value="1">lundi</option>
                                <option value="2">mardi</option>
                                <option value="3">mercredi</option>
                                <option value="4">jeudi</option>
                                <option value="5">vendredi</option>
                                <option value="6">samedi</option>
                                <option value="0">dimanche</option>
                            </select>
                            de <select id="recurrence-yearly-month" class="form-control">
                                <option value="0">janvier</option>
                                <option value="1">février</option>
                                <option value="2">mars</option>
                                <option value="3">avril</option>
                                <option value="4">mai</option>
                                <option value="5">juin</option>
                                <option value="6">juillet</option>
                                <option value="7">août</option>
                                <option value="8">septembre</option>
                                <option value="9">octobre</option>
                                <option value="10">novembre</option>
                                <option value="11">décembre</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="recurrence-end-type-yearly">Fin</label>
                    <select id="recurrence-end-type-yearly" class="form-control">
                        <option value="never">Jamais</option>
                        <option value="after">Après</option>
                        <option value="on-date">Le</option>
                    </select>
                </div>
                <div class="form-group recurrence-end-after-yearly" style="display: none;">
                    <label for="recurrence-end-after-yearly">occurrences</label>
                    <input type="number" id="recurrence-end-after-yearly" class="form-control" min="1" value="10">
                </div>
                <div class="form-group recurrence-end-on-date-yearly" style="display: none;">
                    <label for="recurrence-end-on-date-yearly">Date de fin</label>
                    <input type="date" id="recurrence-end-on-date-yearly" class="form-control">
                </div>
            </div>
        `;
        container.appendChild(options);
        
        // Mettre à jour avec la date actuelle
        const currentDate = this.eventStartDate.value ? new Date(this.eventStartDate.value) : new Date();
        const dayOfMonth = currentDate.getDate();
        const monthIndex = currentDate.getMonth();
        const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(currentDate);
        
        options.querySelector('#recurrence-yearly-month-day').textContent = dayOfMonth;
        options.querySelector('#recurrence-yearly-month-name').textContent = monthName;
        
        // Présélectionner le mois
        options.querySelector('#recurrence-yearly-month').value = monthIndex;
        
        // Présélectionner le jour de la semaine
        const currentDay = currentDate.getDay();
        const weekInMonth = Math.ceil(dayOfMonth / 7);
        
        options.querySelector('#recurrence-yearly-day').value = currentDay;
        options.querySelector('#recurrence-yearly-week').value = weekInMonth > 4 ? -1 : weekInMonth;
        
        // Gérer l'affichage des options de fin
        const endTypeSelect = options.querySelector('#recurrence-end-type-yearly');
        const endAfterGroup = options.querySelector('.recurrence-end-after-yearly');
        const endOnDateGroup = options.querySelector('.recurrence-end-on-date-yearly');
        
        endTypeSelect.addEventListener('change', () => {
            endAfterGroup.style.display = endTypeSelect.value === 'after' ? 'block' : 'none';
            endOnDateGroup.style.display = endTypeSelect.value === 'on-date' ? 'block' : 'none';
        });
    }

    // Créer les options pour une récurrence personnalisée
    createCustomRecurrenceOptions(container) {
        const options = document.createElement('div');
        options.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="recurrence-custom-interval">Tous les</label>
                    <input type="number" id="recurrence-custom-interval" class="form-control" min="1" value="1">
                    <select id="recurrence-custom-unit" class="form-control">
                        <option value="days">jours</option>
                        <option value="weeks">semaines</option>
                        <option value="months">mois</option>
                        <option value="years">années</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="recurrence-end-type-custom">Fin</label>
                    <select id="recurrence-end-type-custom" class="form-control">
                        <option value="never">Jamais</option>
                        <option value="after">Après</option>
                        <option value="on-date">Le</option>
                    </select>
                </div>
                <div class="form-group recurrence-end-after-custom" style="display: none;">
                    <label for="recurrence-end-after-custom">occurrences</label>
                    <input type="number" id="recurrence-end-after-custom" class="form-control" min="1" value="10">
                </div>
                <div class="form-group recurrence-end-on-date-custom" style="display: none;">
                    <label for="recurrence-end-on-date-custom">Date de fin</label>
                    <input type="date" id="recurrence-end-on-date-custom" class="form-control">
                </div>
            </div>
        `;
        container.appendChild(options);
        
        // Gérer l'affichage des options de fin
        const endTypeSelect = options.querySelector('#recurrence-end-type-custom');
        const endAfterGroup = options.querySelector('.recurrence-end-after-custom');
        const endOnDateGroup = options.querySelector('.recurrence-end-on-date-custom');
        
        endTypeSelect.addEventListener('change', () => {
            endAfterGroup.style.display = endTypeSelect.value === 'after' ? 'block' : 'none';
            endOnDateGroup.style.display = endTypeSelect.value === 'on-date' ? 'block' : 'none';
        });
    }

    // Ouvrir le formulaire d'ajout d'événement avec une date pré-remplie
    openAddEventForm(date) {
        // Réinitialiser le formulaire
        this.resetForm();
        
        // Pré-remplir la date si elle est fournie
        if (date) {
            const formattedDate = DateUtils.formatDate(date);
            this.eventStartDate.value = formattedDate;
            this.eventEndDate.value = formattedDate;
            
            // Pré-remplir l'heure si elle est fournie
            if (date.getHours() !== 0 || date.getMinutes() !== 0) {
                this.eventStartTime.value = DateUtils.formatTime24h(date);
                
                // Définir l'heure de fin par défaut à 1 heure après le début
                const endDate = new Date(date);
                endDate.setHours(endDate.getHours() + 1);
                this.eventEndTime.value = DateUtils.formatTime24h(endDate);
            }
        }
        
        // Faire défiler jusqu'au formulaire
        this.eventForm.scrollIntoView({ behavior: 'smooth' });
        
        // Mettre le focus sur le champ de titre
        this.eventTitle.focus();
    }

    // Ouvrir le formulaire de modification d'un événement existant
    openEditEventForm(eventId) {
        try {
            // Récupérer l'événement
            const event = this.dataManager.getEventById(eventId);
            
            // Mettre à jour l'ID de l'événement en cours d'édition
            this.currentEditingEventId = eventId;
            
            // Remplir le formulaire avec les données de l'événement
            this.eventTitle.value = event.title || '';
            
            // Traiter les dates et heures
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            
            this.eventStartDate.value = DateUtils.formatDate(startDate);
            this.eventEndDate.value = DateUtils.formatDate(endDate);
            
            // Gérer l'option "Toute la journée"
            if (this.eventAllDay) {
                this.eventAllDay.checked = event.isAllDay || false;
                // Mettre à jour l'état des champs d'heure
                this.toggleAllDayEvent();
            }
            
            // Vérifier si l'heure est spécifiée
            if (event.startTime) {
                this.eventStartTime.value = event.startTime;
            } else {
                this.eventStartTime.value = '00:00';
            }
            
            if (event.endTime) {
                this.eventEndTime.value = event.endTime;
            } else {
                this.eventEndTime.value = '23:59';
            }
            
            // Catégorie
            if (event.categoryId) {
                this.eventCategory.value = event.categoryId;
            }
            
            // Autres champs
            this.eventLocation.value = event.location || '';
            this.eventDescription.value = event.description || '';
            
            // Récurrence
            this.eventRecurrence.value = event.recurrence?.type || 'none';
            this.updateRecurrenceOptions();
            
            if (event.recurrence) {
                // Remplir les options de récurrence en fonction du type
                this.fillRecurrenceOptions(event.recurrence);
            }
            
            // Afficher le bouton de mise à jour et cacher le bouton d'ajout
            this.addEventBtn.style.display = 'none';
            this.updateEventBtn.style.display = 'inline-flex';
            this.cancelEditBtn.style.display = 'inline-flex';
            
            // Faire défiler jusqu'au formulaire
            this.eventForm.scrollIntoView({ behavior: 'smooth' });
            
            // Mettre le focus sur le champ de titre
            this.eventTitle.focus();
        } catch (error) {
            console.error('Erreur lors de l\'ouverture du formulaire de modification:', error);
            // Afficher une notification d'erreur
            window.dispatchEvent(new CustomEvent('notification:show', {
                detail: { 
                    message: 'Erreur lors de l\'ouverture de l\'événement',
                    isError: true
                }
            }));
        }
    }

    // Remplir les options de récurrence à partir des données existantes
    fillRecurrenceOptions(recurrence) {
        // Implémentation à faire selon les besoins spécifiques
        // Cette méthode dépendra de la structure de vos données de récurrence
        console.log('Options de récurrence à remplir:', recurrence);
    }

    // Annuler l'édition d'un événement
    cancelEdit() {
        this.currentEditingEventId = null;
        this.resetForm();
        
        // Afficher le bouton d'ajout et cacher le bouton de mise à jour
        this.addEventBtn.style.display = 'inline-flex';
        this.updateEventBtn.style.display = 'none';
        this.cancelEditBtn.style.display = 'none';
    }

    // Réinitialiser le formulaire
    resetForm() {
        this.eventTitle.value = '';
        
        // Définir la date actuelle par défaut
        const now = new Date();
        const formattedDate = DateUtils.formatDate(now);
        this.eventStartDate.value = formattedDate;
        this.eventEndDate.value = formattedDate;
        
        // Définir l'heure actuelle arrondie aux 30 minutes
        const minutes = now.getMinutes();
        const roundedMinutes = minutes - (minutes % 30) + 30;
        const roundedTime = new Date(now);
        roundedTime.setMinutes(roundedMinutes);
        roundedTime.setSeconds(0);
        this.eventStartTime.value = DateUtils.formatTime24h(roundedTime);
        
        // Définir l'heure de fin à 1 heure après le début
        const endTime = new Date(roundedTime);
        endTime.setHours(endTime.getHours() + 1);
        this.eventEndTime.value = DateUtils.formatTime24h(endTime);
        
        // Réinitialiser la case à cocher "Toute la journée"
        if (this.eventAllDay) {
            this.eventAllDay.checked = false;
            this.eventStartTime.disabled = false;
            this.eventEndTime.disabled = false;
        }
        
        // Réinitialiser les autres champs
        this.eventCategory.selectedIndex = 0;
        this.eventLocation.value = '';
        this.eventDescription.value = '';
        this.eventRecurrence.value = 'none';
        this.recurrenceOptions.style.display = 'none';
        
        // Réinitialiser l'ID de l'événement en cours d'édition
        this.currentEditingEventId = null;
    }
    // Ajouter un nouvel événement
    addEvent() {
        try {
            // Valider les données du formulaire
            if (!this.validateEventForm()) {
                return;
            }
            
            // Récupérer les données du formulaire
            const eventData = this.getEventFormData();
            
            // Gérer la récurrence
            if (eventData.recurrence && eventData.recurrence.type !== 'none') {
                // Générer les événements récurrents
                this.generatedEvents = this.generateRecurringEvents(eventData);
                
                // Ajouter chaque événement généré
                this.generatedEvents.forEach(event => {
                    // Générer un nouvel ID unique pour chaque événement
                    const eventId = uuidv4();
                    this.dataManager.addEvent({...event, id: eventId});
                });
                
                // Enregistrer les données
                this.dataManager.saveData();
                
                // Afficher une notification de succès
                window.dispatchEvent(new CustomEvent('notification:show', {
                    detail: { 
                        message: `${this.generatedEvents.length} événements récurrents ajoutés avec succès`,
                        isError: false
                    }
                }));
                
                // Déclencher un événement pour mettre à jour le calendrier
                window.dispatchEvent(new CustomEvent('calendar:eventsUpdated'));
                
                // Réinitialiser le formulaire
                this.resetForm();
            } else {
                // Générer un ID unique pour l'événement
                const eventId = uuidv4();
                
                // Ajouter l'événement simple
                this.dataManager.addEvent({...eventData, id: eventId});
                
                // Enregistrer les données
                this.dataManager.saveData();
                
                // Afficher une notification de succès
                window.dispatchEvent(new CustomEvent('notification:show', {
                    detail: { 
                        message: 'Événement ajouté avec succès',
                        isError: false
                    }
                }));
                
                // Déclencher un événement pour mettre à jour le calendrier
                window.dispatchEvent(new CustomEvent('calendar:eventsUpdated'));
                
                // Réinitialiser le formulaire
                this.resetForm();
            }
            
            // Mise à jour immédiate des événements dans la vue actuelle
            const calendarManager = window.app?.calendarManager;
            if (calendarManager) {
                setTimeout(() => {
                    this.updateEventsInCalendar(calendarManager);
                }, 100);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'événement:', error);
            // Afficher une notification d'erreur
            window.dispatchEvent(new CustomEvent('notification:show', {
                detail: { 
                    message: 'Erreur lors de l\'ajout de l\'événement',
                    isError: true
                }
            }));
            return false;
        }
    }

    // Mettre à jour un événement existant
    updateEvent() {
        try {
            // Vérifier si un événement est en cours d'édition
            if (!this.currentEditingEventId) {
                throw new Error('Aucun événement en cours d\'édition');
            }
            
            // Valider les données du formulaire
            if (!this.validateEventForm()) {
                return;
            }
            
            // Récupérer les données du formulaire
            const eventData = this.getEventFormData();
            
            // Mettre à jour l'événement en conservant son ID
            this.dataManager.updateEvent(this.currentEditingEventId, eventData);
            
            // Enregistrer les données
            this.dataManager.saveData();
            
            // Afficher une notification de succès
            window.dispatchEvent(new CustomEvent('notification:show', {
                detail: { 
                    message: 'Événement mis à jour avec succès',
                    isError: false
                }
            }));
            
            // Déclencher un événement pour mettre à jour le calendrier
            window.dispatchEvent(new CustomEvent('calendar:eventsUpdated'));
            
            // Réinitialiser le formulaire et revenir au mode d'ajout
            this.resetForm();
            this.addEventBtn.style.display = 'inline-flex';
            this.updateEventBtn.style.display = 'none';
            this.cancelEditBtn.style.display = 'none';
            
            // Mise à jour immédiate des événements dans la vue actuelle
            const calendarManager = window.app?.calendarManager;
            if (calendarManager) {
                setTimeout(() => {
                    this.updateEventsInCalendar(calendarManager);
                }, 100);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'événement:', error);
            // Afficher une notification d'erreur
            window.dispatchEvent(new CustomEvent('notification:show', {
                detail: { 
                    message: 'Erreur lors de la mise à jour de l\'événement',
                    isError: true
                }
            }));
            return false;
        }
    }

    // Supprimer un événement
    deleteEvent(eventId) {
        try {
            // Demander confirmation
            if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
                return false;
            }
            
            // Supprimer l'événement
            this.dataManager.deleteEvent(eventId);
            
            // Enregistrer les données
            this.dataManager.saveData();
            
            // Afficher une notification de succès
            window.dispatchEvent(new CustomEvent('notification:show', {
                detail: { 
                    message: 'Événement supprimé avec succès',
                    isError: false
                }
            }));
            
            // Déclencher un événement pour mettre à jour le calendrier
            window.dispatchEvent(new CustomEvent('calendar:eventsUpdated'));
            
            // Mise à jour immédiate des événements dans la vue actuelle
            const calendarManager = window.app?.calendarManager;
            if (calendarManager) {
                setTimeout(() => {
                    this.updateEventsInCalendar(calendarManager);
                }, 100);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'événement:', error);
            // Afficher une notification d'erreur
            window.dispatchEvent(new CustomEvent('notification:show', {
                detail: { 
                    message: 'Erreur lors de la suppression de l\'événement',
                    isError: true
                }
            }));
            return false;
        }
    }

    // Valider les données du formulaire
    validateEventForm() {
        // Vérifier si le titre est renseigné
        if (!this.eventTitle.value.trim()) {
            alert('Veuillez saisir un titre pour l\'événement');
            this.eventTitle.focus();
            return false;
        }
        
        // Vérifier si la date de début est renseignée
        if (!this.eventStartDate.value) {
            alert('Veuillez saisir une date de début');
            this.eventStartDate.focus();
            return false;
        }
        
        // Vérifier si la date de fin est renseignée
        if (!this.eventEndDate.value) {
            alert('Veuillez saisir une date de fin');
            this.eventEndDate.focus();
            return false;
        }
        
        // Vérifier que la date de fin est postérieure ou égale à la date de début
        const startDate = new Date(this.eventStartDate.value);
        const endDate = new Date(this.eventEndDate.value);
        
        if (endDate < startDate) {
            alert('La date de fin doit être postérieure ou égale à la date de début');
            this.eventEndDate.focus();
            return false;
        }
        
        // Si les dates sont identiques, vérifier que l'heure de fin est postérieure à l'heure de début
        if (DateUtils.isSameDay(startDate, endDate) && this.eventStartTime.value && this.eventEndTime.value) {
            const [startHours, startMinutes] = this.eventStartTime.value.split(':').map(Number);
            const [endHours, endMinutes] = this.eventEndTime.value.split(':').map(Number);
            
            if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
                alert('L\'heure de fin doit être postérieure à l\'heure de début');
                this.eventEndTime.focus();
                return false;
            }
        }
        
        return true;
    }

    // Récupérer les données du formulaire
    getEventFormData() {
        // Récupérer les valeurs de base
        const title = this.eventTitle.value.trim();
        const startDate = this.eventStartDate.value;
        const endDate = this.eventEndDate.value;
        const isAllDay = this.eventAllDay && this.eventAllDay.checked;
        const startTime = isAllDay ? '00:00' : this.eventStartTime.value;
        const endTime = isAllDay ? '23:59' : this.eventEndTime.value;
        
        // Assurons-nous que categoryId est traité correctement
        let categoryId = null;
        if (this.eventCategory.value && this.eventCategory.value !== '') {
            categoryId = this.eventCategory.value;
        }
        
        const location = this.eventLocation.value.trim();
        const description = this.eventDescription.value.trim();
        const recurrenceType = this.eventRecurrence.value;
        
        // Créer l'objet de données de l'événement
        const eventData = {
            title,
            startDate,
            endDate,
            startTime,
            endTime,
            isAllDay,
            categoryId,
            location,
            description,
            createdAt: new Date().toISOString()
        };
        
        // Ajouter les données de récurrence si nécessaire
        if (recurrenceType !== 'none') {
            eventData.recurrence = this.getRecurrenceData(recurrenceType);
        }
        
        return eventData;
    }

    // Récupérer les données de récurrence
    getRecurrenceData(recurrenceType) {
        const recurrenceData = {
            type: recurrenceType
        };
        
        // Récupérer les options spécifiques en fonction du type de récurrence
        switch (recurrenceType) {
            case 'daily':
                recurrenceData.interval = parseInt(document.getElementById('recurrence-daily-interval').value) || 1;
                recurrenceData.end = this.getRecurrenceEndData('daily');
                break;
            case 'weekly':
                recurrenceData.interval = parseInt(document.getElementById('recurrence-weekly-interval').value) || 1;
                
                // Récupérer les jours de la semaine sélectionnés
                const selectedDays = [];
                document.querySelectorAll('input[name="recurrence-weekly-day"]:checked').forEach(checkbox => {
                    selectedDays.push(parseInt(checkbox.value));
                });
                recurrenceData.days = selectedDays.length > 0 ? selectedDays : [new Date(this.eventStartDate.value).getDay()];
                
                recurrenceData.end = this.getRecurrenceEndData('weekly');
                break;
            case 'monthly':
                recurrenceData.interval = parseInt(document.getElementById('recurrence-monthly-interval').value) || 1;
                
                // Récupérer le type de récurrence mensuelle
                const monthlyType = document.querySelector('input[name="recurrence-monthly-type"]:checked').value;
                recurrenceData.monthlyType = monthlyType;
                
                if (monthlyType === 'day-of-month') {
                    // Jour du mois
                    recurrenceData.dayOfMonth = new Date(this.eventStartDate.value).getDate();
                } else {
                    // Jour de la semaine dans le mois
                    recurrenceData.weekNumber = parseInt(document.getElementById('recurrence-monthly-week').value);
                    recurrenceData.dayOfWeek = parseInt(document.getElementById('recurrence-monthly-day').value);
                }
                
                recurrenceData.end = this.getRecurrenceEndData('monthly');
                break;
            case 'yearly':
                recurrenceData.interval = parseInt(document.getElementById('recurrence-yearly-interval').value) || 1;
                
                // Récupérer le type de récurrence annuelle
                const yearlyType = document.querySelector('input[name="recurrence-yearly-type"]:checked').value;
                recurrenceData.yearlyType = yearlyType;
                
                if (yearlyType === 'date') {
                    // Date spécifique dans l'année
                    const startDate = new Date(this.eventStartDate.value);
                    recurrenceData.month = startDate.getMonth();
                    recurrenceData.dayOfMonth = startDate.getDate();
                } else {
                    // Jour de la semaine dans le mois
                    recurrenceData.weekNumber = parseInt(document.getElementById('recurrence-yearly-week').value);
                    recurrenceData.dayOfWeek = parseInt(document.getElementById('recurrence-yearly-day').value);
                    recurrenceData.month = parseInt(document.getElementById('recurrence-yearly-month').value);
                }
                
                recurrenceData.end = this.getRecurrenceEndData('yearly');
                break;
            case 'custom':
                recurrenceData.interval = parseInt(document.getElementById('recurrence-custom-interval').value) || 1;
                recurrenceData.unit = document.getElementById('recurrence-custom-unit').value;
                recurrenceData.end = this.getRecurrenceEndData('custom');
                break;
        }
        
        return recurrenceData;
    }

    // Récupérer les données de fin de récurrence
    getRecurrenceEndData(recurrenceType) {
        const endType = document.getElementById(`recurrence-end-type${recurrenceType !== 'daily' ? '-' + recurrenceType : ''}`).value;
        
        switch (endType) {
            case 'never':
                return { type: 'never' };
            case 'after':
                const occurrences = parseInt(document.getElementById(`recurrence-end-after${recurrenceType !== 'daily' ? '-' + recurrenceType : ''}`).value) || 10;
                return { type: 'after', occurrences };
            case 'on-date':
                const endDate = document.getElementById(`recurrence-end-on-date${recurrenceType !== 'daily' ? '-' + recurrenceType : ''}`).value;
                return { type: 'on-date', date: endDate };
            default:
                return { type: 'never' };
        }
    }

    // Générer les événements récurrents en fonction des règles de récurrence
    generateRecurringEvents(templateEvent) {
        const events = [];
        const recurrence = templateEvent.recurrence;
        
        if (!recurrence || recurrence.type === 'none') {
            // Pas de récurrence, retourner uniquement l'événement de base
            return [templateEvent];
        }
        
        // Date de début de la série
        let startDate = new Date(templateEvent.startDate);
        if (templateEvent.startTime) {
            const [hours, minutes] = templateEvent.startTime.split(':').map(Number);
            startDate.setHours(hours, minutes, 0, 0);
        }
        
        // Durée de l'événement en millisecondes
        const eventStartDate = new Date(templateEvent.startDate);
        const eventEndDate = new Date(templateEvent.endDate);
        const eventDuration = eventEndDate.getTime() - eventStartDate.getTime();
        
        // Nombre maximal d'occurrences à générer (par défaut ou selon les règles de fin)
        let maxOccurrences = 100; // Limite pour éviter une boucle infinie
        let endDate = null;
        
        if (recurrence.end) {
            if (recurrence.end.type === 'after') {
                maxOccurrences = recurrence.end.occurrences;
            } else if (recurrence.end.type === 'on-date') {
                endDate = new Date(recurrence.end.date);
                endDate.setHours(23, 59, 59, 999);
            }
        }
        
        // Ajouter l'événement initial
        events.push({
            ...templateEvent,
            recurrenceId: Date.now().toString(), // ID de la série
            recurrenceSequence: 0 // Position dans la série
        });
        
        // Générer les occurrences suivantes
        let currentDate = startDate;
        let sequence = 1;
        
        while (events.length < maxOccurrences) {
            let nextDate;
            
            // Calculer la date de la prochaine occurrence en fonction du type de récurrence
            switch (recurrence.type) {
                case 'daily':
                    nextDate = new Date(currentDate);
                    nextDate.setDate(nextDate.getDate() + recurrence.interval);
                    break;
                
                case 'weekly':
                    // Récupérer les jours de la semaine
                    const days = recurrence.days || [currentDate.getDay()];
                    
                    // Trouver le prochain jour de la semaine
                    let nextDayFound = false;
                    let daysToAdd = 1;
                    
                    while (!nextDayFound && daysToAdd < 8 * recurrence.interval) {
                        const testDate = new Date(currentDate);
                        testDate.setDate(testDate.getDate() + daysToAdd);
                        
                        const testDay = testDate.getDay();
                        
                        // Si le jour est dans la liste et que l'intervalle est respecté
                        if (days.includes(testDay) && 
                            (daysToAdd % (7 * recurrence.interval) < 7 || daysToAdd === 7 * recurrence.interval)) {
                            nextDate = testDate;
                            nextDayFound = true;
                        } else {
                            daysToAdd++;
                        }
                    }
                    
                    // Si aucun jour n'a été trouvé, utilisez l'intervalle par défaut
                    if (!nextDayFound) {
                        nextDate = new Date(currentDate);
                        nextDate.setDate(nextDate.getDate() + 7 * recurrence.interval);
                    }
                    break;
                
                case 'monthly':
                    if (recurrence.monthlyType === 'day-of-month') {
                        // Jour spécifique du mois
                        nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + recurrence.interval, recurrence.dayOfMonth);
                    } else {
                        // Jour de la semaine spécifique (ex: le deuxième mardi)
                        nextDate = this.getNthDayOfMonth(
                            currentDate.getFullYear(),
                            currentDate.getMonth() + recurrence.interval,
                            recurrence.dayOfWeek,
                            recurrence.weekNumber
                        );
                    }
                    break;
                
                case 'yearly':
                    if (recurrence.yearlyType === 'date') {
                        // Date spécifique de l'année
                        nextDate = new Date(currentDate.getFullYear() + recurrence.interval, recurrence.month, recurrence.dayOfMonth);
                    } else {
                        // Jour de la semaine spécifique dans un mois (ex: le dernier lundi de mai)
                        nextDate = this.getNthDayOfMonth(
                            currentDate.getFullYear() + recurrence.interval,
                            recurrence.month,
                            recurrence.dayOfWeek,
                            recurrence.weekNumber
                        );
                    }
                    break;
                
                case 'custom':
                    nextDate = new Date(currentDate);
                    
                    // Ajouter l'intervalle en fonction de l'unité
                    switch (recurrence.unit) {
                        case 'days':
                            nextDate.setDate(nextDate.getDate() + recurrence.interval);
                            break;
                        case 'weeks':
                            nextDate.setDate(nextDate.getDate() + 7 * recurrence.interval);
                            break;
                        case 'months':
                            nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
                            break;
                        case 'years':
                            nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
                            break;
                    }
                    break;
                
                default:
                    // Type de récurrence non reconnu
                    return events;
            }
            
            // Vérifier si la date de fin est dépassée
            if (endDate && nextDate > endDate) {
                break;
            }
            
            // Calculer la date de fin de l'occurrence
            const nextEndDate = new Date(nextDate.getTime() + eventDuration);
            
            // Créer l'événement récurrent
            const recurringEvent = {
                ...templateEvent,
                startDate: DateUtils.formatDate(nextDate),
                endDate: DateUtils.formatDate(nextEndDate),
                recurrenceId: templateEvent.recurrenceId || Date.now().toString(),
                recurrenceSequence: sequence
            };
            
            // Ajouter l'événement à la liste
            events.push(recurringEvent);
            
            // Mettre à jour pour la prochaine itération
            currentDate = nextDate;
            sequence++;
            
            // Vérifier si on a atteint la limite d'occurrences ou la date de fin
            if ((recurrence.end?.type === 'after' && events.length >= recurrence.end.occurrences + 1) ||
                (recurrence.end?.type === 'on-date' && nextDate > new Date(recurrence.end.date))) {
                break;
            }
        }
        
        return events;
    }

    // Obtenir le Nième jour de la semaine dans un mois (1 = premier, 2 = deuxième, ... -1 = dernier)
    getNthDayOfMonth(year, month, dayOfWeek, n) {
        const date = new Date(year, month, 1);
        
        // Si n est négatif, chercher depuis la fin du mois
        if (n < 0) {
            // Dernier jour du mois
            const lastDay = new Date(year, month + 1, 0);
            const lastDayOfWeek = lastDay.getDay();
            
            // Calculer combien de jours à reculer pour trouver le dernier jour de la semaine
            let daysToSubtract = (lastDayOfWeek - dayOfWeek + 7) % 7;
            
            // Si n est -1, c'est le dernier jour de la semaine
            // Si n est -2, c'est l'avant-dernier, etc.
            daysToSubtract += (-n - 1) * 7;
            
            date.setTime(lastDay.getTime() - daysToSubtract * 86400000);
        } else {
            // Trouver le premier jour de la semaine dans le mois
            while (date.getDay() !== dayOfWeek) {
                date.setDate(date.getDate() + 1);
            }
            
            // Ajouter les semaines pour obtenir le Nième jour
            date.setDate(date.getDate() + (n - 1) * 7);
        }
        
        return date;
    }

    // Méthode pour mettre à jour les événements sur le calendrier
    updateEventsInCalendar(calendarManager, customEvents = null) {
        const currentView = calendarManager.currentView;
        const currentDate = calendarManager.currentDate;
        
        // Utiliser les événements personnalisés s'ils sont fournis, sinon utiliser tous les événements
        const events = customEvents !== null ? customEvents : this.dataManager.getAllEvents();
        
        console.log(`Mise à jour des événements pour la vue ${currentView}, ${events.length} événements à afficher`);
        
        // Filtrer les événements en fonction de la vue
        let filteredEvents = this.filterEventsByView(events, currentView, currentDate);
        
        console.log(`Après filtrage: ${filteredEvents.length} événements à afficher dans la vue ${currentView}`);
        
        // Ajouter les événements au calendrier en fonction de la vue
        this.renderEventsInCalendar(calendarManager, filteredEvents);
        
        // Mettre à jour la liste des événements à venir
        this.renderUpcomingEvents();
    }

    // Filtrer les événements selon la vue active
    filterEventsByView(events, view, date) {
        switch (view) {
            case 'yearly':
                return this.filterEventsForYearlyView(events, date);
            case 'monthly':
                return this.filterEventsForMonthlyView(events, date);
            case 'weekly':
                return this.filterEventsForWeeklyView(events, date);
            case 'daily':
                return this.filterEventsForDailyView(events, date);
            default:
                return events;
        }
    }

    // Filtrer les événements pour la vue annuelle
    filterEventsForYearlyView(events, date) {
        const year = date.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        
        return events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            return eventStartDate <= endOfYear && eventEndDate >= startOfYear;
        });
    }

    // Filtrer les événements pour la vue mensuelle
    filterEventsForMonthlyView(events, date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        return events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            return eventStartDate <= endOfMonth && eventEndDate >= startOfMonth;
        });
    }

    // Filtrer les événements pour la vue hebdomadaire
    filterEventsForWeeklyView(events, date) {
        const startOfWeek = DateUtils.getStartOfWeek(date);
        const endOfWeek = DateUtils.getEndOfWeek(date);
        
        return events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            return eventStartDate <= endOfWeek && eventEndDate >= startOfWeek;
        });
    }

    // Filtrer les événements pour la vue quotidienne
    filterEventsForDailyView(events, date) {
        const startOfDay = DateUtils.startOfDay(date);
        const endOfDay = DateUtils.endOfDay(date);
        
        return events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            return eventStartDate <= endOfDay && eventEndDate >= startOfDay;
        });
    }

    // Afficher les événements du calendrier selon la vue active
    renderEventsInCalendar(calendarManager, events) {
        switch (calendarManager.currentView) {
            case 'yearly':
                this.renderEventsInYearlyView(calendarManager, events);
                break;
            case 'monthly':
                this.renderEventsInMonthlyView(calendarManager, events);
                break;
            case 'weekly':
                this.renderEventsInWeeklyView(calendarManager, events);
                break;
            case 'daily':
                this.renderEventsInDailyView(calendarManager, events);
                break;
        }
    }

    // Afficher les événements dans la vue annuelle
    renderEventsInYearlyView(calendarManager, events) {
        // Marquer les jours avec des événements
        events.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            const category = this.dataManager.getCategoryById(event.categoryId) || {
                name: 'Sans catégorie',
                color: '#cccccc',
                emoji: '📅'
            };
            
            // Parcourir tous les jours entre startDate et endDate
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const month = currentDate.getMonth();
                const day = currentDate.getDate();
                
                // Trouver l'élément jour correspondant
                const dayElement = calendarManager.calendarContainer.querySelector(`[data-date="${currentDate.getFullYear()}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}"]`);
                
                if (dayElement) {
                    // Marquer le jour comme ayant un événement
                    dayElement.classList.add('has-event');
                    
                    // Ajouter l'emoji de la catégorie si disponible
                    if (category && !dayElement.querySelector('.category-emoji')) {
                        const emojiElement = document.createElement('div');
                        emojiElement.className = 'category-emoji';
                        emojiElement.textContent = category.emoji;
                        emojiElement.style.backgroundColor = category.color + '40'; // Ajouter une transparence
                        dayElement.appendChild(emojiElement);
                    }
                    
                    // Créer ou mettre à jour le tooltip
                    let tooltip = dayElement.querySelector('.tooltip');
                    if (!tooltip) {
                        tooltip = document.createElement('div');
                        tooltip.className = 'tooltip';
                        dayElement.appendChild(tooltip);
                    }
                    
                    // Vérifier si l'événement est déjà dans le tooltip
                    if (!tooltip.innerHTML.includes(event.title)) {
                        if (tooltip.innerHTML) {
                            tooltip.innerHTML += `<hr style="margin: 5px 0; border-color: rgba(255,255,255,0.3);">`;
                        }
                        tooltip.innerHTML += `
                            <div>${category ? category.emoji + ' ' : ''}${event.title}</div>
                            ${event.location ? `<div style="font-size: 10px; opacity: 0.8;">${event.location}</div>` : ''}
                        `;
                    }
                }
                
                // Passer au jour suivant
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
    }

    // Afficher les événements dans la vue mensuelle
    renderEventsInMonthlyView(calendarManager, events) {
        // Trier les événements par date de début
        events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        // Parcourir tous les événements
        events.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            const category = this.dataManager.getCategoryById(event.categoryId) || {
                name: 'Sans catégorie',
                color: '#cccccc',
                emoji: '📅'
            };
            
            // Parcourir tous les jours entre startDate et endDate
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                // Trouver l'élément jour correspondant
                const dayElement = calendarManager.monthCalendarContainer.querySelector(`[data-date="${DateUtils.formatDate(currentDate)}"]`);
                
                if (dayElement) {
                    // Vérifier si ce jour fait partie du mois courant (n'a pas la classe 'other-month')
                    if (dayElement.classList.contains('other-month')) {
                        // Passer au jour suivant et continuer la boucle
                        currentDate.setDate(currentDate.getDate() + 1);
                        continue;
                    }
                    
                    // Marquer le jour comme ayant un événement
                    dayElement.classList.add('has-event');
                    
                    // Trouver ou créer le conteneur d'événements
                    let eventsContainer = dayElement.querySelector('.month-day-events');
                    if (!eventsContainer) {
                        eventsContainer = document.createElement('div');
                        eventsContainer.className = 'month-day-events';
                        dayElement.appendChild(eventsContainer);
                    }
                    
                    // Vérifier si l'événement est déjà affiché
                    if (!eventsContainer.querySelector(`[data-event-id="${event.id}"]`)) {
                        // Créer l'élément d'événement
                        const eventElement = document.createElement('div');
                        eventElement.className = 'month-day-event';
                        eventElement.dataset.eventId = event.id;
                        
                        // Appliquer la couleur de la catégorie
                        if (category) {
                            eventElement.style.borderLeftColor = category.color;
                            eventElement.style.backgroundColor = category.color + '20'; // Avec transparence
                        }
                        
                        // Ajouter le titre de l'événement
                        eventElement.innerHTML = `${category ? category.emoji + ' ' : ''}${event.title}`;
                        
                        // Ajouter l'événement au jour
                        eventsContainer.appendChild(eventElement);
                        
                        // Ajouter l'événement de clic pour ouvrir l'édition
                        eventElement.addEventListener('click', (e) => {
                            e.stopPropagation(); // Empêcher le clic de se propager au jour
                            this.openEditEventForm(event.id);
                        });
                    }
                }
                
                // Passer au jour suivant
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
    }

    // Afficher les événements dans la vue hebdomadaire
    renderEventsInWeeklyView(calendarManager, events) {
        // Nettoyer d'abord les événements existants pour éviter les doublons
        const existingEvents = calendarManager.weekCalendarContainer.querySelectorAll('.week-event, .week-all-day-event');
        existingEvents.forEach(el => el.remove());
        
        // Nettoyer la zone des événements toute la journée si elle existe
        const existingAllDayContainer = calendarManager.weekCalendarContainer.querySelector('.all-day-events-container');
        if (existingAllDayContainer) {
            existingAllDayContainer.remove();
        }
        
        // Trier les événements par date de début
        events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        // Récupérer la date de début de la semaine
        const startOfWeek = DateUtils.getStartOfWeek(calendarManager.currentDate);
        
        // Séparer les événements "toute la journée" des autres
        const allDayEvents = events.filter(event => event.isAllDay);
        const regularEvents = events.filter(event => !event.isAllDay);
        
        // Traiter d'abord les événements "toute la journée" s'il y en a
        if (allDayEvents.length > 0) {
            this.renderAllDayEventsInWeeklyView(calendarManager, allDayEvents, startOfWeek);
        }
        
        // Ensuite, traiter les événements réguliers
        this.renderRegularEventsInWeeklyView(calendarManager, regularEvents, startOfWeek);
    }

    // Afficher les événements "toute la journée" dans la vue hebdomadaire
    renderAllDayEventsInWeeklyView(calendarManager, events, startOfWeek) {
        // Créer une zone spéciale pour les événements "toute la journée"
        const allDayContainer = document.createElement('div');
        allDayContainer.className = 'all-day-events-container';
        allDayContainer.style.gridColumn = '1 / span 8'; // Couvre toutes les colonnes
        allDayContainer.style.padding = '5px';
        allDayContainer.style.borderBottom = '1px solid var(--border)';
        allDayContainer.style.backgroundColor = 'rgba(var(--primary-rgb), 0.05)';
        allDayContainer.style.marginBottom = '10px';
        
        // Ajouter le titre
        const allDayTitle = document.createElement('div');
        allDayTitle.textContent = 'Toute la journée';
        allDayTitle.style.fontSize = '12px';
        allDayTitle.style.fontWeight = 'bold';
        allDayTitle.style.marginBottom = '5px';
        allDayContainer.appendChild(allDayTitle);
        
        // Créer un conteneur pour organiser les jours
        const daysRow = document.createElement('div');
        daysRow.style.display = 'grid';
        daysRow.style.gridTemplateColumns = '60px repeat(7, 1fr)';
        daysRow.style.width = '100%';
        
        // Ajouter une cellule vide pour l'alignement avec l'en-tête des heures
        const emptyCell = document.createElement('div');
        daysRow.appendChild(emptyCell);
        
        // Organiser les événements par jour
        const dayContainers = {};
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dateString = DateUtils.formatDate(dayDate);
            
            const dayContainer = document.createElement('div');
            dayContainer.className = 'all-day-events-day';
            dayContainer.style.display = 'flex';
            dayContainer.style.flexDirection = 'column';
            dayContainer.style.gap = '2px';
            dayContainer.style.flex = '1';
            
            dayContainers[dateString] = dayContainer;
            daysRow.appendChild(dayContainer);
        }
        
        // Ajouter chaque événement "toute la journée" au jour correspondant
        events.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            const category = this.dataManager.getCategoryById(event.categoryId) || {
                name: 'Sans catégorie',
                color: '#cccccc',
                emoji: '📅'
            };
            
            // Parcourir tous les jours entre startDate et endDate qui sont dans la semaine
            let currentDate = new Date(Math.max(startDate, startOfWeek));
            const endOfWeek = DateUtils.getEndOfWeek(calendarManager.currentDate);
            
            while (currentDate <= endDate && currentDate <= endOfWeek) {
                const dateString = DateUtils.formatDate(currentDate);
                
                if (dayContainers[dateString]) {
                    // Créer l'élément d'événement
                    const eventElement = document.createElement('div');
                    eventElement.className = 'week-all-day-event';
                    eventElement.dataset.eventId = event.id;
                    eventElement.style.padding = '2px 5px';
                    eventElement.style.borderRadius = '3px';
                    eventElement.style.fontSize = '11px';
                    eventElement.style.whiteSpace = 'nowrap';
                    eventElement.style.overflow = 'hidden';
                    eventElement.style.textOverflow = 'ellipsis';
                    eventElement.style.cursor = 'pointer';
                    
                    // Appliquer la couleur de la catégorie
                    if (category) {
                        eventElement.style.borderLeft = `3px solid ${category.color}`;
                        eventElement.style.backgroundColor = `${category.color}30`;
                    } else {
                        eventElement.style.borderLeft = '3px solid var(--primary)';
                        eventElement.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
                    }
                    
                    // Ajouter le contenu de l'événement
                    eventElement.innerHTML = `
                        <div class="week-event-title">${category ? category.emoji + ' ' : ''}${event.title}</div>
                    `;
                    
                    // Ajouter l'événement de clic pour ouvrir l'édition
                    eventElement.addEventListener('click', () => {
                        this.openEditEventForm(event.id);
                    });
                    
                    // Ajouter l'événement au jour
                    dayContainers[dateString].appendChild(eventElement);
                }
                
                // Passer au jour suivant
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
        
        // Ajouter la ligne des jours au conteneur principal
        allDayContainer.appendChild(daysRow);
        
        // Insérer le conteneur avant la grille des heures dans le calendrier hebdomadaire
        const weekHeader = calendarManager.weekCalendarContainer.querySelector('.week-header');
        if (weekHeader) {
            calendarManager.weekCalendarContainer.insertBefore(allDayContainer, weekHeader.nextSibling);
        } else {
            calendarManager.weekCalendarContainer.insertBefore(allDayContainer, calendarManager.weekCalendarContainer.firstChild);
        }
    }

    // Afficher les événements réguliers dans la vue hebdomadaire
    renderRegularEventsInWeeklyView(calendarManager, events, startOfWeek) {
        events.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            const category = this.dataManager.getCategoryById(event.categoryId) || {
                name: 'Sans catégorie',
                color: '#cccccc',
                emoji: '📅'
            };
            
            // Déterminer les heures de début et de fin
            let startTime = 0;
            let endTime = 23.99; // Pratiquement minuit
            
            if (event.startTime) {
                const [hours, minutes] = event.startTime.split(':').map(Number);
                startTime = hours + minutes / 60;
            }
            
            if (event.endTime) {
                const [hours, minutes] = event.endTime.split(':').map(Number);
                endTime = hours + minutes / 60;
            }
            
            // Parcourir tous les jours entre startDate et endDate
            let currentDate = new Date(Math.max(startDate, startOfWeek));
            const endOfWeek = DateUtils.getEndOfWeek(calendarManager.currentDate);
            
            while (currentDate <= endDate && currentDate <= endOfWeek) {
                const dayIndex = (currentDate.getDay() - calendarManager.firstDayOfWeek + 7) % 7;
                
                // Trouver toutes les colonnes du jour
                const dayColumns = calendarManager.weekCalendarContainer.querySelectorAll('.week-day-column');
                
                // Heures concernées par l'événement
                const startHour = Math.floor(startTime);
                const endHour = Math.ceil(endTime);
                
                // Trouver la colonne correspondant à l'heure et au jour
                const columnIndex = dayIndex + 7 * startHour; // 7 colonnes par heure
                
                if (columnIndex < dayColumns.length) {
                    const dayColumn = dayColumns[columnIndex];
                    
                    if (dayColumn) {
                        // Créer l'élément d'événement
                        const eventElement = document.createElement('div');
                        eventElement.className = 'week-event';
                        eventElement.dataset.eventId = event.id;
                        
                        // Position et dimensions
                        eventElement.style.position = 'absolute';
                        eventElement.style.left = '1px';
                        eventElement.style.right = '1px';
                        
                        // Calculer la position verticale en fonction de l'heure de début
                        const minuteOffset = (startTime - startHour) * 60;
                        const top = (minuteOffset / 60) * dayColumn.offsetHeight;
                        eventElement.style.top = `${top}px`;
                        
                        // Calculer la hauteur en fonction de la durée de l'événement
                        const duration = endTime - startTime; // en heures
                        const height = duration * dayColumn.offsetHeight;
                        eventElement.style.height = `${height}px`;
                        
                        // Appliquer la couleur de la catégorie
                        if (category) {
                            eventElement.style.borderLeft = `3px solid ${category.color}`;
                            eventElement.style.backgroundColor = `${category.color}40`;
                        } else {
                            eventElement.style.borderLeft = '3px solid var(--primary)';
                            eventElement.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                        }
                        
                        // Ajouter le contenu de l'événement
                        eventElement.innerHTML = `
                            <div class="week-event-title">${category ? category.emoji + ' ' : ''}${event.title}</div>
                            ${event.startTime ? `<div class="week-event-time">${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</div>` : ''}
                        `;
                        
                        // Ajouter l'événement de clic pour ouvrir l'édition
                        eventElement.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.openEditEventForm(event.id);
                        });
                        
                        // Ajouter l'événement à la colonne
                        dayColumn.appendChild(eventElement);
                    }
                }
                
                // Passer au jour suivant
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
    }

    // Afficher les événements dans la vue quotidienne
    renderEventsInDailyView(calendarManager, events) {
        // Récupérer la colonne des événements
        const eventsColumn = calendarManager.dayScheduleContainer.querySelector('.day-events-column');
        
        if (!eventsColumn) return;
        
        // Nettoyer les événements existants pour éviter les doublons
        const existingEvents = eventsColumn.querySelectorAll('.day-event');
        existingEvents.forEach(el => el.remove());
        
        // Nettoyer la zone des événements toute la journée si elle existe
        const existingAllDayContainer = calendarManager.dayScheduleContainer.querySelector('.all-day-events-container');
        if (existingAllDayContainer) {
            existingAllDayContainer.remove();
        }
        
        // Séparer les événements "toute la journée" des autres
        const allDayEvents = events.filter(event => event.isAllDay);
        const regularEvents = events.filter(event => !event.isAllDay);
        
        // Traiter d'abord les événements "toute la journée" s'il y en a
        if (allDayEvents.length > 0) {
            this.renderAllDayEventsInDailyView(calendarManager, allDayEvents);
        }
        
        // Ensuite, traiter les événements réguliers
        this.renderRegularEventsInDailyView(calendarManager, regularEvents, eventsColumn);
    }

    // Afficher les événements "toute la journée" dans la vue quotidienne
    renderAllDayEventsInDailyView(calendarManager, events) {
        // Créer une zone spéciale pour les événements "toute la journée"
        const allDayContainer = document.createElement('div');
        allDayContainer.className = 'all-day-events-container';
        allDayContainer.style.padding = '10px';
        allDayContainer.style.borderBottom = '1px solid var(--border)';
        allDayContainer.style.backgroundColor = 'rgba(var(--primary-rgb), 0.05)';
        allDayContainer.style.marginBottom = '10px';
        
        // Ajouter le titre
        const allDayTitle = document.createElement('div');
        allDayTitle.textContent = 'Toute la journée';
        allDayTitle.style.fontSize = '12px';
        allDayTitle.style.fontWeight = 'bold';
        allDayTitle.style.marginBottom = '5px';
        allDayContainer.appendChild(allDayTitle);
        
        // Conteneur pour les événements toute la journée
        const eventsContainer = document.createElement('div');
        eventsContainer.style.display = 'flex';
        eventsContainer.style.flexDirection = 'column';
        eventsContainer.style.gap = '5px';
        
        // Ajouter chaque événement "toute la journée"
        events.forEach(event => {
            const category = this.dataManager.getCategoryById(event.categoryId) || {
                name: 'Sans catégorie',
                color: '#cccccc',
                emoji: '📅'
            };
            
            // Créer l'élément d'événement
            const eventElement = document.createElement('div');
            eventElement.className = 'day-all-day-event';
            eventElement.dataset.eventId = event.id;
            eventElement.style.padding = '5px 10px';
            eventElement.style.borderRadius = '4px';
            eventElement.style.cursor = 'pointer';
            
            // Appliquer la couleur de la catégorie
            if (category) {
                eventElement.style.borderLeft = `3px solid ${category.color}`;
                eventElement.style.backgroundColor = `${category.color}30`;
            } else {
                eventElement.style.borderLeft = '3px solid var(--primary)';
                eventElement.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
            }
            
            // Ajouter le titre de l'événement
            const eventTitle = document.createElement('div');
            eventTitle.style.fontWeight = 'bold';
            eventTitle.textContent = `${category ? category.emoji + ' ' : ''}${event.title}`;
            eventElement.appendChild(eventTitle);
            
            // Ajouter le lieu de l'événement s'il existe
            if (event.location) {
                const eventLocation = document.createElement('div');
                eventLocation.style.fontSize = '10px';
                eventLocation.style.marginTop = '3px';
                eventLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${event.location}`;
                eventElement.appendChild(eventLocation);
            }
            
            // Ajouter l'événement de clic pour ouvrir l'édition
            eventElement.addEventListener('click', () => {
                this.openEditEventForm(event.id);
            });
            
            // Ajouter l'événement au conteneur
            eventsContainer.appendChild(eventElement);
        });
        
        // Ajouter le conteneur des événements au conteneur principal
        allDayContainer.appendChild(eventsContainer);
        
        // Insérer le conteneur avant la timeline dans l'agenda quotidien
        const dayHeader = calendarManager.dayScheduleContainer.querySelector('.day-header');
        if (dayHeader) {
            calendarManager.dayScheduleContainer.insertBefore(allDayContainer, dayHeader.nextSibling);
        } else {
            calendarManager.dayScheduleContainer.insertBefore(allDayContainer, calendarManager.dayScheduleContainer.firstChild);
        }
    }

    // Afficher les événements réguliers dans la vue quotidienne
    renderRegularEventsInDailyView(calendarManager, events, eventsColumn) {
        // Récupérer les éléments d'heure pour déterminer les dimensions
        const hourElements = calendarManager.dayScheduleContainer.querySelectorAll('.day-hour');
        if (hourElements.length === 0) return;
        
        // Calculer la hauteur d'une heure en pixels
        const hourHeight = hourElements[0].offsetHeight;
        
        // Afficher chaque événement
        events.forEach(event => {
            const category = this.dataManager.getCategoryById(event.categoryId) || {
                name: 'Sans catégorie',
                color: '#cccccc',
                emoji: '📅'
            };
            
            // Déterminer les heures de début et de fin
            let startTime = 0;
            let endTime = 23.99; // Pratiquement minuit
            
            if (event.startTime) {
                const [hours, minutes] = event.startTime.split(':').map(Number);
                startTime = hours + minutes / 60;
            }
            
            if (event.endTime) {
                const [hours, minutes] = event.endTime.split(':').map(Number);
                endTime = hours + minutes / 60;
            }
            
            // Créer l'élément d'événement
            const eventElement = document.createElement('div');
            eventElement.className = 'day-event';
            eventElement.dataset.eventId = event.id;
            
            // Calculer la position et la hauteur en fonction des heures
            const top = startTime * hourHeight;
            const height = (endTime - startTime) * hourHeight;
            
            eventElement.style.top = `${top}px`;
            eventElement.style.height = `${height}px`;
            
            // Appliquer la couleur de la catégorie
            if (category) {
                eventElement.style.borderLeft = `3px solid ${category.color}`;
                eventElement.style.backgroundColor = `${category.color}30`;
            } else {
                eventElement.style.borderLeft = '3px solid var(--primary)';
                eventElement.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
            }
            
            // Ajouter le contenu de l'événement
            eventElement.innerHTML = `
                <div class="day-event-title">${category ? category.emoji + ' ' : ''}${event.title}</div>
                <div class="day-event-details">
                    ${event.startTime ? `<div class="day-event-time">${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</div>` : ''}
                    ${event.location ? `<div class="day-event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>` : ''}
                </div>
            `;
            
            // Ajouter l'événement de clic pour ouvrir l'édition
            eventElement.addEventListener('click', () => {
                this.openEditEventForm(event.id);
            });
            
            // Ajouter l'événement à la colonne
            eventsColumn.appendChild(eventElement);
        });
    }

    // Afficher les événements à venir
    renderUpcomingEvents(filteredEvents = null) {
        const eventsContainer = document.getElementById('events-container');
        if (!eventsContainer) return;
        
        // Vider le conteneur
        eventsContainer.innerHTML = '';
        
        // Récupérer la date actuelle
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Utiliser les événements filtrés s'ils sont fournis, sinon tous les événements
        const allEvents = filteredEvents || this.dataManager.getAllEvents();
        
        // Filtrer uniquement les événements futurs
        const upcomingEvents = allEvents.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate >= today;
        });
        
        // Trier par date
        upcomingEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        // Afficher un message si aucun événement
        if (upcomingEvents.length === 0) {
            eventsContainer.innerHTML = '<p class="no-events">Aucun événement à venir.</p>';
            return;
        }
        
        // Créer les cartes d'événements
        upcomingEvents.forEach(event => {
            this.createEventCard(event, eventsContainer);
        });
    }

    // Créer une carte d'événement
    createEventCard(event, container) {
        // Récupérer la catégorie associée
        const category = this.dataManager.getCategoryById(event.categoryId) || {
            name: 'Sans catégorie',
            color: '#cccccc',
            emoji: '📅'
        };
        
        // Créer la carte
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.dataset.eventId = event.id;
        
        // Détails de l'événement
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        
        // Contenu de la carte
        eventCard.innerHTML = `
            <div class="event-card-header">
                <div class="event-category-indicator" ${category ? `style="background-color: ${category.color}"` : ''}></div>
                <div class="event-title">${event.title}</div>
                <div class="event-date">
                    <i class="far fa-calendar-alt"></i> 
                    ${DateUtils.isSameDay(startDate, endDate) 
                        ? `${DateUtils.formatLocalDate(startDate)}${event.startTime ? ` à ${event.startTime}` : ''}`
                        : `Du ${DateUtils.formatLocalDate(startDate)} au ${DateUtils.formatLocalDate(endDate)}`
                    }
                </div>
                ${event.location ? `<div class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>` : ''}
            </div>
            <div class="event-card-body">
                ${category ? `
                    <div class="event-category" style="background-color: ${category.color}20; color: ${category.color}">
                        <span class="event-category-emoji">${category.emoji}</span>
                        ${category.name}
                    </div>` : ''
                }
                ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                <div class="event-actions">
                    <button class="btn-icon edit-event" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger delete-event" title="Supprimer">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter les écouteurs d'événements
        const editBtn = eventCard.querySelector('.edit-event');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.openEditEventForm(event.id);
            });
        }
        
        const deleteBtn = eventCard.querySelector('.delete-event');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteEvent(event.id);
            });
        }
        
        // Ajouter la carte au conteneur
        container.appendChild(eventCard);
    }
} 