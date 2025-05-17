/**
 * @fileoverview Gestionnaire du calendrier pour SuperCalendrier
 * Responsable du rendu des différentes vues de calendrier et de la navigation
 * @module CalendarManager
 */

import { DateUtils } from './utils/date-utils.js';

/**
 * Classe gestionnaire du calendrier
 * Gère les différentes vues (annuelle, mensuelle, hebdomadaire, quotidienne) et la navigation
 */
export class CalendarManager {
    /**
     * Crée une instance du gestionnaire de calendrier
     */
    constructor() {
        /**
         * Date courante sélectionnée dans le calendrier
         * @type {Date}
         * @private
         */
        this.currentDate = new Date();
        
        /**
         * Vue courante ('yearly', 'monthly', 'weekly', 'daily')
         * @type {string}
         */
        this.currentView = 'yearly';
        
        /**
         * Référence à un timer pour la mise à jour de la ligne de temps actuelle
         * @type {number|null}
         * @private
         */
        this._currentTimeTimer = null;
        
        /**
         * Dimensions des cellules des différentes vues en pixels
         * @type {Object}
         * @private
         */
        this._cellDimensions = {
            hourHeight: 50, // Hauteur d'une heure en pixels dans les vues hebdo/quotidienne
            dayHeight: 120  // Hauteur d'un jour en pixels dans la vue mensuelle
        };
        
        // Initialiser les références aux éléments DOM
        this._initDOMReferences();
        
        /**
         * Noms des mois en français
         * @type {Array<string>}
         */
        this.months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        /**
         * Noms courts des jours en français
         * @type {Array<string>}
         */
        this.days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        
        /**
         * Noms longs des jours en français
         * @type {Array<string>}
         */
        this.daysLong = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        /**
         * Premier jour de la semaine (0 = Dimanche, 1 = Lundi)
         * @type {number}
         */
        this.firstDayOfWeek = 1;
        
        // Initialiser les écouteurs d'événements
        this._initEventListeners();
        
        // Démarrer le minuteur pour la ligne de temps actuelle
        this._startCurrentTimeUpdater();
    }
    
    /**
     * Initialise les références aux éléments DOM utilisés par le gestionnaire
     * @private
     */
    _initDOMReferences() {
        // Conteneurs principaux des vues
        this.yearlyView = document.getElementById('yearly-view');
        this.monthlyView = document.getElementById('monthly-view');
        this.weeklyView = document.getElementById('weekly-view');
        this.dailyView = document.getElementById('daily-view');
        
        // Éléments d'affichage de la date/période courante
        this.currentYearLabel = document.getElementById('current-year');
        this.currentMonthLabel = document.getElementById('current-month');
        this.currentYearMonthlyLabel = document.getElementById('current-year-monthly');
        this.currentWeekLabel = document.getElementById('current-week');
        this.currentDayLabel = document.getElementById('current-day');
        
        // Conteneurs pour les différentes vues du calendrier
        this.calendarContainer = document.getElementById('calendar'); // Vue annuelle
        this.monthCalendarContainer = document.getElementById('month-calendar'); // Vue mensuelle
        this.weekCalendarContainer = document.getElementById('week-calendar'); // Vue hebdomadaire
        this.dayScheduleContainer = document.getElementById('day-schedule'); // Vue quotidienne
        
        // Boutons de navigation
        this.prevYearBtn = document.getElementById('prev-year');
        this.nextYearBtn = document.getElementById('next-year');
        this.prevMonthBtn = document.getElementById('prev-month');
        this.nextMonthBtn = document.getElementById('next-month');
        this.prevWeekBtn = document.getElementById('prev-week');
        this.nextWeekBtn = document.getElementById('next-week');
        this.prevDayBtn = document.getElementById('prev-day');
        this.nextDayBtn = document.getElementById('next-day');
    }
    
    /**
     * Initialise les écouteurs d'événements pour la navigation
     * @private
     */
    _initEventListeners() {
        // Navigation annuelle
        if (this.prevYearBtn && this.nextYearBtn) {
            this.prevYearBtn.addEventListener('click', () => this.changeYear(-1));
            this.nextYearBtn.addEventListener('click', () => this.changeYear(1));
        }
        
        // Navigation mensuelle
        if (this.prevMonthBtn && this.nextMonthBtn) {
            this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
            this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        }
        
        // Navigation hebdomadaire
        if (this.prevWeekBtn && this.nextWeekBtn) {
            this.prevWeekBtn.addEventListener('click', () => this.changeWeek(-1));
            this.nextWeekBtn.addEventListener('click', () => this.changeWeek(1));
        }
        
        // Navigation quotidienne
        if (this.prevDayBtn && this.nextDayBtn) {
            this.prevDayBtn.addEventListener('click', () => this.changeDay(-1));
            this.nextDayBtn.addEventListener('click', () => this.changeDay(1));
        }
        
        // Écouteur pour les changements de taille de fenêtre
        window.addEventListener('resize', this._handleWindowResize.bind(this));
        
        // Écouteur pour les changements de fuseau horaire
        // Important pour mettre à jour la ligne de temps actuelle
        window.addEventListener('timeupdate', this._updateCurrentTimeLine.bind(this));
    }
    
