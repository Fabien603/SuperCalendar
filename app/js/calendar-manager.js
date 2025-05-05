// Gestionnaire de calendrier pour SuperCalendrier
import { DateUtils } from './utils/date-utils.js';

export class CalendarManager {
    constructor() {
        // Date courante
        this.currentDate = new Date();
        
        // Vue courante ('yearly', 'monthly', 'weekly', 'daily')
        this.currentView = 'yearly';
        
        // Référence aux éléments DOM
        this.yearlyView = document.getElementById('yearly-view');
        this.monthlyView = document.getElementById('monthly-view');
        this.weeklyView = document.getElementById('weekly-view');
        this.dailyView = document.getElementById('daily-view');
        
        // Navigation
        this.currentYearLabel = document.getElementById('current-year');
        this.currentMonthLabel = document.getElementById('current-month');
        this.currentYearMonthlyLabel = document.getElementById('current-year-monthly');
        this.currentWeekLabel = document.getElementById('current-week');
        this.currentDayLabel = document.getElementById('current-day');
        
        // Conteneurs pour les vues
        this.calendarContainer = document.getElementById('calendar');
        this.monthCalendarContainer = document.getElementById('month-calendar');
        this.weekCalendarContainer = document.getElementById('week-calendar');
        this.dayScheduleContainer = document.getElementById('day-schedule');
        
        // Boutons de navigation
        this.prevYearBtn = document.getElementById('prev-year');
        this.nextYearBtn = document.getElementById('next-year');
        this.prevMonthBtn = document.getElementById('prev-month');
        this.nextMonthBtn = document.getElementById('next-month');
        this.prevWeekBtn = document.getElementById('prev-week');
        this.nextWeekBtn = document.getElementById('next-week');
        this.prevDayBtn = document.getElementById('prev-day');
        this.nextDayBtn = document.getElementById('next-day');
        
        // Liste des mois et jours
        this.months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        this.days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        this.daysLong = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        // Premier jour de la semaine (0 = Dimanche, 1 = Lundi) - Par défaut Lundi
        this.firstDayOfWeek = 1;
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
    }
    
    initEventListeners() {
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
    }
    
    // Méthodes pour changer la date
    changeYear(increment) {
        this.currentDate.setFullYear(this.currentDate.getFullYear() + increment);
        this.renderCurrentView();
        
        // Déclencher l'événement pour mettre à jour les événements
        window.dispatchEvent(new CustomEvent('calendar:dateChanged', {
            detail: { date: new Date(this.currentDate) }
        }));
    }
    
    changeMonth(increment) {
        this.currentDate.setMonth(this.currentDate.getMonth() + increment);
        this.renderCurrentView();
        
        // Déclencher l'événement pour mettre à jour les événements
        window.dispatchEvent(new CustomEvent('calendar:dateChanged', {
            detail: { date: new Date(this.currentDate) }
        }));
    }
    
    changeWeek(increment) {
        this.currentDate.setDate(this.currentDate.getDate() + (increment * 7));
        this.renderCurrentView();
        
        // Déclencher l'événement pour mettre à jour les événements
        window.dispatchEvent(new CustomEvent('calendar:dateChanged', {
            detail: { date: new Date(this.currentDate) }
        }));
    }
    
    changeDay(increment) {
        this.currentDate.setDate(this.currentDate.getDate() + increment);
        this.renderCurrentView();
        
        // Déclencher l'événement pour mettre à jour les événements
        window.dispatchEvent(new CustomEvent('calendar:dateChanged', {
            detail: { date: new Date(this.currentDate) }
        }));
    }
    
    goToToday() {
        this.currentDate = new Date();
        this.renderCurrentView();
        
        // Déclencher l'événement pour mettre à jour les événements
        window.dispatchEvent(new CustomEvent('calendar:dateChanged', {
            detail: { date: new Date(this.currentDate) }
        }));
        
        // Notification de changement
        window.dispatchEvent(new CustomEvent('notification:show', {
            detail: { 
                message: "Calendrier positionné à aujourd'hui", 
                isError: false 
            }
        }));
    }
    
