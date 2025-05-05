/**
 * @fileoverview Gestionnaire des événements du calendrier
 * Responsable de la création, modification, suppression et affichage des événements
 * @module EventManager
 */

import { DateUtils } from './utils/date-utils.js';
import { v4 as uuidv4 } from './utils/uuid.js';

/**
 * Classe gestionnaire des événements du calendrier
 * Gère le cycle de vie complet des événements et leur affichage dans les différentes vues
 */
export class EventManager {
    /**
     * Crée une instance du gestionnaire d'événements
     * @param {DataManager} dataManager - Instance du gestionnaire de données
     */
    constructor(dataManager) {
        /**
         * Référence au gestionnaire de données
         * @type {DataManager}
         * @private
         */
        this.dataManager = dataManager;
        
        // Initialisation des références DOM
        this.initDOMReferences();
        
        /**
         * ID de l'événement en cours d'édition
         * @type {string|null}
         * @private
         */
        this.currentEditingEventId = null;
        
        /**
         * Liste des événements récurrents générés
         * @type {Array}
         * @private
         */
        this.generatedEvents = [];
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
    }
    
    /**
     * Initialise les références aux éléments DOM utilisés par le gestionnaire
     * @private
     */
    initDOMReferences() {
        // Formulaire d'événement
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
    }
    
    /**
     * Initialise tous les écouteurs d'événements
     * @private
     */
    initEventListeners() {
        // Écouteurs pour les boutons du formulaire
        if (this.addEventBtn) {
            this.addEventBtn.addEventListener('click', () => this.addEvent());
        }
        
        if (this.updateEventBtn) {
            this.updateEventBtn.addEventListener('click', () => this.updateEvent());
        }
        
        if (this.cancelEditBtn) {
            this.cancelEditBtn.addEventListener('click', () => this.cancelEdit());
        }
        
        // Écouteur pour le changement de type de récurrence
        if (this.eventRecurrence) {
            this.eventRecurrence.addEventListener('change', () => this.updateRecurrenceOptions());
        }
        
        // Écouteur pour la case à cocher "Toute la journée"
        if (this.eventAllDay) {
            this.eventAllDay.addEventListener('change', () => this.toggleAllDayEvent());
        }
        
        // Écouteurs d'événements personnalisés
        this.initCustomEventListeners();
        
        // Initialiser la date et l'heure par défaut
        this.resetForm();
    }
    
    /**
     * Initialise les écouteurs d'événements personnalisés (événements window)
     * @private
     */
    initCustomEventListeners() {
        // Écouteur pour les demandes d'ajout d'événement à partir du calendrier
        window.addEventListener('calendar:requestAddEvent', (e) => {
            this.openAddEventForm(e.detail.date);
        });
        
        // Écouteur pour les changements de vue dans le calendrier
        window.addEventListener('calendar:viewChanged', () => {
            // Mettre à jour les événements dans la nouvelle vue
            const calendarManager = window.app?.calendarManager;
            if (calendarManager) {
                this.updateEventsInCalendar(calendarManager);
            }
        });
        
        // Écouteur pour les changements de date dans le calendrier
        window.addEventListener('calendar:dateChanged', () => {
            // Mettre à jour les événements pour la nouvelle date
            const calendarManager = window.app?.calendarManager;
            if (calendarManager) {
                this.updateEventsInCalendar(calendarManager);
            }
        });
        
        // Écouteur pour l'événement de clic sur une notification d'événement
        window.addEventListener('notification:eventClicked', (e) => {
            if (e.detail && e.detail.eventId) {
                this.openEditEventForm(e.detail.eventId);
            }
        });
    }
    
    /**
     * Active/désactive les champs d'heure pour les événements "Toute la journée"
     * @private
     */
    toggleAllDayEvent() {
        if (!this.eventAllDay) return;
        
        const isAllDay = this.eventAllDay.checked;
        
        // Désactiver les champs d'heure si "Toute la journée" est coché
        if (this.eventStartTime) this.eventStartTime.disabled = isAllDay;
        if (this.eventEndTime) this.eventEndTime.disabled = isAllDay;
        
        // Définir des valeurs par défaut pour les heures si nécessaire
        if (isAllDay) {
            // Pour les événements toute la journée, définir l'heure de début à 00:00 et l'heure de fin à 23:59
            if (this.eventStartTime) this.eventStartTime.value = '00:00';
            if (this.eventEndTime) this.eventEndTime.value = '23:59';
        } else {
            // Réinitialiser les heures par défaut si l'option est décochée
            const now = new Date();
            const roundedTime = this.getRoundedTime(now);
            const endTime = new Date(roundedTime);
            endTime.setHours(endTime.getHours() + 1);
            
            if (this.eventStartTime) this.eventStartTime.value = DateUtils.formatTime24h(roundedTime);
            if (this.eventEndTime) this.eventEndTime.value = DateUtils.formatTime24h(endTime);
        }
    }
    
    /**
     * Arrondit une heure aux 30 minutes les plus proches
     * @param {Date} time - L'heure à arrondir
     * @returns {Date} L'heure arrondie
     * @private
     */
    getRoundedTime(time) {
        const roundedTime = new Date(time);
        const minutes = roundedTime.getMinutes();
        const roundedMinutes = minutes - (minutes % 30) + 30;
        
        roundedTime.setMinutes(roundedMinutes);
        roundedTime.setSeconds(0);
        roundedTime.setMilliseconds(0);
        
        return roundedTime;
    }
    
    /**
     * Met à jour les options de récurrence en fonction du type sélectionné
     * @private
     */
    updateRecurrenceOptions() {
        if (!this.eventRecurrence || !this.recurrenceOptions) return;
        
        const recurrenceType = this.eventRecurrence.value;
        
        if (recurrenceType === 'none') {
            this.recurrenceOptions.style.display = 'none';
            return;
        }
        
        // Afficher les options de récurrence
        this.recurrenceOptions.style.display = 'block';
        const optionsContainer = document.getElementById('recurrence-options-container');
        if (!optionsContainer) return;
        
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
    
    /**
     * Crée les options pour une récurrence quotidienne
     * @param {HTMLElement} container - Conteneur pour les options
     * @private
     */
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
        this.setupRecurrenceEndOptions(options, 'recurrence-end-type', 
            'recurrence-end-after', 'recurrence-end-on-date');
    }
    
    /**
     * Crée les options pour une récurrence hebdomadaire
     * @param {HTMLElement} container - Conteneur pour les options
     * @private
     */
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
        this.preselectCurrentWeekday(options);
        