    /**
     * Gère le redimensionnement de la fenêtre
     * @private
     */
    _handleWindowResize() {
        // Recalculer les dimensions si nécessaire
        this._recalculateCellDimensions();
        
        // Mettre à jour la vue actuelle
        this.renderCurrentView();
        
        // Mettre à jour la position de la ligne de temps actuelle
        this._updateCurrentTimeLine();
    }
    
    /**
     * Recalcule les dimensions des cellules en fonction de la taille actuelle de la fenêtre
     * @private
     */
    _recalculateCellDimensions() {
        // Récupérer une cellule d'heure pour les vues hebdo/quotidienne
        let hourCell;
        if (this.currentView === 'weekly' && this.weekCalendarContainer) {
            hourCell = this.weekCalendarContainer.querySelector('.week-time');
        } else if (this.currentView === 'daily' && this.dayScheduleContainer) {
            hourCell = this.dayScheduleContainer.querySelector('.day-hour');
        }
        
        // Mettre à jour la hauteur des cellules d'heure
        if (hourCell) {
            this._cellDimensions.hourHeight = hourCell.offsetHeight;
        }
        
        // Récupérer une cellule de jour pour la vue mensuelle
        let dayCell;
        if (this.currentView === 'monthly' && this.monthCalendarContainer) {
            dayCell = this.monthCalendarContainer.querySelector('.month-day');
        }
        
        // Mettre à jour la hauteur des cellules de jour
        if (dayCell) {
            this._cellDimensions.dayHeight = dayCell.offsetHeight;
        }
    }
    
    /**
     * Démarre un minuteur pour mettre à jour la ligne de temps actuelle
     * @private
     */
    _startCurrentTimeUpdater() {
        // Nettoyer tout minuteur existant
        if (this._currentTimeTimer) {
            clearInterval(this._currentTimeTimer);
        }
        
        // Mettre à jour immédiatement
        this._updateCurrentTimeLine();
        
        // Puis mettre à jour toutes les minutes
        this._currentTimeTimer = setInterval(() => {
            this._updateCurrentTimeLine();
        }, 60000); // 60 secondes = 1 minute
    }
    
    /**
     * Met à jour la ligne de temps actuelle dans les vues hebdomadaire et quotidienne
     * @private
     */
    _updateCurrentTimeLine() {
        // Supprimer les lignes de temps actuelles existantes
        const currentTimeLines = document.querySelectorAll('.current-time-line');
        currentTimeLines.forEach(line => line.remove());
        
        // Ajouter les nouvelles lignes de temps si nécessaire
        if (this.currentView === 'weekly') {
            this._addCurrentTimeLineToWeeklyView();
        } else if (this.currentView === 'daily') {
            this._addCurrentTimeLineToDailyView();
        }
    }
    
    /**
     * Arrête le minuteur de mise à jour de la ligne de temps actuelle
     * @private
     */
    _stopCurrentTimeUpdater() {
        if (this._currentTimeTimer) {
            clearInterval(this._currentTimeTimer);
            this._currentTimeTimer = null;
        }
    }
    
    /**
     * Change l'année courante
     * @param {number} increment - Nombre d'années à ajouter (positif) ou soustraire (négatif)
     */
    changeYear(increment) {
        // Créer une copie de la date actuelle pour éviter les références partagées
        const newDate = new Date(this.currentDate);
        newDate.setFullYear(newDate.getFullYear() + increment);
        this.currentDate = newDate;
        
        // Mettre à jour la vue
        this.renderCurrentView();
        
        // Déclencher l'événement pour mettre à jour les événements
        this._triggerDateChangedEvent();
    }
    
    /**
     * Change le mois courant
     * @param {number} increment - Nombre de mois à ajouter (positif) ou soustraire (négatif)
     */
    changeMonth(increment) {
        // Créer une copie de la date actuelle pour éviter les références partagées
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        this.currentDate = newDate;
        
        // Mettre à jour la vue
        this.renderCurrentView();
        
        // Déclencher l'événement pour mettre à jour les événements
        this._triggerDateChangedEvent();
    }
    
    /**
     * Change la semaine courante
     * @param {number} increment - Nombre de semaines à ajouter (positif) ou soustraire (négatif)
     */
    changeWeek(increment) {
        // Créer une copie de la date actuelle pour éviter les références partagées
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + (increment * 7));
        this.currentDate = newDate;
        
        // Mettre à jour la vue
        this.renderCurrentView();
        