    // Méthode pour changer la vue actuelle
    setView(view) {
        if (!['yearly', 'monthly', 'weekly', 'daily'].includes(view)) {
            console.error(`Vue non reconnue: ${view}`);
            return;
        }
        
        this.currentView = view;
        
        // Cacher toutes les vues
        if (this.yearlyView) this.yearlyView.classList.remove('active');
        if (this.monthlyView) this.monthlyView.classList.remove('active');
        if (this.weeklyView) this.weeklyView.classList.remove('active');
        if (this.dailyView) this.dailyView.classList.remove('active');
        
        // Afficher la vue sélectionnée
        const viewTitle = document.getElementById('current-view-title');
        
        switch (view) {
            case 'yearly':
                if (this.yearlyView) this.yearlyView.classList.add('active');
                if (viewTitle) viewTitle.textContent = 'Vue annuelle';
                break;
            case 'monthly':
                if (this.monthlyView) this.monthlyView.classList.add('active');
                if (viewTitle) viewTitle.textContent = 'Vue mensuelle';
                break;
            case 'weekly':
                if (this.weeklyView) this.weeklyView.classList.add('active');
                if (viewTitle) viewTitle.textContent = 'Vue hebdomadaire';
                break;
            case 'daily':
                if (this.dailyView) this.dailyView.classList.add('active');
                if (viewTitle) viewTitle.textContent = 'Vue quotidienne';
                break;
        }
        
        // Rendre la vue actuelle
        this.renderCurrentView();
        
        // Mettre à jour les boutons de navigation
        document.querySelectorAll('.nav-item[data-view]').forEach(button => {
            button.classList.remove('active');
            if (button.dataset.view === view) {
                button.classList.add('active');
            }
        });
        
        // Déclencher un événement pour mettre à jour les événements après le rendu de la vue
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('calendar:viewChanged', {
                detail: { view: this.currentView }
            }));
        }, 100);
    }
    
    // Rendu de la vue actuelle
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
    }
    
    // Render de la vue annuelle
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
            const monthElement = this.createMonthCard(year, monthIndex);
            this.calendarContainer.appendChild(monthElement);
        }
    }
    
    // Créer un élément de carte de mois pour la vue annuelle
    createMonthCard(year, monthIndex) {
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
    
    // Render de la vue mensuelle
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
        
        // Créer la grille du mois
        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';
        
        // Ajouter les jours de la semaine
        for (let i = 0; i < 7; i++) {
            const dayIndex = (this.firstDayOfWeek + i) % 7;
            const dayName = this.days[dayIndex];
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'week-header-day';
            dayHeader.textContent = dayName;
            monthGrid.appendChild(dayHeader);
        }
        
        // Déterminer le premier jour du mois
        const firstDay = new Date(year, month, 1).getDay();
        // Ajuster pour commencer par firstDayOfWeek
        const firstDayAdjusted = (firstDay - this.firstDayOfWeek + 7) % 7;
        
        // Date du premier jour affiché (peut être du mois précédent)
        const startDate = new Date(year, month, 1 - firstDayAdjusted);
        
        // Date actuelle pour mettre en évidence le jour courant
        const today = new Date();
        
        // Générer 6 semaines (42 jours) pour couvrir le mois entier
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const currentDay = currentDate.getDate();
            
            const dayElement = document.createElement('div');
            dayElement.className = 'month-day';
            
            // Ajouter la classe 'other-month' si le jour n'est pas dans le mois courant
            if (currentMonth !== month) {
                dayElement.classList.add('other-month');
            }
            
            // Marquer le jour actuel
            if (DateUtils.isSameDay(currentDate, today)) {
                dayElement.classList.add('today');
            }
            
            // En-tête du jour
            const dayHeader = document.createElement('div');
            dayHeader.className = 'month-day-header';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'month-day-number';
            dayNumber.textContent = currentDay;
            
            dayHeader.appendChild(dayNumber);
            dayElement.appendChild(dayHeader);
            
            // Conteneur pour les événements
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'month-day-events';
            dayElement.appendChild(eventsContainer);
            
            // Ajouter un attribut de données pour la date
            dayElement.dataset.date = DateUtils.formatDate(currentDate);
            
            // Ajouter l'événement de clic pour naviguer vers la vue quotidienne
            dayElement.addEventListener('click', () => {
                this.currentDate = new Date(currentDate);
                this.setView('daily');
            });
            
            monthGrid.appendChild(dayElement);
        }
        
        this.monthCalendarContainer.appendChild(monthGrid);
    }
    
    // Render de la vue hebdomadaire
    renderWeeklyView() {
        if (!this.weekCalendarContainer) {
            console.error("Conteneur de calendrier hebdomadaire non trouvé");
            return;
        }
        
        // Déterminer le début de la semaine
        const currentDate = new Date(this.currentDate);
        const currentDay = currentDate.getDay();
        const diff = currentDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Ajuster pour que la semaine commence le lundi
        
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(diff);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        // Mettre à jour le libellé de la semaine
        if (this.currentWeekLabel) {
            this.currentWeekLabel.textContent = `Semaine du ${startOfWeek.getDate()} ${this.months[startOfWeek.getMonth()]} au ${endOfWeek.getDate()} ${this.months[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`;
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
            weekHeader.appendChild(dayCell);
        }
        
        this.weekCalendarContainer.appendChild(weekHeader);
        
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
        
        // Ajouter une ligne pour indiquer l'heure actuelle si c'est dans la semaine affichée
        this.addCurrentTimeLine(weekGrid, startOfWeek, endOfWeek);
    }
    
    // Render de la vue quotidienne
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
        
        // Créer la timeline
        const dayTimeline = document.createElement('div');
        dayTimeline.className = 'day-timeline';
        
        // Créer la colonne des heures et la colonne des événements
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
        
        // Ajouter une ligne pour indiquer l'heure actuelle si c'est aujourd'hui
        this.addCurrentTimeLineDaily(dayTimeline, date);
    }
    
    // Ajouter une ligne indiquant l'heure actuelle dans la vue hebdomadaire
    addCurrentTimeLine(container, startOfWeek, endOfWeek) {
        const now = new Date();
        
        // Vérifier si la date actuelle est dans la semaine affichée
        if (now >= startOfWeek && now <= endOfWeek) {
            // Calculer le jour de la semaine (0-6)
            const dayOfWeek = now.getDay();
            const adjustedDayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Ajuster pour commencer par lundi
            
            // Calculer l'heure et les minutes pour positionner la ligne
            const hour = now.getHours();
            const minutes = now.getMinutes();
            
            // Créer la ligne du temps actuel
            const currentTimeLine = document.createElement('div');
            currentTimeLine.className = 'current-time-line';
            
            // Récupérer les dimensions d'une cellule d'heure
            const hourCells = container.querySelectorAll('.week-time');
            if (hourCells.length > 0) {
                const hourHeight = hourCells[0].offsetHeight;
                
                // Calculer la position verticale
                const top = hour * hourHeight + (minutes / 60) * hourHeight;
                
                // Positionner la ligne
                currentTimeLine.style.top = `${top}px`;
                currentTimeLine.style.left = '60px'; // Tenir compte de la colonne des heures
                currentTimeLine.style.width = 'calc(100% - 60px)';
                
                // Ajouter la ligne au conteneur
                container.appendChild(currentTimeLine);
            }
        }
    }
    
    // Ajouter une ligne indiquant l'heure actuelle dans la vue quotidienne
    addCurrentTimeLineDaily(container, date) {
        const now = new Date();
        
        // Vérifier si la date affichée est aujourd'hui
        if (DateUtils.isSameDay(now, date)) {
            // Calculer l'heure et les minutes pour positionner la ligne
            const hour = now.getHours();
            const minutes = now.getMinutes();
            
            // Récupérer les dimensions d'une cellule d'heure
            const hourCells = container.querySelectorAll('.day-hour');
            if (hourCells.length > 0) {
                const hourHeight = hourCells[0].offsetHeight;
                
                // Calculer la position verticale
                const top = hour * hourHeight + (minutes / 60) * hourHeight;
                
                // Créer la ligne du temps actuel
                const currentTimeLine = document.createElement('div');
                currentTimeLine.className = 'current-time-line';
                currentTimeLine.style.top = `${top}px`;
                
                // Ajouter la ligne à la colonne des événements
                const eventsColumn = container.querySelector('.day-events-column');
                if (eventsColumn) {
                    eventsColumn.appendChild(currentTimeLine);
                }
            }
        }
    }
}