        // Gérer l'affichage des options de fin
        this.setupRecurrenceEndOptions(options, 'recurrence-end-type-weekly', 
            'recurrence-end-after-weekly', 'recurrence-end-on-date-weekly');
    }
    
    /**
     * Présélectionne le jour de la semaine courant
     * @param {HTMLElement} container - Conteneur avec les checkboxes
     * @private
     */
    preselectCurrentWeekday(container) {
        const currentDay = this.eventStartDate.value 
            ? new Date(this.eventStartDate.value).getDay() 
            : new Date().getDay();
        
        const checkboxes = container.querySelectorAll('input[name="recurrence-weekly-day"]');
        checkboxes.forEach(checkbox => {
            if (parseInt(checkbox.value) === currentDay) {
                checkbox.checked = true;
            }
        });
    }
    
    /**
     * Crée les options pour une récurrence mensuelle
     * @param {HTMLElement} container - Conteneur pour les options
     * @private
     */
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
        
        // Mettre à jour le jour du mois actuel et présélectionner les options
        this.updateMonthlyRecurrenceOptions(options);
        
        // Gérer l'affichage des options de fin
        this.setupRecurrenceEndOptions(options, 'recurrence-end-type-monthly', 
            'recurrence-end-after-monthly', 'recurrence-end-on-date-monthly');
    }
    
    /**
     * Met à jour les valeurs dans les options de récurrence mensuelle
     * @param {HTMLElement} container - Conteneur avec les options
     * @private
     */
    updateMonthlyRecurrenceOptions(container) {
        const currentDate = this.eventStartDate.value ? new Date(this.eventStartDate.value) : new Date();
        const dayOfMonth = currentDate.getDate();
        
        // Mettre à jour le jour du mois
        const dayOfMonthSpan = container.querySelector('#recurrence-monthly-day-of-month');
        if (dayOfMonthSpan) {
            dayOfMonthSpan.textContent = dayOfMonth;
        }
        
        // Présélectionner le jour de la semaine
        const currentDay = currentDate.getDay();
        const daySelect = container.querySelector('#recurrence-monthly-day');
        if (daySelect) {
            daySelect.value = currentDay;
        }
        
        // Déterminer la semaine dans le mois (1-4 ou -1 pour "dernier")
        const weekInMonth = this.getWeekOfMonthForDate(currentDate);
        const weekSelect = container.querySelector('#recurrence-monthly-week');
        if (weekSelect) {
            weekSelect.value = weekInMonth;
        }
    }
    
    /**
     * Calcule le numéro de semaine dans le mois pour une date
     * @param {Date} date - La date à analyser
     * @returns {number} Numéro de semaine dans le mois (1-4 ou -1 pour "dernier")
     * @private
     */
    getWeekOfMonthForDate(date) {
        const dayOfMonth = date.getDate();
        const totalDaysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const weekNumber = Math.ceil(dayOfMonth / 7);
        
        // Si c'est la dernière semaine du mois
        if (dayOfMonth > (totalDaysInMonth - 7)) {
            return -1;
        }
        
        return Math.min(weekNumber, 4);
    }
    
    /**
     * Crée les options pour une récurrence annuelle
     * @param {HTMLElement} container - Conteneur pour les options
     * @private
     */
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
        this.updateYearlyRecurrenceOptions(options);
        
        // Gérer l'affichage des options de fin
        this.setupRecurrenceEndOptions(options, 'recurrence-end-type-yearly', 
            'recurrence-end-after-yearly', 'recurrence-end-on-date-yearly');
    }
    
    /**
     * Met à jour les valeurs dans les options de récurrence annuelle
     * @param {HTMLElement} container - Conteneur avec les options
     * @private
     */
    updateYearlyRecurrenceOptions(container) {
        const currentDate = this.eventStartDate.value ? new Date(this.eventStartDate.value) : new Date();
        const dayOfMonth = currentDate.getDate();
        const monthIndex = currentDate.getMonth();
        const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(currentDate);
        
        // Mettre à jour le jour du mois et le nom du mois
        const daySpan = container.querySelector('#recurrence-yearly-month-day');
        const monthSpan = container.querySelector('#recurrence-yearly-month-name');
        
        if (daySpan) daySpan.textContent = dayOfMonth;
        if (monthSpan) monthSpan.textContent = monthName;
        
        // Présélectionner le mois
        const monthSelect = container.querySelector('#recurrence-yearly-month');
        if (monthSelect) monthSelect.value = monthIndex;
        
        // Présélectionner le jour de la semaine
        const currentDay = currentDate.getDay();
        const daySelect = container.querySelector('#recurrence-yearly-day');
        if (daySelect) daySelect.value = currentDay;
        
        // Déterminer la semaine dans le mois
        const weekInMonth = this.getWeekOfMonthForDate(currentDate);
        const weekSelect = container.querySelector('#recurrence-yearly-week');
        if (weekSelect) weekSelect.value = weekInMonth;
    }
    
    /**
     * Crée les options pour une récurrence personnalisée
     * @param {HTMLElement} container - Conteneur pour les options
     * @private
     */
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
        this.setupRecurrenceEndOptions(options, 'recurrence-end-type-custom', 
            'recurrence-end-after-custom', 'recurrence-end-on-date-custom');
    }
    
    /**
     * Configure les écouteurs pour les options de fin de récurrence
     * @param {HTMLElement} container - Conteneur avec les options
     * @param {string} endTypeId - ID du sélecteur de type de fin
     * @param {string} endAfterId - ID du conteneur "après X occurrences"
     * @param {string} endOnDateId - ID du conteneur "à une date spécifique"
     * @private
     */
    setupRecurrenceEndOptions(container, endTypeId, endAfterId, endOnDateId) {
        const endTypeSelect = container.querySelector(`#${endTypeId}`);
        const endAfterGroup = container.querySelector(`.${endAfterId}`);
        const endOnDateGroup = container.querySelector(`.${endOnDateId}`);
        
        if (!endTypeSelect || !endAfterGroup || !endOnDateGroup) return;
        
        endTypeSelect.addEventListener('change', () => {
            // Afficher/masquer les options en fonction de la sélection
            endAfterGroup.style.display = endTypeSelect.value === 'after' ? 'block' : 'none';
            endOnDateGroup.style.display = endTypeSelect.value === 'on-date' ? 'block' : 'none';
            
            // Si "on-date" est sélectionné, initialiser la date avec une date future
            if (endTypeSelect.value === 'on-date') {
                const endDateInput = container.querySelector(`#${endOnDateId}`);
                if (endDateInput && !endDateInput.value) {
                    const futureDate = new Date();
                    futureDate.setMonth(futureDate.getMonth() + 3); // Par défaut: 3 mois dans le futur
                    endDateInput.value = DateUtils.formatDate(futureDate);
                }
            }
        });
    }

    /**
     * Ouvre le formulaire d'ajout d'événement avec une date pré-remplie
     * @param {Date} [date] - Date à pré-remplir (optionnel)
     */
    openAddEventForm(date) {
        // Réinitialiser le formulaire
        this.resetForm();
        
        // Pré-remplir la date si elle est fournie
        if (date) {
            const formattedDate = DateUtils.formatDate(date);
            
            if (this.eventStartDate) this.eventStartDate.value = formattedDate;
            if (this.eventEndDate) this.eventEndDate.value = formattedDate;
            
            // Pré-remplir l'heure si elle est fournie
            if (date.getHours() !== 0 || date.getMinutes() !== 0) {
                if (this.eventStartTime) this.eventStartTime.value = DateUtils.formatTime24h(date);
                
                // Définir l'heure de fin par défaut à 1 heure après le début
                if (this.eventEndTime) {
                    const endDate = new Date(date);
                    endDate.setHours(endDate.getHours() + 1);
                    this.eventEndTime.value = DateUtils.formatTime24h(endDate);
                }
            }
        }
        
        // Faire défiler jusqu'au formulaire
        if (this.eventForm) {
            this.eventForm.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Mettre le focus sur le champ de titre
        if (this.eventTitle) {
            this.eventTitle.focus();
        }
    }

    /**
     * Ouvre le formulaire de modification d'un événement existant
     * @param {string} eventId - ID de l'événement à modifier
     */
    openEditEventForm(eventId) {
        try {
            // Récupérer l'événement
            const event = this.dataManager.getEventById(eventId);
            if (!event) {
                throw new Error(`Événement avec ID ${eventId} non trouvé`);
            }
            
            // Mettre à jour l'ID de l'événement en cours d'édition
            this.currentEditingEventId = eventId;
            
            // Remplir le formulaire avec les données de l'événement
            if (this.eventTitle) this.eventTitle.value = event.title || '';
            
            // Traiter les dates et heures
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            
            if (this.eventStartDate) this.eventStartDate.value = DateUtils.formatDate(startDate);
            if (this.eventEndDate) this.eventEndDate.value = DateUtils.formatDate(endDate);
            
            // Gérer l'option "Toute la journée"
            if (this.eventAllDay) {
                this.eventAllDay.checked = event.isAllDay || false;
                
                // Mettre à jour l'état des champs d'heure
                this.toggleAllDayEvent();
            }
            
            // Définir les heures
            if (this.eventStartTime) this.eventStartTime.value = event.startTime || '00:00';
            if (this.eventEndTime) this.eventEndTime.value = event.endTime || '23:59';
            
            // Catégorie
            if (this.eventCategory && event.categoryId) {
                this.eventCategory.value = event.categoryId;
            }
            
            // Autres champs
            if (this.eventLocation) this.eventLocation.value = event.location || '';
            if (this.eventDescription) this.eventDescription.value = event.description || '';
            
            // Récurrence
            if (this.eventRecurrence) {
                this.eventRecurrence.value = event.recurrence?.type || 'none';
                this.updateRecurrenceOptions();
                
                if (event.recurrence) {
                    this.fillRecurrenceOptions(event.recurrence);
                }
            }
            
            // Afficher le bouton de mise à jour et cacher le bouton d'ajout
            if (this.addEventBtn) this.addEventBtn.style.display = 'none';
            if (this.updateEventBtn) this.updateEventBtn.style.display = 'inline-flex';
            if (this.cancelEditBtn) this.cancelEditBtn.style.display = 'inline-flex';
            
            // Faire défiler jusqu'au formulaire
            if (this.eventForm) {
                this.eventForm.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Mettre le focus sur le champ de titre
            if (this.eventTitle) {
                this.eventTitle.focus();
            }
        } catch (error) {
            console.error('Erreur lors de l\'ouverture du formulaire de modification:', error);
            this.showNotification(
                'Erreur lors de l\'ouverture de l\'événement', 
                true
            );
        }
    }

    /**
     * Remplit les options de récurrence à partir des données existantes
     * @param {Object} recurrence - Données de récurrence
     * @private
     */
    fillRecurrenceOptions(recurrence) {
        try {
            const type = recurrence.type;
            if (!type || type === 'none') return;
            
            // Champ d'intervalle commun à tous les types
            const intervalInput = document.getElementById(`recurrence-${type}-interval`);
            if (intervalInput && recurrence.interval) {
                intervalInput.value = recurrence.interval;
            }
            
            // Options spécifiques selon le type
            switch (type) {
                case 'weekly':
                    this.fillWeeklyRecurrenceOptions(recurrence);
                    break;
                case 'monthly':
                    this.fillMonthlyRecurrenceOptions(recurrence);
                    break;
                case 'yearly':
                    this.fillYearlyRecurrenceOptions(recurrence);
                    break;
                case 'custom':
                    this.fillCustomRecurrenceOptions(recurrence);
                    break;
            }
            
            // Options de fin communes
            this.fillRecurrenceEndOptions(type, recurrence.end);
            
        } catch (error) {
            console.error('Erreur lors du remplissage des options de récurrence:', error);
        }
    }
    
    /**
     * Remplit les options de récurrence hebdomadaire
     * @param {Object} recurrence - Données de récurrence
     * @private
     */
    fillWeeklyRecurrenceOptions(recurrence) {
        if (!recurrence.days || !recurrence.days.length) return;
        
        // Sélectionner les jours de la semaine
        const checkboxes = document.querySelectorAll('input[name="recurrence-weekly-day"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = recurrence.days.includes(parseInt(checkbox.value));
        });
    }
    
    /**
     * Remplit les options de récurrence mensuelle
     * @param {Object} recurrence - Données de récurrence
     * @private
     */
    fillMonthlyRecurrenceOptions(recurrence) {
        // Type de récurrence mensuelle
        const typeRadios = document.querySelectorAll('input[name="recurrence-monthly-type"]');
        
        if (recurrence.monthlyType) {
            typeRadios.forEach(radio => {
                radio.checked = radio.value === recurrence.monthlyType;
            });
            
            // Options selon le type
            if (recurrence.monthlyType === 'day-of-week' && recurrence.weekNumber && recurrence.dayOfWeek !== undefined) {
                const weekSelect = document.getElementById('recurrence-monthly-week');
                const daySelect = document.getElementById('recurrence-monthly-day');
                
                if (weekSelect) weekSelect.value = recurrence.weekNumber;
                if (daySelect) daySelect.value = recurrence.dayOfWeek;
            }
        }
    }
    
    /**
     * Remplit les options de récurrence annuelle
     * @param {Object} recurrence - Données de récurrence
     * @private
     */
    fillYearlyRecurrenceOptions(recurrence) {
        // Type de récurrence annuelle
        const typeRadios = document.querySelectorAll('input[name="recurrence-yearly-type"]');
        
        if (recurrence.yearlyType) {
            typeRadios.forEach(radio => {
                radio.checked = radio.value === recurrence.yearlyType;
            });
            
            // Options selon le type
            if (recurrence.yearlyType === 'day-of-week') {
                const weekSelect = document.getElementById('recurrence-yearly-week');
                const daySelect = document.getElementById('recurrence-yearly-day');
                const monthSelect = document.getElementById('recurrence-yearly-month');
                
                if (weekSelect && recurrence.weekNumber) weekSelect.value = recurrence.weekNumber;
                if (daySelect && recurrence.dayOfWeek !== undefined) daySelect.value = recurrence.dayOfWeek;
                if (monthSelect && recurrence.month !== undefined) monthSelect.value = recurrence.month;
            }
        }
    }
    
    /**
     * Remplit les options de récurrence personnalisée
     * @param {Object} recurrence - Données de récurrence
     * @private
     */
    fillCustomRecurrenceOptions(recurrence) {
        const unitSelect = document.getElementById('recurrence-custom-unit');
        if (unitSelect && recurrence.unit) {
            unitSelect.value = recurrence.unit;
        }
    }
    
    /**
     * Remplit les options de fin de récurrence
     * @param {string} type - Type de récurrence ('daily', 'weekly', etc.)
     * @param {Object} endOptions - Options de fin
     * @private
     */
    fillRecurrenceEndOptions(type, endOptions) {
        if (!endOptions) return;
        
        // Sélecteur de type de fin
        const endTypeSelect = document.getElementById(`recurrence-end-type${type !== 'daily' ? '-' + type : ''}`);
        if (!endTypeSelect) return;
        
        endTypeSelect.value = endOptions.type || 'never';
        
        // Déclencher l'événement change pour afficher les bons champs
        const event = new Event('change');
        endTypeSelect.dispatchEvent(event);
        
        // Remplir les options selon le type
        if (endOptions.type === 'after') {
            const occurrencesInput = document.getElementById(`recurrence-end-after${type !== 'daily' ? '-' + type : ''}`);
            if (occurrencesInput && endOptions.occurrences) {
                occurrencesInput.value = endOptions.occurrences;
            }
        } else if (endOptions.type === 'on-date') {
            const dateInput = document.getElementById(`recurrence-end-on-date${type !== 'daily' ? '-' + type : ''}`);
            if (dateInput && endOptions.date) {
                dateInput.value = endOptions.date;
            }
        }
    }

    /**
     * Annule l'édition d'un événement
     */
    cancelEdit() {
        this.currentEditingEventId = null;
        this.resetForm();
        
        // Afficher le bouton d'ajout et cacher le bouton de mise à jour
        if (this.addEventBtn) this.addEventBtn.style.display = 'inline-flex';
        if (this.updateEventBtn) this.updateEventBtn.style.display = 'none';
        if (this.cancelEditBtn) this.cancelEditBtn.style.display = 'none';
        
        // Afficher une notification
        this.showNotification('Modification annulée');
    }

    /**
     * Réinitialise le formulaire avec des valeurs par défaut
     */
    resetForm() {
        // Réinitialiser l'ID de l'événement en cours d'édition
        this.currentEditingEventId = null;
        
        // Réinitialiser les champs du formulaire
        if (this.eventTitle) this.eventTitle.value = '';
        
        // Définir la date actuelle par défaut
        const now = new Date();
        const formattedDate = DateUtils.formatDate(now);
        
        if (this.eventStartDate) this.eventStartDate.value = formattedDate;
        if (this.eventEndDate) this.eventEndDate.value = formattedDate;
        
        // Définir l'heure actuelle arrondie aux 30 minutes
        const roundedTime = this.getRoundedTime(now);
        
        if (this.eventStartTime) this.eventStartTime.value = DateUtils.formatTime24h(roundedTime);
        
        // Définir l'heure de fin à 1 heure après le début
        const endTime = new Date(roundedTime);
        endTime.setHours(endTime.getHours() + 1);
        
        if (this.eventEndTime) this.eventEndTime.value = DateUtils.formatTime24h(endTime);
        
        // Réinitialiser la case à cocher "Toute la journée"
        if (this.eventAllDay) {
            this.eventAllDay.checked = false;
            
            if (this.eventStartTime) this.eventStartTime.disabled = false;
            if (this.eventEndTime) this.eventEndTime.disabled = false;
        }
        
        // Réinitialiser les autres champs
        if (this.eventCategory) this.eventCategory.selectedIndex = 0;
        if (this.eventLocation) this.eventLocation.value = '';
        if (this.eventDescription) this.eventDescription.value = '';
        
        // Réinitialiser la récurrence
        if (this.eventRecurrence) {
            this.eventRecurrence.value = 'none';
            
            if (this.recurrenceOptions) {
                this.recurrenceOptions.style.display = 'none';
            }
        }
    }

    /**
     * Ajoute un nouvel événement
     * @returns {boolean} True si l'ajout est réussi, false sinon
     */
    addEvent() {
        try {
            // Valider les données du formulaire
            if (!this.validateEventForm()) {
                return false;
            }
            
            // Récupérer les données du formulaire
            const eventData = this.getEventFormData();
            
            // Gérer la récurrence
            if (eventData.recurrence && eventData.recurrence.type !== 'none') {
                // Générer les événements récurrents
                this.generatedEvents = this.generateRecurringEvents(eventData);
                
                // Ajouter chaque événement généré
                let addedCount = 0;
                this.generatedEvents.forEach(event => {
                    try {
                        // Générer un nouvel ID unique pour chaque événement
                        const eventId = uuidv4();
                        this.dataManager.addEvent({...event, id: eventId});
                        addedCount++;
                    } catch (error) {
                        console.error('Erreur lors de l\'ajout d\'un événement récurrent:', error);
                    }
                });
                
                // Enregistrer les données
                this.dataManager.saveData();
                
                // Afficher une notification de succès
                this.showNotification(
                    `${addedCount} événements récurrents ajoutés avec succès`
                );
                
                // Déclencher un événement pour mettre à jour le calendrier
                this.triggerEventsUpdatedEvent();
                
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
                this.showNotification('Événement ajouté avec succès');
                
                // Déclencher un événement pour mettre à jour le calendrier
                this.triggerEventsUpdatedEvent();
                
                // Réinitialiser le formulaire
                this.resetForm();
            }
            
            // Mise à jour immédiate des événements dans la vue actuelle
            this.updateCalendarAfterChange();
            
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'événement:', error);
            this.showNotification(
                'Erreur lors de l\'ajout de l\'événement: ' + error.message,
                true
            );
            return false;
        }
    }

    /**
     * Met à jour un événement existant
     * @returns {boolean} True si la mise à jour est réussie, false sinon
     */
    updateEvent() {
        try {
            // Vérifier si un événement est en cours d'édition
            if (!this.currentEditingEventId) {
                throw new Error('Aucun événement en cours d\'édition');
            }
            
            // Valider les données du formulaire
            if (!this.validateEventForm()) {
                return false;
            }
            
            // Récupérer les données du formulaire
            const eventData = this.getEventFormData();
            
            // Mettre à jour l'événement en conservant son ID
            this.dataManager.updateEvent(this.currentEditingEventId, eventData);
            
            // Enregistrer les données
            this.dataManager.saveData();
            
            // Afficher une notification de succès
            this.showNotification('Événement mis à jour avec succès');
            
            // Déclencher un événement pour mettre à jour le calendrier
            this.triggerEventsUpdatedEvent();
            
            // Réinitialiser le formulaire et revenir au mode d'ajout
            this.resetForm();
            
            if (this.addEventBtn) this.addEventBtn.style.display = 'inline-flex';
            if (this.updateEventBtn) this.updateEventBtn.style.display = 'none';
            if (this.cancelEditBtn) this.cancelEditBtn.style.display = 'none';
            
            // Mise à jour immédiate des événements dans la vue actuelle
            this.updateCalendarAfterChange();
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'événement:', error);
            this.showNotification(
                'Erreur lors de la mise à jour de l\'événement: ' + error.message,
                true
            );
            return false;
        }
    }

    /**
     * Supprime un événement
     * @param {string} eventId - ID de l'événement à supprimer
     * @returns {boolean} True si la suppression est réussie, false sinon
     */
    deleteEvent(eventId) {
        try {
            // Demander confirmation
            if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
                return false;
            }
            
            // Supprimer l'événement
            this.dataManager.deleteEvent(eventId);
            
            // Annuler l'édition si c'était l'événement en cours d'édition
            if (this.currentEditingEventId === eventId) {
                this.cancelEdit();
            }
            
            // Enregistrer les données
            this.dataManager.saveData();
            
            // Afficher une notification de succès
            this.showNotification('Événement supprimé avec succès');
            
            // Déclencher un événement pour mettre à jour le calendrier
            this.triggerEventsUpdatedEvent();
            
            // Mise à jour immédiate des événements dans la vue actuelle
            this.updateCalendarAfterChange();
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'événement:', error);
            this.showNotification(
                'Erreur lors de la suppression de l\'événement: ' + error.message,
                true
            );
            return false;
        }
    }

    /**
     * Met à jour le calendrier après un changement (ajout/modification/suppression)
     * @private
     */
    updateCalendarAfterChange() {
        const calendarManager = window.app?.calendarManager;
        if (calendarManager) {
            setTimeout(() => {
                this.updateEventsInCalendar(calendarManager);
            }, 100);
        }
    }

    /**
     * Déclenche l'événement de mise à jour des événements
     * @private
     */
    triggerEventsUpdatedEvent() {
        window.dispatchEvent(new CustomEvent('calendar:eventsUpdated'));
    }

    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {boolean} [isError=false] - Indique si c'est une erreur
     * @private
     */
    showNotification(message, isError = false) {
        window.dispatchEvent(new CustomEvent('notification:show', {
            detail: { 
                message: message,
                isError: isError
            }
        }));
    }

    /**
     * Valide les données du formulaire
     * @returns {boolean} True si les données sont valides
     * @private
     */
    validateEventForm() {
        // Vérifier si le titre est renseigné
        if (!this.eventTitle || !this.eventTitle.value.trim()) {
            alert('Veuillez saisir un titre pour l\'événement');
            if (this.eventTitle) this.eventTitle.focus();
            return false;
        }
        
        // Vérifier si la date de début est renseignée
        if (!this.eventStartDate || !this.eventStartDate.value) {
            alert('Veuillez saisir une date de début');
            if (this.eventStartDate) this.eventStartDate.focus();
            return false;
        }
        
        // Vérifier si la date de fin est renseignée
        if (!this.eventEndDate || !this.eventEndDate.value) {
            alert('Veuillez saisir une date de fin');
            if (this.eventEndDate) this.eventEndDate.focus();
            return false;
        }
        
        // Vérifier que la date de fin est postérieure ou égale à la date de début
        const startDate = new Date(this.eventStartDate.value);
        const endDate = new Date(this.eventEndDate.value);
        
        if (endDate < startDate) {
            alert('La date de fin doit être postérieure ou égale à la date de début');
            if (this.eventEndDate) this.eventEndDate.focus();
            return false;
        }
        
        // Si les dates sont identiques, vérifier que l'heure de fin est postérieure à l'heure de début
        if (DateUtils.isSameDay(startDate, endDate) && 
            this.eventStartTime && this.eventEndTime && 
            !this.eventAllDay?.checked) {
            
            const [startHours, startMinutes] = this.eventStartTime.value.split(':').map(Number);
            const [endHours, endMinutes] = this.eventEndTime.value.split(':').map(Number);
            
            if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
                alert('L\'heure de fin doit être postérieure à l\'heure de début');
                if (this.eventEndTime) this.eventEndTime.focus();
                return false;
            }
        }
        
        return true;
    }

    /**
     * Récupère les données du formulaire
     * @returns {Object} Données de l'événement
     * @private
     */
    getEventFormData() {
        // Récupérer les valeurs de base
        const title = this.eventTitle?.value.trim() || '';
        const startDate = this.eventStartDate?.value || '';
        const endDate = this.eventEndDate?.value || '';
        const isAllDay = this.eventAllDay?.checked || false;
        const startTime = isAllDay ? '00:00' : (this.eventStartTime?.value || '00:00');
        const endTime = isAllDay ? '23:59' : (this.eventEndTime?.value || '23:59');
        
        // Gestion de la catégorie
        let categoryId = null;
        if (this.eventCategory?.value && this.eventCategory.value !== '') {
            categoryId = this.eventCategory.value;
        }
        
        const location = this.eventLocation?.value.trim() || '';
        const description = this.eventDescription?.value.trim() || '';
        const recurrenceType = this.eventRecurrence?.value || 'none';
        
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
            updatedAt: new Date().toISOString()
        };
        
        // Ajouter les données de récurrence si nécessaire
        if (recurrenceType !== 'none') {
            eventData.recurrence = this.getRecurrenceData(recurrenceType);
        }
        
        return eventData;
    }

    /**
     * Récupère les données de récurrence du formulaire
     * @param {string} recurrenceType - Type de récurrence
     * @returns {Object} - Données de récurrence
     * @private
     */
    getRecurrenceData(recurrenceType) {
        const recurrenceData = {
            type: recurrenceType
        };
        
        // Récupérer les options spécifiques en fonction du type de récurrence
        switch (recurrenceType) {
            case 'daily':
                recurrenceData.interval = parseInt(document.getElementById('recurrence-daily-interval')?.value) || 1;
                recurrenceData.end = this.getRecurrenceEndData('daily');
                break;
                
            case 'weekly':
                recurrenceData.interval = parseInt(document.getElementById('recurrence-weekly-interval')?.value) || 1;
                
                // Récupérer les jours de la semaine sélectionnés
                const selectedDays = [];
                document.querySelectorAll('input[name="recurrence-weekly-day"]:checked').forEach(checkbox => {
                    selectedDays.push(parseInt(checkbox.value));
                });
                
                // Si aucun jour n'est sélectionné, utiliser le jour de la date de début
                recurrenceData.days = selectedDays.length > 0 
                    ? selectedDays 
                    : [new Date(this.eventStartDate.value).getDay()];
                
                recurrenceData.end = this.getRecurrenceEndData('weekly');
                break;
                
            case 'monthly':
                recurrenceData.interval = parseInt(document.getElementById('recurrence-monthly-interval')?.value) || 1;
                
                // Récupérer le type de récurrence mensuelle
                const monthlyType = document.querySelector('input[name="recurrence-monthly-type"]:checked')?.value;
                recurrenceData.monthlyType = monthlyType || 'day-of-month';
                
                if (monthlyType === 'day-of-month') {
                    // Jour du mois
                    recurrenceData.dayOfMonth = new Date(this.eventStartDate.value).getDate();
                } else {
                    // Jour de la semaine dans le mois
                    recurrenceData.weekNumber = parseInt(document.getElementById('recurrence-monthly-week')?.value) || 1;
                    recurrenceData.dayOfWeek = parseInt(document.getElementById('recurrence-monthly-day')?.value) || 1;
                }
                
                recurrenceData.end = this.getRecurrenceEndData('monthly');
                break;
                
            case 'yearly':
                recurrenceData.interval = parseInt(document.getElementById('recurrence-yearly-interval')?.value) || 1;
                
                // Récupérer le type de récurrence annuelle
                const yearlyType = document.querySelector('input[name="recurrence-yearly-type"]:checked')?.value;
                recurrenceData.yearlyType = yearlyType || 'date';
                
                if (yearlyType === 'date') {
                    // Date spécifique dans l'année
                    const startDate = new Date(this.eventStartDate.value);
                    recurrenceData.month = startDate.getMonth();
                    recurrenceData.dayOfMonth = startDate.getDate();
                } else {
                    // Jour de la semaine dans le mois
                    recurrenceData.weekNumber = parseInt(document.getElementById('recurrence-yearly-week')?.value) || 1;
                    recurrenceData.dayOfWeek = parseInt(document.getElementById('recurrence-yearly-day')?.value) || 1;
                    recurrenceData.month = parseInt(document.getElementById('recurrence-yearly-month')?.value) || 0;
                }
                
                recurrenceData.end = this.getRecurrenceEndData('yearly');
                break;
                
            case 'custom':
                recurrenceData.interval = parseInt(document.getElementById('recurrence-custom-interval')?.value) || 1;
                recurrenceData.unit = document.getElementById('recurrence-custom-unit')?.value || 'days';
                recurrenceData.end = this.getRecurrenceEndData('custom');
                break;
        }
        
        return recurrenceData;
    }

    /**
     * Récupère les données de fin de récurrence
     * @param {string} recurrenceType - Type de récurrence
     * @returns {Object} - Données de fin de récurrence
     * @private
     */
    getRecurrenceEndData(recurrenceType) {
        const suffix = recurrenceType !== 'daily' ? '-' + recurrenceType : '';
        const endType = document.getElementById(`recurrence-end-type${suffix}`)?.value || 'never';
        
        switch (endType) {
            case 'never':
                return { type: 'never' };
                
            case 'after':
                const occurrences = parseInt(document.getElementById(`recurrence-end-after${suffix}`)?.value) || 10;
                return { type: 'after', occurrences };
                
            case 'on-date':
                const endDate = document.getElementById(`recurrence-end-on-date${suffix}`)?.value;
                return { type: 'on-date', date: endDate };
                
            default:
                return { type: 'never' };
        }
    }

    /**
     * Génère les événements récurrents en fonction des règles de récurrence
     * @param {Object} templateEvent - Événement modèle pour la récurrence
     * @returns {Array} - Liste des événements générés
     * @private
     */
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
            } else if (recurrence.end.type === 'on-date' && recurrence.end.date) {
                endDate = new Date(recurrence.end.date);
                endDate.setHours(23, 59, 59, 999);
            }
        }
        
        // Générer un ID de série unique pour tous les événements de cette récurrence
        const recurrenceId = Date.now().toString();
        
        // Ajouter l'événement initial
        events.push({
            ...templateEvent,
            recurrenceId,
            recurrenceSequence: 0 // Position dans la série
        });
        
        // Générer les occurrences suivantes
        let currentDate = new Date(startDate);
        let sequence = 1;
        
        while (events.length < maxOccurrences) {
            // Calculer la date de la prochaine occurrence
            const nextDate = this.calculateNextRecurrenceDate(currentDate, recurrence);
            
            // Si la date de fin est dépassée ou si pas de date suivante, arrêter
            if ((endDate && nextDate > endDate) || !nextDate) {
                break;
            }
            
            // Calculer la date de fin de l'occurrence
            const nextEndDate = new Date(nextDate.getTime() + eventDuration);
            
            // Créer l'événement récurrent
            const recurringEvent = {
                ...templateEvent,
                startDate: DateUtils.formatDate(nextDate),
                endDate: DateUtils.formatDate(nextEndDate),
                recurrenceId,
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
    
    /**
     * Calcule la date de la prochaine occurrence selon les règles de récurrence
     * @param {Date} currentDate - Date de l'occurrence actuelle
     * @param {Object} recurrence - Règles de récurrence
     * @returns {Date|null} Prochaine date, ou null si pas de prochaine date
     * @private
     */
    calculateNextRecurrenceDate(currentDate, recurrence) {
        if (!recurrence || !recurrence.type || recurrence.type === 'none') {
            return null;
        }
        
        let nextDate = null;
        const interval = recurrence.interval || 1;
        
        switch (recurrence.type) {
            case 'daily':
                nextDate = new Date(currentDate);
                nextDate.setDate(nextDate.getDate() + interval);
                break;
                
            case 'weekly':
                nextDate = this.calculateNextWeeklyDate(currentDate, recurrence);
                break;
                
            case 'monthly':
                nextDate = this.calculateNextMonthlyDate(currentDate, recurrence);
                break;
                
            case 'yearly':
                nextDate = this.calculateNextYearlyDate(currentDate, recurrence);
                break;
                
            case 'custom':
                nextDate = this.calculateNextCustomDate(currentDate, recurrence);
                break;
        }
        
        return nextDate;
    }
    
    /**
     * Calcule la prochaine date pour une récurrence hebdomadaire
     * @param {Date} currentDate - Date actuelle
     * @param {Object} recurrence - Règles de récurrence
     * @returns {Date} Prochaine date d'occurrence
     * @private
     */
    calculateNextWeeklyDate(currentDate, recurrence) {
        const days = recurrence.days || [currentDate.getDay()];
        const interval = recurrence.interval || 1;
        
        // Trouver le prochain jour de la semaine
        let foundNextDay = false;
        let nextDate = new Date(currentDate);
        let daysToAdd = 1;
        let weekCounter = 0;
        
        while (!foundNextDay && daysToAdd < 50) { // Limite pour éviter une boucle infinie
            // Avancer d'un jour
            nextDate = new Date(currentDate);
            nextDate.setDate(currentDate.getDate() + daysToAdd);
            
            // Vérifier si on change de semaine
            if (nextDate.getDay() < currentDate.getDay()) {
                weekCounter++;
            }
            
            // Vérifier si ce jour est dans la liste ET si on a atteint l'intervalle de semaines
            if (days.includes(nextDate.getDay()) && weekCounter >= interval) {
                foundNextDay = true;
            } else {
                daysToAdd++;
            }
        }
        
        // Si aucun jour n'a été trouvé, utiliser l'intervalle par défaut
        if (!foundNextDay) {
            nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + (7 * interval));
        }
        
        return nextDate;
    }
    
    /**
     * Calcule la prochaine date pour une récurrence mensuelle
     * @param {Date} currentDate - Date actuelle
     * @param {Object} recurrence - Règles de récurrence
     * @returns {Date} Prochaine date d'occurrence
     * @private
     */
    calculateNextMonthlyDate(currentDate, recurrence) {
        const interval = recurrence.interval || 1;
        
        // Nouvelle date de base avancée du nombre de mois de l'intervalle
        const baseDate = new Date(currentDate);
        baseDate.setMonth(baseDate.getMonth() + interval);
        
        // Selon le type de récurrence mensuelle
        if (recurrence.monthlyType === 'day-of-month') {
            // Jour spécifique du mois (ex: le 15 de chaque mois)
            const dayOfMonth = recurrence.dayOfMonth || currentDate.getDate();
            
            // Créer la date avec le jour spécifique
            const result = new Date(baseDate.getFullYear(), baseDate.getMonth(), dayOfMonth);
            
            // Vérifier si le jour existe dans ce mois (ex: 31 février)
            if (result.getMonth() !== baseDate.getMonth()) {
                // Si le jour n'existe pas, prendre le dernier jour du mois
                result.setDate(0);
            }
            
            return result;
        } else {
            // Jour de la semaine spécifique (ex: le deuxième mardi du mois)
            return this.getNthDayOfMonth(
                baseDate.getFullYear(),
                baseDate.getMonth(),
                recurrence.dayOfWeek || currentDate.getDay(),
                recurrence.weekNumber || Math.ceil(currentDate.getDate() / 7)
            );
        }
    }
    
    /**
     * Calcule la prochaine date pour une récurrence annuelle
     * @param {Date} currentDate - Date actuelle
     * @param {Object} recurrence - Règles de récurrence
     * @returns {Date} Prochaine date d'occurrence
     * @private
     */
    calculateNextYearlyDate(currentDate, recurrence) {
        const interval = recurrence.interval || 1;
        
        // Nouvelle année de base
        const baseYear = currentDate.getFullYear() + interval;
        
        // Selon le type de récurrence annuelle
        if (recurrence.yearlyType === 'date') {
            // Date spécifique chaque année (ex: 15 mars)
            const month = recurrence.month !== undefined ? recurrence.month : currentDate.getMonth();
            const day = recurrence.dayOfMonth || currentDate.getDate();
            
            return new Date(baseYear, month, day);
        } else {
            // Jour de la semaine spécifique (ex: dernier lundi de mai)
            const month = recurrence.month !== undefined ? recurrence.month : currentDate.getMonth();
            
            return this.getNthDayOfMonth(
                baseYear,
                month,
                recurrence.dayOfWeek || currentDate.getDay(),
                recurrence.weekNumber || Math.ceil(currentDate.getDate() / 7)
            );
        }
    }
    
    /**
     * Calcule la prochaine date pour une récurrence personnalisée
     * @param {Date} currentDate - Date actuelle
     * @param {Object} recurrence - Règles de récurrence
     * @returns {Date} Prochaine date d'occurrence
     * @private
     */
    calculateNextCustomDate(currentDate, recurrence) {
        const interval = recurrence.interval || 1;
        const unit = recurrence.unit || 'days';
        const result = new Date(currentDate);
        
        switch (unit) {
            case 'days':
                result.setDate(result.getDate() + interval);
                break;
            case 'weeks':
                result.setDate(result.getDate() + (interval * 7));
                break;
            case 'months':
                result.setMonth(result.getMonth() + interval);
                break;
            case 'years':
                result.setFullYear(result.getFullYear() + interval);
                break;
        }
        
        return result;
    }

    /**
     * Obtient le Nième jour de la semaine dans un mois (1 = premier, 2 = deuxième, ... -1 = dernier)
     * @param {number} year - Année
     * @param {number} month - Mois (0-11)
     * @param {number} dayOfWeek - Jour de la semaine (0-6, 0 = dimanche)
     * @param {number} n - Numéro d'occurrence (1-5, ou -1 pour le dernier)
     * @returns {Date} Date correspondante
     * @private
     */
    getNthDayOfMonth(year, month, dayOfWeek, n) {
        // Gérer le cas du dernier jour de la semaine du mois
        if (n < 0) {
            // Dernier jour du mois
            const lastDay = new Date(year, month + 1, 0);
            
            // Reculer jusqu'au jour de la semaine recherché
            const result = new Date(lastDay);
            while (result.getDay() !== dayOfWeek) {
                result.setDate(result.getDate() - 1);
            }
            
            // Si n est -1, c'est le dernier jour de la semaine
            // Si n est -2, c'est l'avant-dernier, etc.
            if (n < -1) {
                result.setDate(result.getDate() + (n + 1) * 7);
            }
            
            return result;
        } else {
            // Commencer au premier jour du mois
            const firstDay = new Date(year, month, 1);
            
            // Trouver le premier jour de la semaine recherché
            let dayOffset = (dayOfWeek - firstDay.getDay() + 7) % 7;
            if (dayOffset === 0) dayOffset = 7; // Si premier jour déjà bon, prendre le suivant
            
            const result = new Date(firstDay);
            result.setDate(1 + dayOffset + (n - 1) * 7);
            
            // Vérifier si on est toujours dans le bon mois
            if (result.getMonth() !== month) {
                return null; // Ce jour n'existe pas ce mois-ci
            }
            
            return result;
        }
    }

    /**
     * Méthode pour mettre à jour les événements dans le calendrier
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {Array} [customEvents=null] - Liste d'événements personnalisée (optionnelle)
     */
    updateEventsInCalendar(calendarManager, customEvents = null) {
        const currentView = calendarManager.currentView;
        const currentDate = calendarManager.currentDate;
        
        // Utiliser les événements personnalisés s'ils sont fournis, sinon utiliser tous les événements
        const events = customEvents !== null ? customEvents : this.dataManager.getAllEvents();
        
        console.log(`Mise à jour des événements pour la vue ${currentView}, ${events.length} événements à traiter`);
        
        // Filtrer les événements en fonction de la vue
        const filteredEvents = this.filterEventsByView(events, currentView, currentDate);
        
        console.log(`Après filtrage par vue: ${filteredEvents.length} événements à afficher`);
        
        // Ajouter les événements au calendrier en fonction de la vue
        this.renderEventsInCalendar(calendarManager, filteredEvents);
    }

    /**
     * Filtre les événements selon la vue active
     * @param {Array} events - Liste d'événements
     * @param {string} view - Vue courante ('yearly', 'monthly', 'weekly', 'daily')
     * @param {Date} date - Date de référence
     * @returns {Array} - Liste d'événements filtrée
     * @private
     */
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

    /**
     * Filtre les événements pour la vue annuelle
     * @param {Array} events - Liste d'événements
     * @param {Date} date - Date de référence
     * @returns {Array} - Liste d'événements filtrée
     * @private
     */
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

    /**
     * Filtre les événements pour la vue mensuelle
     * @param {Array} events - Liste d'événements
     * @param {Date} date - Date de référence
     * @returns {Array} - Liste d'événements filtrée
     * @private
     */
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

    /**
     * Filtre les événements pour la vue hebdomadaire
     * @param {Array} events - Liste d'événements
     * @param {Date} date - Date de référence
     * @returns {Array} - Liste d'événements filtrée
     * @private
     */
    filterEventsForWeeklyView(events, date) {
        const startOfWeek = DateUtils.getStartOfWeek(date);
        const endOfWeek = DateUtils.getEndOfWeek(date);
        
        return events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            return eventStartDate <= endOfWeek && eventEndDate >= startOfWeek;
        });
    }

    /**
     * Filtre les événements pour la vue quotidienne
     * @param {Array} events - Liste d'événements
     * @param {Date} date - Date de référence
     * @returns {Array} - Liste d'événements filtrée
     * @private
     */
    filterEventsForDailyView(events, date) {
        const startOfDay = DateUtils.startOfDay(date);
        const endOfDay = DateUtils.endOfDay(date);
        
        return events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            return eventStartDate <= endOfDay && eventEndDate >= startOfDay;
        });
    }

    /**
     * Affiche les événements du calendrier selon la vue active
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {Array} events - Liste d'événements
     * @private
     */
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

    /**
     * Affiche les événements dans la vue annuelle
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {Array} events - Liste d'événements
     * @private
     */
    renderEventsInYearlyView(calendarManager, events) {
        if (!calendarManager.calendarContainer) return;
        
        // Nettoyer les indicateurs d'événements existants
        calendarManager.calendarContainer.querySelectorAll('.has-event').forEach(el => {
            el.classList.remove('has-event');
            const emoji = el.querySelector('.category-emoji');
            if (emoji) emoji.remove();
            const tooltip = el.querySelector('.tooltip');
            if (tooltip) tooltip.remove();
        });
        
        // Marquer les jours avec des événements
        events.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            const category = this.getCategoryForEvent(event);
            
            // Parcourir tous les jours entre startDate et endDate
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const month = currentDate.getMonth();
                const day = currentDate.getDate();
                
                // Trouver l'élément jour correspondant
                const dateString = `${currentDate.getFullYear()}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const dayElement = calendarManager.calendarContainer.querySelector(`[data-date="${dateString}"]`);
                
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

    /**
     * Affiche les événements dans la vue mensuelle
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {Array} events - Liste d'événements
     * @private
     */
    renderEventsInMonthlyView(calendarManager, events) {
        if (!calendarManager.monthCalendarContainer) return;
        
        // Nettoyer les événements existants
        calendarManager.monthCalendarContainer.querySelectorAll('.month-day-event').forEach(el => el.remove());
        calendarManager.monthCalendarContainer.querySelectorAll('.has-event').forEach(el => {
            el.classList.remove('has-event');
        });
        
        // Trier les événements par date de début
        events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        // Parcourir tous les événements
        events.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            const category = this.getCategoryForEvent(event);
            
            // Parcourir tous les jours entre startDate et endDate
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                // Trouver l'élément jour correspondant
                const dayElement = calendarManager.monthCalendarContainer.querySelector(
                    `[data-date="${DateUtils.formatDate(currentDate)}"]`
                );
                
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
                        const eventElement = this.createMonthDayEvent(event, category);
                        
                        // Ajouter l'événement au jour
                        eventsContainer.appendChild(eventElement);
                    }
                }
                
                // Passer au jour suivant
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
    }
    
    /**
     * Crée un élément d'événement pour la vue mensuelle
     * @param {Object} event - Événement à afficher
     * @param {Object} category - Catégorie de l'événement
     * @returns {HTMLElement} Élément DOM représentant l'événement
     * @private
     */
    createMonthDayEvent(event, category) {
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
        
        // Ajouter l'événement de clic pour ouvrir l'édition
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêcher le clic de se propager au jour
            this.openEditEventForm(event.id);
        });
        
        return eventElement;
    }

    /**
     * Affiche les événements dans la vue hebdomadaire
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {Array} events - Liste d'événements
     * @private
     */
    renderEventsInWeeklyView(calendarManager, events) {
        if (!calendarManager.weekCalendarContainer) return;
        
        // Nettoyer d'abord les événements existants
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

    /**
     * Affiche les événements "toute la journée" dans la vue hebdomadaire
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {Array} events - Liste d'événements
     * @param {Date} startOfWeek - Premier jour de la semaine
     * @private
     */
    renderAllDayEventsInWeeklyView(calendarManager, events, startOfWeek) {
        // Créer une zone spéciale pour les événements "toute la journée"
        const allDayContainer = document.createElement('div');
        allDayContainer.className = 'all-day-events-container';
        allDayContainer.style.gridColumn = '1 / span 8'; // Couvre toutes les colonnes
        
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
            
            dayContainers[dateString] = dayContainer;
            daysRow.appendChild(dayContainer);
        }
        
        // Ajouter chaque événement "toute la journée" au jour correspondant
        events.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            const category = this.getCategoryForEvent(event);
            
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

    /**
     * Affiche les événements réguliers dans la vue hebdomadaire
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {Array} events - Liste d'événements
     * @param {Date} startOfWeek - Premier jour de la semaine
     * @private
     */
    renderRegularEventsInWeeklyView(calendarManager, events, startOfWeek) {
        events.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            const category = this.getCategoryForEvent(event);
            
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
                // Calculer l'index du jour dans la semaine (0 = premier jour de la semaine)
                const dayIndex = (currentDate.getDay() - calendarManager.firstDayOfWeek + 7) % 7;
                
                // Trouver toutes les colonnes du jour
                const dayColumns = calendarManager.weekCalendarContainer.querySelectorAll('.week-day-column');
                
                // Heures concernées par l'événement
                const startHour = Math.floor(startTime);
                const endHour = Math.ceil(endTime);
                
                // Trouver la colonne correspondant au jour et à l'heure de début
                // Nombre de colonnes par rangée = 8 (1 pour les heures + 7 jours)
                const columnIndex = dayIndex + 7 * startHour + 1; // +1 pour tenir compte de la colonne des heures
                
                const dayColumn = Array.from(dayColumns).find((col, index) => 
                    index % 8 === dayIndex + 1 && // +1 pour tenir compte de la colonne des heures
                    Math.floor(index / 8) === startHour
                );
                
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
                
                // Passer au jour suivant
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
    }

    /**
     * Affiche les événements dans la vue quotidienne
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {Array} events - Liste d'événements
     * @private
     */
    renderEventsInDailyView(calendarManager, events) {
        // Récupérer la colonne des événements
        const dayTimeline = calendarManager.dayScheduleContainer.querySelector('.day-timeline');
        if (!dayTimeline) return;
        
        const eventsColumn = dayTimeline.querySelector('.day-events-column');
        if (!eventsColumn) return;
        
        // Nettoyer les événements existants
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

    /**
     * Affiche les événements "toute la journée" dans la vue quotidienne
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {Array} events - Liste d'événements
     * @private
     */
    renderAllDayEventsInDailyView(calendarManager, events) {
        // Créer une zone spéciale pour les événements "toute la journée"
        const allDayContainer = document.createElement('div');
        allDayContainer.className = 'all-day-events-container';
        
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
            const category = this.getCategoryForEvent(event);
            
            // Créer l'élément d'événement
            const eventElement = document.createElement('div');
            eventElement.className = 'day-all-day-event';
            eventElement.dataset.eventId = event.id;
            
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

    /**
     * Affiche les événements réguliers dans la vue quotidienne
     * @param {CalendarManager} calendarManager - Gestionnaire de calendrier
     * @param {Array} events - Liste d'événements
     * @param {HTMLElement} eventsColumn - Colonne des événements
     * @private
     */
    renderRegularEventsInDailyView(calendarManager, events, eventsColumn) {
        // Récupérer les éléments d'heure pour déterminer les dimensions
        const hourElements = calendarManager.dayScheduleContainer.querySelectorAll('.day-hour');
        if (hourElements.length === 0) return;
        
        // Calculer la hauteur d'une heure en pixels
        const hourHeight = hourElements[0].offsetHeight;
        
        // Trier les événements par heure de début
        events.sort((a, b) => {
            if (!a.startTime || !b.startTime) return 0;
            return a.startTime.localeCompare(b.startTime);
        });
        
        // Créer une fonction pour détecter les chevauchements d'événements
        const eventsInColumns = [];
        
        events.forEach(event => {
            const category = this.getCategoryForEvent(event);
            
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

    /**
     * Récupère la catégorie associée à un événement
     * @param {Object} event - Événement
     * @returns {Object|null} - Catégorie ou valeurs par défaut
     * @private
     */
    getCategoryForEvent(event) {
        try {
            if (!event.categoryId) return null;
            
            const category = this.dataManager.getCategoryById(event.categoryId);
            return category || {
                name: 'Sans catégorie',
                color: '#cccccc',
                emoji: '📅'
            };
        } catch (error) {
            console.error('Erreur lors de la récupération de la catégorie:', error);
            return {
                name: 'Sans catégorie',
                color: '#cccccc',
                emoji: '📅'
            };
        }
    }

    /**
     * Affiche les événements à venir
     * @param {Array} [filteredEvents=null] - Liste d'événements personnalisée (optionnelle)
     */
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
        
        // Filtrer uniquement les événements futurs ou en cours
        const upcomingEvents = allEvents.filter(event => {
            const eventEndDate = new Date(event.endDate);
            eventEndDate.setHours(23, 59, 59, 999); // Fin de la journée
            return eventEndDate >= today;
        });
        
        // Trier par date de début
        upcomingEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        // Limiter le nombre d'événements à afficher (par exemple, les 10 premiers)
        const eventsToShow = upcomingEvents.slice(0, 10);
        
        // Afficher un message si aucun événement
        if (eventsToShow.length === 0) {
            eventsContainer.innerHTML = '<p class="no-events">Aucun événement à venir.</p>';
            return;
        }
        
        // Créer les cartes d'événements
        eventsToShow.forEach(event => {
            this.createEventCard(event, eventsContainer);
        });
        
        // Ajouter un bouton pour voir plus si nécessaire
        if (upcomingEvents.length > 10) {
            const viewMoreBtn = document.createElement('button');
            viewMoreBtn.className = 'btn btn-secondary';
            viewMoreBtn.style.marginTop = '15px';
            viewMoreBtn.innerHTML = '<i class="fas fa-eye"></i> Voir tous les événements';
            viewMoreBtn.addEventListener('click', () => {
                // Afficher tous les événements
                eventsContainer.innerHTML = '';
                upcomingEvents.forEach(event => {
                    this.createEventCard(event, eventsContainer);
                });
            });
            
            eventsContainer.appendChild(viewMoreBtn);
        }
    }

    /**
     * Crée une carte d'événement
     * @param {Object} event - Événement
     * @param {HTMLElement} container - Conteneur pour la carte
     * @private
     */
    createEventCard(event, container) {
        // Récupérer la catégorie associée
        const category = this.getCategoryForEvent(event);
        
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
                    <div class="event-category" style="background-color: ${category.color}20; color: ${category.color};">
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