        // Déclencher l'événement pour mettre à jour les événements
        this._triggerDateChangedEvent();
    }
    
    /**
     * Change le jour courant
     * @param {number} increment - Nombre de jours à ajouter (positif) ou soustraire (négatif)
     */
    changeDay(increment) {
        // Créer une copie de la date actuelle pour éviter les références partagées
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + increment);
        this.currentDate = newDate;
        
        // Mettre à jour la vue
        this.renderCurrentView();
        
        // Déclencher l'événement pour mettre à jour les événements
        this._triggerDateChangedEvent();
    }
    
    /**
     * Navigue vers la date actuelle
     */
    goToToday() {
        // Mettre à jour la date courante
        this.currentDate = new Date();
        
        // Mettre à jour la vue
        this.renderCurrentView();
        
        // Déclencher l'événement pour mettre à jour les événements
        this._triggerDateChangedEvent();
        
        // Afficher une notification
        this._showNotification("Calendrier positionné à aujourd'hui");
    }
    
    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {boolean} [isError=false] - Indique si c'est une erreur
     * @private
     */
    _showNotification(message, isError = false) {
        window.dispatchEvent(new CustomEvent('notification:show', {
            detail: { 
                message: message, 
                isError: isError 
            }
        }));
    }
    
    /**
     * Déclenche un événement pour signaler un changement de date
     * @private
     */
    _triggerDateChangedEvent() {
        window.dispatchEvent(new CustomEvent('calendar:dateChanged', {
            detail: { date: new Date(this.currentDate) }
        }));
    }
    
    /**
     * Déclenche un événement pour signaler un changement de vue
     * @private
     */
    _triggerViewChangedEvent() {
        window.dispatchEvent(new CustomEvent('calendar:viewChanged', {
            detail: { view: this.currentView }
        }));
    }
    
    /**
     * Change la vue courante
     * @param {string} view - Nouvelle vue ('yearly', 'monthly', 'weekly', 'daily')
     */
    setView(view) {
        // Vérifier que la vue est valide
        if (!['yearly', 'monthly', 'weekly', 'daily'].includes(view)) {
            console.error(`Vue non reconnue: ${view}`);
            return;
        }
        
        // Changer la vue
        this.currentView = view;
        
        // Cacher toutes les vues
        this._hideAllViews();
        
        // Afficher la vue sélectionnée
        this._showSelectedView();
        
        // Mettre à jour le titre de la vue
        this._updateViewTitle();
        
        // Rendre la vue actuelle
        this.renderCurrentView();
        
        // Déclencher un événement pour mettre à jour les événements après le rendu de la vue
        setTimeout(() => {
            this._triggerViewChangedEvent();
        }, 100);
    }
    
    /**
     * Cache toutes les vues
     * @private
     */
    _hideAllViews() {
        if (this.yearlyView) this.yearlyView.classList.remove('active');
        if (this.monthlyView) this.monthlyView.classList.remove('active');
        if (this.weeklyView) this.weeklyView.classList.remove('active');
        if (this.dailyView) this.dailyView.classList.remove('active');
    }
    
    /**
     * Affiche la vue sélectionnée
     * @private
     */
    _showSelectedView() {
        switch (this.currentView) {
            case 'yearly':
                if (this.yearlyView) this.yearlyView.classList.add('active');
                break;
            case 'monthly':
                if (this.monthlyView) this.monthlyView.classList.add('active');
                break;
            case 'weekly':
                if (this.weeklyView) this.weeklyView.classList.add('active');
                break;
            case 'daily':
                if (this.dailyView) this.dailyView.classList.add('active');
                break;
        }
    }
    
    /**
     * Met à jour le titre de la vue
     * @private
     */
    _updateViewTitle() {
        const viewTitle = document.getElementById('current-view-title');
        if (!viewTitle) return;
        
        switch (this.currentView) {
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
    }
    
    /**
     * Rend la vue courante
     */
    renderCurrentView() {
        switch (this.currentView) {
            case 'yearly':
                this.renderYearlyView();
                break;
            case 'monthly':
                this.renderMonthlyView();
                break;
            case 'weekly':
                this.renderWeeklyView();
                break;
            case 'daily':
                this.renderDailyView();
                break;
        }
        
        // Mettre à jour la ligne de temps actuelle après avoir rendu la vue
        this._updateCurrentTimeLine();
    }
    
    /**
     * Rend la vue annuelle
     */
    renderYearlyView() {
        if (!this.calendarContainer) {
            console.error("Conteneur de calendrier non trouvé");
            return;
        }
        
        const year = this.currentDate.getFullYear();
        if (this.currentYearLabel) {
            this.currentYearLabel.textContent = year;
        }
        
        // Vider le conteneur
        this.calendarContainer.innerHTML = '';
        
        // Générer les mois
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const monthElement = this._createMonthCard(year, monthIndex);
            this.calendarContainer.appendChild(monthElement);
        }
    }
    
    /**
     * Crée une carte de mois pour la vue annuelle
     * @param {number} year - Année
     * @param {number} monthIndex - Index du mois (0-11)
     * @returns {HTMLElement} - Élément DOM représentant le mois
     * @private
     */
    _createMonthCard(year, monthIndex) {
        const monthElement = document.createElement('div');
        monthElement.className = 'month-card';
        
        // En-tête du mois
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.textContent = this.months[monthIndex];
        monthElement.appendChild(monthHeader);
        
        // Ajouter les jours de la semaine
        const weekdaysElement = document.createElement('div');
        weekdaysElement.className = 'weekdays';
        
        // Ajouter les jours selon firstDayOfWeek
        for (let i = 0; i < 7; i++) {
            const dayIndex = (this.firstDayOfWeek + i) % 7;
            const dayElement = document.createElement('div');
            dayElement.textContent = this.days[dayIndex];
            weekdaysElement.appendChild(dayElement);
        }
        
        monthElement.appendChild(weekdaysElement);
        
        // Ajouter les jours du mois
        const daysElement = document.createElement('div');
        daysElement.className = 'days';
        
        // Déterminer le premier jour du mois
        const firstDay = new Date(year, monthIndex, 1).getDay();
        // Ajuster pour commencer par firstDayOfWeek
        const firstDayAdjusted = (firstDay - this.firstDayOfWeek + 7) % 7;
        
        // Ajouter des cellules vides pour les jours précédant le premier du mois
        for (let i = 0; i < firstDayAdjusted; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            daysElement.appendChild(emptyDay);
        }
        
        // Nombre de jours dans le mois
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        
        // Date actuelle pour mettre en évidence le jour courant
        const today = new Date();
        const isCurrentMonth = today.getMonth() === monthIndex && today.getFullYear() === year;
        
        // Ajouter les jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = day;
            
            // Marquer le jour actuel
            if (isCurrentMonth && today.getDate() === day) {
                dayElement.classList.add('today');
            }
            
            // Ajouter un attribut de données pour la date
            dayElement.dataset.date = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Ajouter l'événement de clic
            dayElement.addEventListener('click', (e) => {
                // Récupérer la date à partir de l'attribut de données
                const date = e.currentTarget.dataset.date;
                if (date) {
                    // Mettre à jour la date courante
                    this.currentDate = new Date(date);
                    
                    // Passer à la vue quotidienne
                    this.setView('daily');
                }
            });
            
            daysElement.appendChild(dayElement);
        }
        
        monthElement.appendChild(daysElement);
        return monthElement;
    }
    
    /**
     * Rend la vue mensuelle
     */
    // renderMonthlyView() {
    //     if (!this.monthCalendarContainer) {
    //         console.error("Conteneur de calendrier mensuel non trouvé");
    //         return;
    //     }
        
    //     const year = this.currentDate.getFullYear();
    //     const month = this.currentDate.getMonth();
        
    //     if (this.currentMonthLabel) {
    //         this.currentMonthLabel.textContent = this.months[month];
    //     }
        
    //     if (this.currentYearMonthlyLabel) {
    //         this.currentYearMonthlyLabel.textContent = year;
    //     }
        
    //     // Vider le conteneur
    //     this.monthCalendarContainer.innerHTML = '';
        
    //     // Créer l'en-tête des jours de la semaine
    //     const weekdaysRow = document.createElement('div');
    //     weekdaysRow.className = 'weekdays';
        
    //     // Ajouter les jours selon firstDayOfWeek
    //     for (let i = 0; i < 7; i++) {
    //         const dayIndex = (this.firstDayOfWeek + i) % 7;
    //         const dayElement = document.createElement('div');
    //         dayElement.textContent = this.daysLong[dayIndex];
    //         weekdaysRow.appendChild(dayElement);
    //     }
        
    //     this.monthCalendarContainer.appendChild(weekdaysRow);
        
    //     // Créer la grille du mois
    //     const monthGrid = document.createElement('div');
    //     monthGrid.className = 'month-grid';
        
    //     // Déterminer le premier jour du mois
    //     const firstDay = new Date(year, month, 1).getDay();
    //     console.log(`Premier jour de la semaine: ${this.firstDayOfWeek}`);
    //     // Ajuster pour commencer par firstDayOfWeek
    //     const firstDayAdjusted = (firstDay || 7) - this.firstDayOfWeek;
    //     console.log(`Premier jour ajusté: ${firstDayAdjusted}`);

    //     // Date du premier jour affiché (peut être du mois précédent)
    //     const startDate = new Date(year, month, 1- firstDayAdjusted);
        
    //     // Date actuelle pour mettre en évidence le jour courant
    //     const today = new Date();
        
    //     // Générer 6 semaines (42 jours) pour couvrir le mois entier
    //     for (let i = 0; i < 42; i++) {
    //         const currentDate = new Date(startDate);
    //         currentDate.setDate(startDate.getDate() + i);
            
    //         const currentMonth = currentDate.getMonth();
    //         const currentDay = currentDate.getDate();
            
    //         const dayElement = document.createElement('div');
    //         dayElement.className = 'month-day';
            
    //         // Ajouter la classe 'other-month' si le jour n'est pas dans le mois courant
    //         if (currentMonth !== month) {
    //             dayElement.classList.add('other-month');
    //         }
            
    //         // Marquer le jour actuel
    //         if (DateUtils.isSameDay(currentDate, today)) {
    //             dayElement.classList.add('today');
    //         }
            
    //         // En-tête du jour
    //         const dayHeader = document.createElement('div');
    //         dayHeader.className = 'month-day-header';
            
    //         const dayNumber = document.createElement('div');
    //         dayNumber.className = 'month-day-number';
    //         dayNumber.textContent = currentDay;
            
    //         dayHeader.appendChild(dayNumber);
    //         dayElement.appendChild(dayHeader);
            
    //         // Conteneur pour les événements
    //         const eventsContainer = document.createElement('div');
    //         eventsContainer.className = 'month-day-events';
    //         dayElement.appendChild(eventsContainer);
            
    //         // Ajouter un attribut de données pour la date
    //         dayElement.dataset.date = DateUtils.formatDate(currentDate);
            
    //         // Ajouter l'événement de clic pour naviguer vers la vue quotidienne
    //         dayElement.addEventListener('click', () => {
    //             this.currentDate = new Date(currentDate);
    //             this.setView('daily');
    //         });
            
    //         monthGrid.appendChild(dayElement);
    //     }
        
    //     this.monthCalendarContainer.appendChild(monthGrid);
    // }
    
    /**
     * Rend la vue mensuelle
     */
    renderMonthlyView() {
        if (!this.monthCalendarContainer) {
            console.error("Conteneur de calendrier mensuel non trouvé");
            return;
        }
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        if (this.currentMonthLabel) {
            this.currentMonthLabel.textContent = this.months[month];
        }
        
        if (this.currentYearMonthlyLabel) {
            this.currentYearMonthlyLabel.textContent = year;
        }
        
        // Vider le conteneur
        this.monthCalendarContainer.innerHTML = '';
        
        // Créer l'en-tête des jours de la semaine
        const weekdaysRow = document.createElement('div');
        weekdaysRow.className = 'weekdays';
        
        // Ajouter les jours selon firstDayOfWeek
        for (let i = 0; i < 7; i++) {
            const dayIndex = (this.firstDayOfWeek + i) % 7;
            const dayElement = document.createElement('div');
            dayElement.textContent = this.daysLong[dayIndex];
            weekdaysRow.appendChild(dayElement);
        }
        
        this.monthCalendarContainer.appendChild(weekdaysRow);
        
        // Créer la grille du mois
        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';
        
        // Déterminer le premier jour du mois
        const firstDay = new Date(year, month, 1).getDay();
        // ⚠️ Problème identifié : Correction de l'ajustement du premier jour
        // Pour lundi comme premier jour (1), dimanche (0) doit être transformé en 6
        const firstDayAdjusted = (firstDay || 7) - this.firstDayOfWeek;
        
        // Nombre de jours dans le mois
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Date actuelle pour mettre en évidence le jour courant
        const today = new Date();
        
        // Générer 6 semaines (42 jours) pour couvrir le mois entier
        for (let i = 0; i < 42; i++) {
            // Calculer le jour à afficher
            const dayNumber = i - firstDayAdjusted + 1;
            const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
            
            // Créer la date correspondante
            const currentDate = new Date(year, month, dayNumber);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'month-day';
            
            // Ajouter la classe 'other-month' si le jour n'est pas dans le mois courant
            if (!isCurrentMonth) {
                dayElement.classList.add('other-month');
            }
            
            // Marquer le jour actuel
            if (isCurrentMonth && DateUtils.isSameDay(currentDate, today)) {
                dayElement.classList.add('today');
            }
            
            // En-tête du jour
            const dayHeader = document.createElement('div');
            dayHeader.className = 'month-day-header';
            
            const dayNumberEl = document.createElement('div');
            dayNumberEl.className = 'month-day-number';
            // Afficher le jour du mois courant ou le jour du mois adjacent
            dayNumberEl.textContent = isCurrentMonth ? dayNumber : 
                (dayNumber <= 0 ? new Date(year, month, 0).getDate() + dayNumber : 
                dayNumber - daysInMonth);
            
            dayHeader.appendChild(dayNumberEl);
            dayElement.appendChild(dayHeader);
            
            // Conteneur pour les événements UNIQUEMENT pour les jours du mois courant
            if (isCurrentMonth) {
                const eventsContainer = document.createElement('div');
                eventsContainer.className = 'month-day-events';
                // Définir une hauteur fixe pour les événements
                eventsContainer.style.maxHeight = "calc(100% - 30px)"; // Hauteur fixe moins la hauteur de l'en-tête
                eventsContainer.style.overflow = "hidden"; // Les événements débordants seront masqués
                dayElement.appendChild(eventsContainer);
                
                // Ajouter un attribut de données pour la date
                dayElement.dataset.date = DateUtils.formatDate(currentDate);
                
                // Ajouter l'événement de clic pour naviguer vers la vue quotidienne
                dayElement.addEventListener('click', () => {
                    this.currentDate = new Date(currentDate);
                    this.setView('daily');
                });
            }
            
            monthGrid.appendChild(dayElement);
        }
        
        this.monthCalendarContainer.appendChild(monthGrid);
        
        // Ajouter du CSS pour garantir des cellules de taille fixe
        const style = document.createElement('style');
        style.textContent = `
            .month-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                grid-template-rows: repeat(6, 1fr);
                height: calc(100% - 40px); /* Hauteur totale moins l'en-tête */
            }
            
            .month-day {
                min-height: 100px;
                height: 100%;
                border: 1px solid var(--border-color);
                overflow: hidden;
                position: relative;
            }
            
            .month-day.other-month {
                background-color: var(--background-secondary);
                opacity: 0.6;
            }
            
            .month-day-events {
                overflow-y: auto;
                max-height: calc(100% - 30px);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Rend la vue hebdomadaire
     */
    renderWeeklyView() {
        if (!this.weekCalendarContainer) {
            console.error("Conteneur de calendrier hebdomadaire non trouvé");
            return;
        }
        
        // Déterminer le début de la semaine
        const startOfWeek = DateUtils.getStartOfWeek(this.currentDate, this.firstDayOfWeek);
        const endOfWeek = DateUtils.getEndOfWeek(this.currentDate, this.firstDayOfWeek);
        
        // Mettre à jour le libellé de la semaine
        if (this.currentWeekLabel) {
            // Format: "Semaine du 1 janvier au 7 janvier 2025"
            const startMonth = this.months[startOfWeek.getMonth()];
            const endMonth = this.months[endOfWeek.getMonth()];
            const startDay = startOfWeek.getDate();
            const endDay = endOfWeek.getDate();
            const year = endOfWeek.getFullYear();
            
            // Si même mois
            if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
                this.currentWeekLabel.textContent = `Semaine du ${startDay} au ${endDay} ${startMonth} ${year}`;
            } else {
                this.currentWeekLabel.textContent = `Semaine du ${startDay} ${startMonth} au ${endDay} ${endMonth} ${year}`;
            }
        }
        
        // Vider le conteneur
        this.weekCalendarContainer.innerHTML = '';
        
        // Créer l'en-tête de la semaine
        const weekHeader = document.createElement('div');
        weekHeader.className = 'week-header';
        
        // Ajouter une cellule vide pour l'en-tête des heures
        const emptyCell = document.createElement('div');
        weekHeader.appendChild(emptyCell);
        
        // Ajouter les jours de la semaine
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            
            const dayCell = document.createElement('div');
            dayCell.className = 'week-header-day';
            
            // Marquer le jour actuel
            if (DateUtils.isSameDay(dayDate, new Date())) {
                dayCell.classList.add('today');
            }
            
            const dayName = document.createElement('div');
            dayName.className = 'week-day-name';
            dayName.textContent = this.days[i];
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'week-day-date';
            dayNumber.textContent = `${dayDate.getDate()} ${this.months[dayDate.getMonth()]}`;
            
            dayCell.appendChild(dayName);
            dayCell.appendChild(dayNumber);
            dayCell.dataset.date = DateUtils.formatDate(dayDate);
            
            // Ajouter un événement de clic pour naviguer vers la vue quotidienne
            dayCell.addEventListener('click', () => {
                this.currentDate = dayDate;
                this.setView('daily');
            });
            
            weekHeader.appendChild(dayCell);
        }
        
        this.weekCalendarContainer.appendChild(weekHeader);
        
        // Créer le conteneur pour les événements toute la journée
        const allDayContainer = document.createElement('div');
        allDayContainer.className = 'all-day-events-container';
        allDayContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: 60px repeat(7, 1fr);">
                <div>Toute la journée</div>
                ${Array(7).fill(0).map(() => '<div class="all-day-events-day"></div>').join('')}
            </div>
        `;
        this.weekCalendarContainer.appendChild(allDayContainer);
        
        // Créer la grille des heures
        const weekGrid = document.createElement('div');
        weekGrid.className = 'week-grid';
        
        // Plage d'heures à afficher (par défaut de 0h à 23h)
        const startHour = 0;
        const endHour = 24;
        
        // Ajouter les heures
        for (let hour = startHour; hour < endHour; hour++) {
            // Cellule de l'heure
            const hourCell = document.createElement('div');
            hourCell.className = 'week-time';
            hourCell.textContent = `${hour}:00`;
            weekGrid.appendChild(hourCell);
            
            // Colonnes pour les jours
            for (let day = 0; day < 7; day++) {
                const dayColumn = document.createElement('div');
                dayColumn.className = 'week-day-column';
                
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + day);
                
                // Marquer la colonne du jour actuel
                if (DateUtils.isSameDay(dayDate, new Date())) {
                    dayColumn.classList.add('today');
                }
                
                // Ajouter un attribut de données pour la date et l'heure
                dayColumn.dataset.date = DateUtils.formatDate(dayDate);
                dayColumn.dataset.hour = hour;
                
                // Ajouter l'événement de clic pour ajouter un événement
                dayColumn.addEventListener('click', () => {
                    // Mettre à jour la date courante
                    const clickedDate = new Date(dayDate);
                    clickedDate.setHours(hour);
                    this.currentDate = clickedDate;
                    
                    // Déclencher un événement personnalisé pour ouvrir le formulaire d'ajout d'événement
                    const event = new CustomEvent('calendar:requestAddEvent', {
                        detail: { date: clickedDate }
                    });
                    window.dispatchEvent(event);
                });
                
                weekGrid.appendChild(dayColumn);
            }
        }
        
        this.weekCalendarContainer.appendChild(weekGrid);
        
        // Recalculer les dimensions des cellules
        this._recalculateCellDimensions();
        
        // Ajouter une ligne pour indiquer l'heure actuelle si c'est dans la semaine affichée
        this._addCurrentTimeLineToWeeklyView();
    }
    
    /**
     * Ajoute une ligne indiquant l'heure actuelle dans la vue hebdomadaire
     * @private
     */
    _addCurrentTimeLineToWeeklyView() {
        if (!this.weekCalendarContainer) return;
        
        const now = new Date();
        
        // Déterminer le début de la semaine
        const startOfWeek = DateUtils.getStartOfWeek(this.currentDate, this.firstDayOfWeek);
        const endOfWeek = DateUtils.getEndOfWeek(this.currentDate, this.firstDayOfWeek);
        
        // Vérifier si la date actuelle est dans la semaine affichée
        if (now >= startOfWeek && now <= endOfWeek) {
            // Calculer le jour de la semaine (0-6)
            const dayOfWeek = now.getDay();
            const adjustedDayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Ajuster pour commencer par lundi
            
            // Calculer l'heure et les minutes pour positionner la ligne
            const hour = now.getHours();
            const minutes = now.getMinutes();
            
            // Récupérer les dimensions d'une cellule d'heure
            const hourCells = this.weekCalendarContainer.querySelectorAll('.week-time');
            if (hourCells.length > 0) {
                const hourHeight = this._cellDimensions.hourHeight;
                
                // Calculer la position verticale
                const top = hour * hourHeight + (minutes / 60) * hourHeight;
                
                // Créer la ligne du temps actuel
                const currentTimeLine = document.createElement('div');
                currentTimeLine.className = 'current-time-line';
                
                // Positionner la ligne
                currentTimeLine.style.top = `${top}px`;
                currentTimeLine.style.left = '60px'; // Tenir compte de la colonne des heures
                currentTimeLine.style.width = 'calc(100% - 60px)';
                
                // Ajouter un marqueur de l'heure actuelle
                const timeMarker = document.createElement('div');
                timeMarker.className = 'current-time-marker';
                timeMarker.textContent = DateUtils.formatTime24h(now);
                timeMarker.style.position = 'absolute';
                timeMarker.style.left = '5px';
                timeMarker.style.top = '-10px';
                timeMarker.style.fontSize = '10px';
                timeMarker.style.padding = '2px 5px';
                timeMarker.style.backgroundColor = 'var(--accent)';
                timeMarker.style.color = 'white';
                timeMarker.style.borderRadius = '10px';
                
                currentTimeLine.appendChild(timeMarker);
                
                // Ajouter la ligne au conteneur des événements
                const weekGrid = this.weekCalendarContainer.querySelector('.week-grid');
                if (weekGrid) {
                    weekGrid.appendChild(currentTimeLine);
                } else {
                    this.weekCalendarContainer.appendChild(currentTimeLine);
                }
            }
        }
    }
    
    /**
     * Rend la vue quotidienne
     */
    renderDailyView() {
        if (!this.dayScheduleContainer) {
            console.error("Conteneur d'agenda quotidien non trouvé");
            return;
        }
        
        const date = new Date(this.currentDate);
        
        // Mettre à jour le libellé du jour
        const dayOfWeekIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        if (this.currentDayLabel) {
            this.currentDayLabel.textContent = `${this.daysLong[dayOfWeekIndex]} ${date.getDate()} ${this.months[date.getMonth()]} ${date.getFullYear()}`;
        }
        
        // Vider le conteneur
        this.dayScheduleContainer.innerHTML = '';
        
        // Créer l'en-tête du jour
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = this.currentDayLabel ? this.currentDayLabel.textContent : `${date.getDate()} ${this.months[date.getMonth()]} ${date.getFullYear()}`;
        this.dayScheduleContainer.appendChild(dayHeader);
        
        // Créer le conteneur pour les événements toute la journée
        const allDayContainer = document.createElement('div');
        allDayContainer.className = 'all-day-events-container';
        allDayContainer.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">Toute la journée</div>
            <div class="all-day-events-list"></div>
        `;
        this.dayScheduleContainer.appendChild(allDayContainer);
        
        // Créer la timeline
        const dayTimeline = document.createElement('div');
        dayTimeline.className = 'day-timeline';
        
        // Créer les colonnes d'heures et d'événements
        const hoursColumn = document.createElement('div');
        hoursColumn.className = 'day-hours-column';
        
        const eventsColumn = document.createElement('div');
        eventsColumn.className = 'day-events-column';
        
        // Plage d'heures à afficher (par défaut de 0h à 23h)
        const startHour = 0;
        const endHour = 24;
        
        // Ajouter les 24 heures
        for (let hour = startHour; hour < endHour; hour++) {
            // Cellule de l'heure
            const hourCell = document.createElement('div');
            hourCell.className = 'day-hour';
            hourCell.textContent = `${hour}:00`;
            hoursColumn.appendChild(hourCell);
            
            // Ligne d'une heure pour les événements
            const hourLine = document.createElement('div');
            hourLine.className = 'day-hour-line';
            hourLine.dataset.hour = hour;
            
            // Ajouter l'événement de clic pour ajouter un événement
            hourLine.addEventListener('click', () => {
                // Mettre à jour la date courante
                const clickedDate = new Date(date);
                clickedDate.setHours(hour);
                this.currentDate = clickedDate;
                
                // Déclencher un événement personnalisé pour ouvrir le formulaire d'ajout d'événement
                const event = new CustomEvent('calendar:requestAddEvent', {
                    detail: { date: clickedDate }
                });
                window.dispatchEvent(event);
            });
            
            eventsColumn.appendChild(hourLine);
        }
        
        dayTimeline.appendChild(hoursColumn);
        dayTimeline.appendChild(eventsColumn);
        
        this.dayScheduleContainer.appendChild(dayTimeline);
        
        // Recalculer les dimensions des cellules
        this._recalculateCellDimensions();
        
        // Ajouter une ligne pour indiquer l'heure actuelle si c'est aujourd'hui
        this._addCurrentTimeLineToDailyView();
    }
    
    /**
     * Ajoute une ligne indiquant l'heure actuelle dans la vue quotidienne
     * @private
     */
    _addCurrentTimeLineToDailyView() {
        if (!this.dayScheduleContainer) return;
        
        const now = new Date();
        const date = this.currentDate;
        
        // Vérifier si la date affichée est aujourd'hui
        if (DateUtils.isSameDay(now, date)) {
            // Calculer l'heure et les minutes pour positionner la ligne
            const hour = now.getHours();
            const minutes = now.getMinutes();
            
            // Récupérer les dimensions d'une cellule d'heure
            const hourCells = this.dayScheduleContainer.querySelectorAll('.day-hour');
            if (hourCells.length > 0) {
                const hourHeight = this._cellDimensions.hourHeight;
                
                // Calculer la position verticale
                const top = hour * hourHeight + (minutes / 60) * hourHeight;
                
                // Créer la ligne du temps actuel
                const currentTimeLine = document.createElement('div');
                currentTimeLine.className = 'current-time-line';
                currentTimeLine.style.top = `${top}px`;
                
                // Ajouter un marqueur de l'heure actuelle
                const timeMarker = document.createElement('div');
                timeMarker.className = 'current-time-marker';
                timeMarker.textContent = DateUtils.formatTime24h(now);
                timeMarker.style.position = 'absolute';
                timeMarker.style.left = '5px';
                timeMarker.style.top = '-10px';
                timeMarker.style.fontSize = '10px';
                timeMarker.style.padding = '2px 5px';
                timeMarker.style.backgroundColor = 'var(--accent)';
                timeMarker.style.color = 'white';
                timeMarker.style.borderRadius = '10px';
                
                currentTimeLine.appendChild(timeMarker);
                
                // Ajouter la ligne à la colonne des événements
                const eventsColumn = this.dayScheduleContainer.querySelector('.day-events-column');
                if (eventsColumn) {
                    eventsColumn.appendChild(currentTimeLine);
                } else {
                    // Fallback au conteneur principal
                    const dayTimeline = this.dayScheduleContainer.querySelector('.day-timeline');
                    if (dayTimeline) {
                        dayTimeline.appendChild(currentTimeLine);
                    }
                }
            }
        }
    }
    
    /**
     * Nettoie les ressources utilisées par le gestionnaire
     * Méthode appelée lors de la fermeture de l'application
     */
    cleanup() {
        // Arrêter le minuteur de mise à jour de la ligne de temps actuelle
        this._stopCurrentTimeUpdater();
        
        // Supprimer les écouteurs d'événements (si nécessaire pour éviter les fuites de mémoire)
        window.removeEventListener('resize', this._handleWindowResize);
        window.removeEventListener('timeupdate', this._updateCurrentTimeLine);
    }
}