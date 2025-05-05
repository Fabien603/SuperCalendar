// Gestionnaire d'impression et d'exportation PDF
import { DateUtils } from './utils/date-utils.js';

export class PrintManager {
    constructor() {
        // Options d'impression
        this.printOptions = {
            view: 'yearly', // 'yearly', 'monthly', 'weekly', 'daily'
            format: 'A4', // 'A2', 'A3', 'A4', 'A5', 'A6'
            orientation: 'portrait', // 'portrait', 'landscape'
            showCategories: true,
            showDescriptions: true,
            showLocations: true,
            useColors: true
        };
        
        // Éléments DOM
        this.printModal = document.getElementById('print-modal');
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Écouteurs pour les options d'impression
        const printView = document.getElementById('print-view');
        const printFormat = document.getElementById('print-format');
        const printOrientation = document.getElementById('print-orientation');
        const printShowCategories = document.getElementById('print-show-categories');
        const printShowDescriptions = document.getElementById('print-show-descriptions');
        const printShowLocations = document.getElementById('print-show-locations');
        const printUseColors = document.getElementById('print-use-colors');
        
        if (printView) {
            printView.addEventListener('change', () => {
                this.printOptions.view = printView.value;
            });
        }
        
        if (printFormat) {
            printFormat.addEventListener('change', () => {
                this.printOptions.format = printFormat.value;
            });
        }
        
        if (printOrientation) {
            printOrientation.addEventListener('change', () => {
                this.printOptions.orientation = printOrientation.value;
            });
        }
        
        if (printShowCategories) {
            printShowCategories.addEventListener('change', () => {
                this.printOptions.showCategories = printShowCategories.checked;
            });
        }
        
        if (printShowDescriptions) {
            printShowDescriptions.addEventListener('change', () => {
                this.printOptions.showDescriptions = printShowDescriptions.checked;
            });
        }
        
        if (printShowLocations) {
            printShowLocations.addEventListener('change', () => {
                this.printOptions.showLocations = printShowLocations.checked;
            });
        }
        
        if (printUseColors) {
            printUseColors.addEventListener('change', () => {
                this.printOptions.useColors = printUseColors.checked;
            });
        }
    }
    
    // Imprimer le calendrier avec les options actuelles
    print() {
        // Créer un conteneur temporaire pour l'impression
        const printContainer = this.createPrintContainer();
        
        // Ajouter le contenu à imprimer
        this.generatePrintContent(printContainer);
        
        // Fermer la modal d'impression
        if (this.printModal) {
            this.printModal.classList.remove('active');
        }
        
        // Imprimer
        window.print();
        
        // Nettoyer après l'impression
        setTimeout(() => {
            document.body.removeChild(printContainer);
        }, 1000);
    }
    
    // Aperçu avant impression
    preview() {
        // Créer un conteneur pour l'aperçu
        const previewContainer = this.createPrintContainer(true);
        
        // Ajouter le contenu à prévisualiser
        this.generatePrintContent(previewContainer);
        
        // Créer une modal pour l'aperçu
        const previewModal = document.createElement('div');
        previewModal.className = 'modal-overlay active';
        previewModal.innerHTML = `
            <div class="modal" style="max-width: 90%; width: auto; height: 90vh; max-height: 90vh;">
                <div class="modal-header">
                    <div class="modal-title">Aperçu avant impression</div>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="overflow: auto; max-height: calc(90vh - 140px);">
                    <div id="preview-content"></div>
                </div>
                <div class="modal-footer">
                    <button id="print-from-preview" class="btn btn-primary">
                        <i class="fas fa-print"></i>
                        Imprimer
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter l'aperçu au corps du document
        document.body.appendChild(previewModal);
        
        // Ajouter le contenu à l'aperçu
        const previewContent = previewModal.querySelector('#preview-content');
        previewContent.appendChild(previewContainer);
        
        // Gérer les événements
        const closeBtn = previewModal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(previewModal);
        });
        
        const printBtn = previewModal.querySelector('#print-from-preview');
        printBtn.addEventListener('click', () => {
            document.body.removeChild(previewModal);
            this.print();
        });
        
        // Fermer en cliquant en dehors de la modal
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                document.body.removeChild(previewModal);
            }
        });
    }
    
    // Exporter en PDF via Electron
    exportToPdf() {
        // Vérifier si l'API Electron est disponible
        if (!window.electronAPI) {
            alert('L\'exportation PDF n\'est disponible que dans la version desktop de l\'application.');
            return;
        }
        
        // Créer un conteneur temporaire pour l'impression
        const printContainer = this.createPrintContainer();
        
        // Ajouter le contenu à exporter
        this.generatePrintContent(printContainer);
        
        // Fermer la modal d'impression
        if (this.printModal) {
            this.printModal.classList.remove('active');
        }
        
        // Déclencher l'événement d'exportation PDF
        window.dispatchEvent(new CustomEvent('print:exportPdf', {
            detail: { options: this.printOptions }
        }));
        
        // Nettoyer après l'exportation
        setTimeout(() => {
            document.body.removeChild(printContainer);
        }, 1000);
    }
    
    // Créer un conteneur pour l'impression
    createPrintContainer(isPreview = false) {
        // Créer le conteneur
        const printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        printContainer.className = isPreview ? 'print-preview' : 'print-container';
        
        // Styles du conteneur
        printContainer.style.position = isPreview ? 'relative' : 'fixed';
        printContainer.style.top = '0';
        printContainer.style.left = '0';
        printContainer.style.width = '100%';
        printContainer.style.backgroundColor = 'white';
        printContainer.style.color = 'black';
        printContainer.style.zIndex = isPreview ? '1' : '-1000';
        printContainer.style.opacity = isPreview ? '1' : '0';
        printContainer.style.padding = '20px';
        
        // Appliquer les styles en fonction du format et de l'orientation
        switch (this.printOptions.format) {
            case 'A2':
                printContainer.style.width = this.printOptions.orientation === 'landscape' ? '594mm' : '420mm';
                printContainer.style.height = this.printOptions.orientation === 'landscape' ? '420mm' : '594mm';
                break;
            case 'A3':
                printContainer.style.width = this.printOptions.orientation === 'landscape' ? '420mm' : '297mm';
                printContainer.style.height = this.printOptions.orientation === 'landscape' ? '297mm' : '420mm';
                break;
            case 'A4':
                printContainer.style.width = this.printOptions.orientation === 'landscape' ? '297mm' : '210mm';
                printContainer.style.height = this.printOptions.orientation === 'landscape' ? '210mm' : '297mm';
                break;
            case 'A5':
                printContainer.style.width = this.printOptions.orientation === 'landscape' ? '210mm' : '148mm';
                printContainer.style.height = this.printOptions.orientation === 'landscape' ? '148mm' : '210mm';
                break;
            case 'A6':
                printContainer.style.width = this.printOptions.orientation === 'landscape' ? '148mm' : '105mm';
                printContainer.style.height = this.printOptions.orientation === 'landscape' ? '105mm' : '148mm';
                break;
        }
        
        // Ajouter des styles spécifiques à l'impression
        if (!isPreview) {
            const printStyles = document.createElement('style');
            printStyles.innerHTML = `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-container, #print-container * {
                        visibility: visible;
                    }
                    #print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto;
                    }
                    @page {
                        size: ${this.printOptions.format} ${this.printOptions.orientation};
                        margin: 10mm;
                    }
                }
            `;
            printContainer.appendChild(printStyles);
        }
        
        // Ajouter au corps du document
        document.body.appendChild(printContainer);
        
        return printContainer;
    }
    
    // Générer le contenu à imprimer
    generatePrintContent(container) {
        // En-tête de la page
        const header = document.createElement('div');
        header.className = 'print-header';
        header.style.textAlign = 'center';
        header.style.marginBottom = '20px';
        header.innerHTML = `
            <h1 style="color: #4361ee; margin-bottom: 5px;">SuperCalendrier</h1>
            <p style="color: #666;">Imprimé le ${new Date().toLocaleDateString('fr-FR')}</p>
        `;
        container.appendChild(header);
        
        // Contenu spécifique à la vue
        switch (this.printOptions.view) {
            case 'yearly':
                this.generateYearlyPrintContent(container);
                break;
            case 'monthly':
                this.generateMonthlyPrintContent(container);
                break;
            case 'weekly':
                this.generateWeeklyPrintContent(container);
                break;
            case 'daily':
                this.generateDailyPrintContent(container);
                break;
        }
    }
    
    // Générer le contenu pour la vue annuelle
    generateYearlyPrintContent(container) {
        // Récupérer les événements et les catégories depuis l'application
        const events = window.app?.eventManager?.dataManager?.getAllEvents() || [];
        const categories = window.app?.categoryManager?.dataManager?.getAllCategories() || [];
        
        // Année actuelle
        const currentDate = window.app?.calendarManager?.currentDate || new Date();
        const year = currentDate.getFullYear();
        
        // Titre
        const title = document.createElement('h2');
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        title.textContent = `Calendrier ${year}`;
        container.appendChild(title);
        
        // Grille des mois
        const monthsGrid = document.createElement('div');
        monthsGrid.style.display = 'grid';
        monthsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        monthsGrid.style.gap = '20px';
        
        // Créer chaque mois
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        months.forEach((monthName, monthIndex) => {
            const monthCard = document.createElement('div');
            monthCard.style.border = '1px solid #e0e0e0';
            monthCard.style.borderRadius = '12px';
            monthCard.style.overflow = 'hidden';
            
            // En-tête du mois
            const monthHeader = document.createElement('div');
            monthHeader.style.backgroundColor = '#4361ee';
            monthHeader.style.color = 'white';
            monthHeader.style.padding = '10px';
            monthHeader.style.textAlign = 'center';
            monthHeader.style.fontWeight = 'bold';
            monthHeader.textContent = monthName;
            monthCard.appendChild(monthHeader);
            
            // Jours de la semaine
            const weekdays = document.createElement('div');
            weekdays.style.display = 'grid';
            weekdays.style.gridTemplateColumns = 'repeat(7, 1fr)';
            weekdays.style.textAlign = 'center';
            weekdays.style.padding = '5px 0';
            weekdays.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
            weekdays.style.fontWeight = 'bold';
            weekdays.style.color = '#666';
            
            const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            days.forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.textContent = day;
                weekdays.appendChild(dayElement);
            });
            
            monthCard.appendChild(weekdays);
            
            // Jours du mois
            const daysGrid = document.createElement('div');
            daysGrid.style.display = 'grid';
            daysGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
            daysGrid.style.padding = '10px';
            daysGrid.style.gap = '5px';
            
            // Premier jour du mois
            const firstDay = new Date(year, monthIndex, 1).getDay();
            const firstDayAdjusted = (firstDay === 0) ? 6 : firstDay - 1;
            
            // Ajouter des cellules vides pour les jours précédant le premier du mois
            for (let i = 0; i < firstDayAdjusted; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.style.aspectRatio = '1';
                daysGrid.appendChild(emptyDay);
            }
            
            // Nombre de jours dans le mois
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            
            // Ajouter les jours du mois
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement('div');
                dayElement.style.aspectRatio = '1';
                dayElement.style.display = 'flex';
                dayElement.style.alignItems = 'center';
                dayElement.style.justifyContent = 'center';
                dayElement.style.position = 'relative';
                dayElement.textContent = day;
                
                // Vérifier si le jour a des événements
                const date = new Date(year, monthIndex, day);
                const hasEvents = events.some(event => {
                    const startDate = new Date(event.startDate);
                    const endDate = new Date(event.endDate);
                    return date >= startDate && date <= endDate;
                });
                
                if (hasEvents) {
                    dayElement.style.fontWeight = 'bold';
                    
                    if (this.printOptions.useColors) {
                        // Ajouter un indicateur pour les événements
                        const indicator = document.createElement('div');
                        indicator.style.position = 'absolute';
                        indicator.style.bottom = '2px';
                        indicator.style.width = '6px';
                        indicator.style.height = '6px';
                        indicator.style.backgroundColor = '#f72585';
                        indicator.style.borderRadius = '50%';
                        dayElement.appendChild(indicator);
                    }
                }
                
                daysGrid.appendChild(dayElement);
            }
            
            monthCard.appendChild(daysGrid);
            monthsGrid.appendChild(monthCard);
        });
        
        container.appendChild(monthsGrid);
        
        // Légende des catégories
        if (this.printOptions.showCategories && categories.length > 0) {
            const legendSection = document.createElement('div');
            legendSection.style.marginTop = '30px';
            legendSection.style.padding = '10px';
            legendSection.style.border = '1px solid #e0e0e0';
            legendSection.style.borderRadius = '12px';
            
            const legendTitle = document.createElement('h3');
            legendTitle.textContent = 'Légende des catégories';
            legendTitle.style.marginBottom = '10px';
            legendSection.appendChild(legendTitle);
            
            const categoriesGrid = document.createElement('div');
            categoriesGrid.style.display = 'grid';
            categoriesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
            categoriesGrid.style.gap = '10px';
            
            categories.forEach(category => {
                const categoryItem = document.createElement('div');
                categoryItem.style.display = 'flex';
                categoryItem.style.alignItems = 'center';
                categoryItem.style.padding = '5px';
                
                if (this.printOptions.useColors) {
                    const categoryColor = document.createElement('div');
                    categoryColor.style.width = '15px';
                    categoryColor.style.height = '15px';
                    categoryColor.style.backgroundColor = category.color;
                    categoryColor.style.borderRadius = '50%';
                    categoryColor.style.marginRight = '5px';
                    categoryItem.appendChild(categoryColor);
                }
                
                const categoryText = document.createElement('span');
                categoryText.textContent = `${category.emoji} ${category.name}`;
                categoryItem.appendChild(categoryText);
                
                categoriesGrid.appendChild(categoryItem);
            });
            
            legendSection.appendChild(categoriesGrid);
            container.appendChild(legendSection);
        }
    }
    
    // Générer le contenu pour la vue mensuelle
    generateMonthlyPrintContent(container) {
        // Récupérer les événements et les catégories depuis l'application
        const events = window.app?.eventManager?.dataManager?.getAllEvents() || [];
        const categories = window.app?.categoryManager?.dataManager?.getAllCategories() || [];
        
        // Date actuelle
        const currentDate = window.app?.calendarManager?.currentDate || new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Titre
        const title = document.createElement('h2');
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        title.textContent = `${this.getMonthName(month)} ${year}`;
        container.appendChild(title);
        
        // Créer le calendrier mensuel
        const monthCalendar = document.createElement('div');
        monthCalendar.style.border = '1px solid #e0e0e0';
        monthCalendar.style.borderRadius = '12px';
        monthCalendar.style.overflow = 'hidden';
        
        // Jours de la semaine
        const weekdays = document.createElement('div');
        weekdays.style.display = 'grid';
        weekdays.style.gridTemplateColumns = 'repeat(7, 1fr)';
        weekdays.style.textAlign = 'center';
        weekdays.style.padding = '10px 0';
        weekdays.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
        weekdays.style.fontWeight = 'bold';
        weekdays.style.color = '#666';
        
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.textContent = day;
            weekdays.appendChild(dayElement);
        });
        
        monthCalendar.appendChild(weekdays);
        
        // Grille des jours
        const daysGrid = document.createElement('div');
        daysGrid.style.display = 'grid';
        daysGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        
        // Premier jour du mois
        const firstDay = new Date(year, month, 1).getDay();
        const firstDayAdjusted = (firstDay === 0) ? 6 : firstDay - 1;
        
        // Date du premier jour affiché (peut être du mois précédent)
        const startDate = new Date(year, month, 1 - firstDayAdjusted);
        
        // Générer 6 semaines (42 jours) pour couvrir le mois entier
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const currentDay = currentDate.getDate();
            
            const dayElement = document.createElement('div');
            dayElement.style.border = '1px solid #e0e0e0';
            dayElement.style.padding = '5px';
            dayElement.style.minHeight = '80px';
            
            // Ajouter une classe pour les jours hors du mois courant
            if (currentMonth !== month) {
                dayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
                dayElement.style.color = '#aaa';
            }
            
            // En-tête du jour
            const dayHeader = document.createElement('div');
            dayHeader.style.fontWeight = 'bold';
            dayHeader.style.marginBottom = '5px';
            dayHeader.textContent = currentDay;
            dayElement.appendChild(dayHeader);
            
            // Événements du jour
            const dayEvents = events.filter(event => {
                const eventStartDate = new Date(event.startDate);
                const eventEndDate = new Date(event.endDate);
                
                // Ajuster les heures pour une comparaison correcte
                eventStartDate.setHours(0, 0, 0, 0);
                eventEndDate.setHours(23, 59, 59, 999);
                
                return currentDate >= eventStartDate && currentDate <= eventEndDate;
            });
            
            if (dayEvents.length > 0) {
                const eventsContainer = document.createElement('div');
                eventsContainer.style.fontSize = '10px';
                
                dayEvents.forEach(event => {
                    const category = categories.find(c => c.id === event.categoryId);
                    const eventElement = document.createElement('div');
                    eventElement.style.marginBottom = '3px';
                    eventElement.style.padding = '2px';
                    eventElement.style.borderRadius = '3px';
                    
                    if (this.printOptions.useColors && category) {
                        eventElement.style.borderLeft = `2px solid ${category.color}`;
                        eventElement.style.backgroundColor = `${category.color}20`;
                    } else {
                        eventElement.style.borderLeft = '2px solid #ccc';
                        eventElement.style.backgroundColor = '#f5f5f5';
                    }
                    
                    // Titre de l'événement
                    const eventTitle = document.createElement('div');
                    eventTitle.style.fontWeight = 'bold';
                    eventTitle.style.whiteSpace = 'nowrap';
                    eventTitle.style.overflow = 'hidden';
                    eventTitle.style.textOverflow = 'ellipsis';
                    
                    if (this.printOptions.showCategories && category) {
                        eventTitle.textContent = `${category.emoji} ${event.title}`;
                    } else {
                        eventTitle.textContent = event.title;
                    }
                    
                    eventElement.appendChild(eventTitle);
                    
                    // Heure de l'événement
                    if (event.startTime) {
                        const eventTime = document.createElement('div');
                        eventTime.style.fontSize = '8px';
                        eventTime.textContent = event.startTime;
                        eventElement.appendChild(eventTime);
                    }
                    
                    // Lieu de l'événement
                    if (this.printOptions.showLocations && event.location) {
                        const eventLocation = document.createElement('div');
                        eventLocation.style.fontSize = '8px';
                        eventLocation.style.whiteSpace = 'nowrap';
                        eventLocation.style.overflow = 'hidden';
                        eventLocation.style.textOverflow = 'ellipsis';
                        eventLocation.textContent = event.location;
                        eventElement.appendChild(eventLocation);
                    }
                    
                    eventsContainer.appendChild(eventElement);
                });
                
                dayElement.appendChild(eventsContainer);
            }
            
            daysGrid.appendChild(dayElement);
        }
        
        monthCalendar.appendChild(daysGrid);
        container.appendChild(monthCalendar);
        
        // Liste des événements du mois
        if (this.printOptions.showDescriptions) {
            const eventsSection = document.createElement('div');
            eventsSection.style.marginTop = '30px';
            
            const eventsTitle = document.createElement('h3');
            eventsTitle.textContent = 'Événements du mois';
            eventsTitle.style.marginBottom = '10px';
            eventsSection.appendChild(eventsTitle);
            
            // Filtrer les événements du mois
            const monthStartDate = new Date(year, month, 1);
            const monthEndDate = new Date(year, month + 1, 0);
            const monthEvents = events.filter(event => {
                const eventStartDate = new Date(event.startDate);
                const eventEndDate = new Date(event.endDate);
                return !(eventEndDate < monthStartDate || eventStartDate > monthEndDate);
            });
            
            if (monthEvents.length > 0) {
                // Trier par date
                monthEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                
                const eventsList = document.createElement('div');
                
                monthEvents.forEach(event => {
                    const category = categories.find(c => c.id === event.categoryId);
                    
                    const eventItem = document.createElement('div');
                    eventItem.style.padding = '10px';
                    eventItem.style.marginBottom = '10px';
                    eventItem.style.border = '1px solid #e0e0e0';
                    eventItem.style.borderRadius = '5px';
                    
                    if (this.printOptions.useColors && category) {
                        eventItem.style.borderLeft = `4px solid ${category.color}`;
                    }
                    
                    // En-tête de l'événement
                    const eventHeader = document.createElement('div');
                    eventHeader.style.marginBottom = '5px';
                    
                    const eventTitle = document.createElement('div');
                    eventTitle.style.fontWeight = 'bold';
                    
                    if (this.printOptions.showCategories && category) {
                        eventTitle.textContent = `${category.emoji} ${event.title}`;
                    } else {
                        eventTitle.textContent = event.title;
                    }
                    
                    eventHeader.appendChild(eventTitle);
                    
                    // Date de l'événement
                    const eventDate = document.createElement('div');
                    eventDate.style.fontSize = '12px';
                    eventDate.style.color = '#666';
                    
                    const startDate = new Date(event.startDate);
                    const endDate = new Date(event.endDate);
                    const formattedStartDate = startDate.toLocaleDateString('fr-FR');
                    const formattedEndDate = endDate.toLocaleDateString('fr-FR');
                    
                    if (formattedStartDate === formattedEndDate) {
                        eventDate.textContent = `${formattedStartDate}${event.startTime ? ' à ' + event.startTime : ''}`;
                    } else {
                        eventDate.textContent = `Du ${formattedStartDate} au ${formattedEndDate}`;
                    }
                    
                    eventHeader.appendChild(eventDate);
                    
                    // Lieu de l'événement
                    if (this.printOptions.showLocations && event.location) {
                        const eventLocation = document.createElement('div');
                        eventLocation.style.fontSize = '12px';
                        eventLocation.style.color = '#666';
                        eventLocation.textContent = `Lieu: ${event.location}`;
                        eventHeader.appendChild(eventLocation);
                    }
                    
                    eventItem.appendChild(eventHeader);
                    
                    // Description de l'événement
                    if (this.printOptions.showDescriptions && event.description) {
                        const eventDescription = document.createElement('div');
                        eventDescription.style.fontSize = '12px';
                        eventDescription.style.marginTop = '5px';
                        eventDescription.textContent = event.description;
                        eventItem.appendChild(eventDescription);
                    }
                    
                    eventsList.appendChild(eventItem);
                });
                
                eventsSection.appendChild(eventsList);
            } else {
                const noEvents = document.createElement('p');
                noEvents.textContent = 'Aucun événement ce mois-ci.';
                eventsSection.appendChild(noEvents);
            }
            
            container.appendChild(eventsSection);
        }
    }
    
    // Générer le contenu pour la vue hebdomadaire
    generateWeeklyPrintContent(container) {
        // Récupérer les événements et les catégories depuis l'application
        const events = window.app?.eventManager?.dataManager?.getAllEvents() || [];
        const categories = window.app?.categoryManager?.dataManager?.getAllCategories() || [];
        
        // Date actuelle
        const currentDate = window.app?.calendarManager?.currentDate || new Date();
        
        // Déterminer le début de la semaine
        const firstDayOfWeek = 1; // Lundi
        const currentDay = currentDate.getDay();
        const diff = currentDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Ajuster pour que la semaine commence le lundi
        
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        // Titre
        const title = document.createElement('h2');
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        title.textContent = `Semaine du ${startOfWeek.getDate()} ${this.getMonthName(startOfWeek.getMonth())} au ${endOfWeek.getDate()} ${this.getMonthName(endOfWeek.getMonth())} ${endOfWeek.getFullYear()}`;
        container.appendChild(title);
        
        // Créer le planning hebdomadaire
        const weekCalendar = document.createElement('div');
        weekCalendar.style.border = '1px solid #e0e0e0';
        weekCalendar.style.borderRadius = '12px';
        weekCalendar.style.overflow = 'hidden';
        
        // En-tête des jours
        const weekHeader = document.createElement('div');
        weekHeader.style.display = 'grid';
        weekHeader.style.gridTemplateColumns = '60px repeat(7, 1fr)';
        weekHeader.style.borderBottom = '1px solid #e0e0e0';
        
        // Cellule vide pour l'en-tête des heures
        const emptyCell = document.createElement('div');
        weekHeader.appendChild(emptyCell);
        
        // Jours de la semaine
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            
            const dayCell = document.createElement('div');
            dayCell.style.padding = '10px';
            dayCell.style.textAlign = 'center';
            dayCell.style.borderRight = '1px solid #e0e0e0';
            
            const dayName = document.createElement('div');
            dayName.style.fontWeight = 'bold';
            dayName.textContent = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i];
            
            const dayNumber = document.createElement('div');
            dayNumber.style.fontSize = '12px';
            dayNumber.style.color = '#666';
            dayNumber.textContent = `${dayDate.getDate()} ${this.getMonthName(dayDate.getMonth(), 'short')}`;
            
            dayCell.appendChild(dayName);
            dayCell.appendChild(dayNumber);
            weekHeader.appendChild(dayCell);
        }
        
        weekCalendar.appendChild(weekHeader);
        
        // Grille des heures
        const weekGrid = document.createElement('div');
        weekGrid.style.display = 'grid';
        weekGrid.style.gridTemplateColumns = '60px repeat(7, 1fr)';
        
        // Heures (de 8h à 20h pour simplifier l'impression)
        for (let hour = 8; hour < 21; hour++) {
            // Cellule de l'heure
            const hourCell = document.createElement('div');
            hourCell.style.padding = '10px 5px';
            hourCell.style.textAlign = 'right';
            hourCell.style.borderRight = '1px solid #e0e0e0';
            hourCell.style.borderBottom = '1px solid #e0e0e0';
            hourCell.textContent = `${hour}:00`;
            weekGrid.appendChild(hourCell);
            
            // Colonnes pour les jours
            for (let day = 0; day < 7; day++) {
                const dayCell = document.createElement('div');
                dayCell.style.borderRight = '1px solid #e0e0e0';
                dayCell.style.borderBottom = '1px solid #e0e0e0';
                dayCell.style.position = 'relative';
                dayCell.style.height = '40px';
                
                weekGrid.appendChild(dayCell);
            }
        }
        
        weekCalendar.appendChild(weekGrid);
        container.appendChild(weekCalendar);
        
        // Ajouter les événements à la grille
        this.addEventsToWeeklyGrid(weekGrid, events, categories, startOfWeek);
        
        // Liste des événements de la semaine
        if (this.printOptions.showDescriptions) {
            const eventsSection = document.createElement('div');
            eventsSection.style.marginTop = '30px';
            
            const eventsTitle = document.createElement('h3');
            eventsTitle.textContent = 'Événements de la semaine';
            eventsTitle.style.marginBottom = '10px';
            eventsSection.appendChild(eventsTitle);
            
            // Filtrer les événements de la semaine
            const weekEvents = events.filter(event => {
                const eventStartDate = new Date(event.startDate);
                const eventEndDate = new Date(event.endDate);
                return !(eventEndDate < startOfWeek || eventStartDate > endOfWeek);
            });
            
            if (weekEvents.length > 0) {
                // Trier par date
                weekEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                
                const eventsList = document.createElement('div');
                
                weekEvents.forEach(event => {
                    const category = categories.find(c => c.id === event.categoryId);
                    
                    const eventItem = document.createElement('div');
                    eventItem.style.padding = '10px';
                    eventItem.style.marginBottom = '10px';
                    eventItem.style.border = '1px solid #e0e0e0';
                    eventItem.style.borderRadius = '5px';
                    
                    if (this.printOptions.useColors && category) {
                        eventItem.style.borderLeft = `4px solid ${category.color}`;
                    }
                    
                    // En-tête de l'événement
                    const eventHeader = document.createElement('div');
                    eventHeader.style.marginBottom = '5px';
                    
                    const eventTitle = document.createElement('div');
                    eventTitle.style.fontWeight = 'bold';
                    
                    if (this.printOptions.showCategories && category) {
                        eventTitle.textContent = `${category.emoji} ${event.title}`;
                    } else {
                        eventTitle.textContent = event.title;
                    }
                    
                    eventHeader.appendChild(eventTitle);
                    
                    // Date de l'événement
                    const eventDate = document.createElement('div');
                    eventDate.style.fontSize = '12px';
                    eventDate.style.color = '#666';
                    
                    const startDate = new Date(event.startDate);
                    const endDate = new Date(event.endDate);
                    const formattedStartDate = startDate.toLocaleDateString('fr-FR');
                    const formattedEndDate = endDate.toLocaleDateString('fr-FR');
                    
                    if (formattedStartDate === formattedEndDate) {
                        eventDate.textContent = `${formattedStartDate}${event.startTime ? ' à ' + event.startTime : ''}`;
                    } else {
                        eventDate.textContent = `Du ${formattedStartDate} au ${formattedEndDate}`;
                    }
                    
                    eventHeader.appendChild(eventDate);
                    
                    // Lieu de l'événement
                    if (this.printOptions.showLocations && event.location) {
                        const eventLocation = document.createElement('div');
                        eventLocation.style.fontSize = '12px';
                        eventLocation.style.color = '#666';
                        eventLocation.textContent = `Lieu: ${event.location}`;
                        eventHeader.appendChild(eventLocation);
                    }
                    
                    eventItem.appendChild(eventHeader);
                    
                    // Description de l'événement
                    if (this.printOptions.showDescriptions && event.description) {
                        const eventDescription = document.createElement('div');
                        eventDescription.style.fontSize = '12px';
                        eventDescription.style.marginTop = '5px';
                        eventDescription.textContent = event.description;
                        eventItem.appendChild(eventDescription);
                    }
                    
                    eventsList.appendChild(eventItem);
                });
                
                eventsSection.appendChild(eventsList);
            } else {
                const noEvents = document.createElement('p');
                noEvents.textContent = 'Aucun événement cette semaine.';
                eventsSection.appendChild(noEvents);
            }
            
            container.appendChild(eventsSection);
        }
    }
    
    // Ajouter les événements à la grille hebdomadaire
    addEventsToWeeklyGrid(grid, events, categories, startOfWeek) {
        // Filtrer les événements de la semaine
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        const weekEvents = events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            return !(eventEndDate < startOfWeek || eventStartDate > endOfWeek);
        });
        
        // Pour chaque événement
        weekEvents.forEach(event => {
            const category = categories.find(c => c.id === event.categoryId);
            
            // Déterminer les jours et heures où l'événement apparaît
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            // Pour chaque jour de l'événement
            for (let day = 0; day < 7; day++) {
                const currentDay = new Date(startOfWeek);
                currentDay.setDate(startOfWeek.getDate() + day);
                currentDay.setHours(0, 0, 0, 0);
                
                const nextDay = new Date(currentDay);
                nextDay.setDate(currentDay.getDate() + 1);
                
                // Vérifier si l'événement a lieu ce jour
                if (!(eventEndDate < currentDay || eventStartDate >= nextDay)) {
                    // Déterminer les heures de début et de fin
                    let startHour = 8; // Début de la grille
                    let endHour = 20;  // Fin de la grille
                    
                    if (DateUtils.isSameDay(eventStartDate, currentDay) && event.startTime) {
                        const [hours, minutes] = event.startTime.split(':').map(Number);
                        startHour = Math.max(8, hours);
                    }
                    
                    if (DateUtils.isSameDay(eventEndDate, currentDay) && event.endTime) {
                        const [hours, minutes] = event.endTime.split(':').map(Number);
                        endHour = Math.min(20, hours);
                    }
                    
                    // Créer l'élément d'événement
                    const eventElement = document.createElement('div');
                    eventElement.style.position = 'absolute';
                    eventElement.style.left = '2px';
                    eventElement.style.right = '2px';
                    eventElement.style.top = `${(startHour - 8) * 40 + 2}px`;
                    eventElement.style.height = `${(endHour - startHour) * 40 - 4}px`;
                    eventElement.style.overflow = 'hidden';
                    eventElement.style.borderRadius = '4px';
                    eventElement.style.fontSize = '10px';
                    eventElement.style.padding = '2px';
                    
                    if (this.printOptions.useColors && category) {
                        eventElement.style.backgroundColor = `${category.color}40`;
                        eventElement.style.borderLeft = `2px solid ${category.color}`;
                    } else {
                        eventElement.style.backgroundColor = '#f1f1f1';
                        eventElement.style.border = '1px solid #ddd';
                    }
                    
                    // Titre de l'événement
                    const eventTitle = document.createElement('div');
                    eventTitle.style.fontWeight = 'bold';
                    eventTitle.style.whiteSpace = 'nowrap';
                    eventTitle.style.overflow = 'hidden';
                    eventTitle.style.textOverflow = 'ellipsis';
                    
                    if (this.printOptions.showCategories && category) {
                        eventTitle.textContent = `${category.emoji} ${event.title}`;
                    } else {
                        eventTitle.textContent = event.title;
                    }
                    
                    eventElement.appendChild(eventTitle);
                    
                    // Ajouter l'événement à la cellule correspondante
                    const dayColumn = day + 1; // +1 pour la colonne des heures
                    const dayCell = grid.children[(startHour - 8) * 8 + dayColumn];
                    if (dayCell) {
                        dayCell.appendChild(eventElement);
                    }
                }
            }
        });
    }
    
    // Générer le contenu pour la vue quotidienne
    generateDailyPrintContent(container) {
        // Récupérer les événements et les catégories depuis l'application
        const events = window.app?.eventManager?.dataManager?.getAllEvents() || [];
        const categories = window.app?.categoryManager?.dataManager?.getAllCategories() || [];
        
        // Date actuelle
        const currentDate = window.app?.calendarManager?.currentDate || new Date();
        
        // Titre
        const title = document.createElement('h2');
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        title.textContent = `${this.getDayOfWeekName(currentDate.getDay())} ${currentDate.getDate()} ${this.getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
        container.appendChild(title);
        
        // Créer l'agenda quotidien
        const daySchedule = document.createElement('div');
        daySchedule.style.border = '1px solid #e0e0e0';
        daySchedule.style.borderRadius = '12px';
        daySchedule.style.overflow = 'hidden';
        
        // En-tête du jour
        const dayHeader = document.createElement('div');
        dayHeader.style.padding = '15px';
        dayHeader.style.textAlign = 'center';
        dayHeader.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.borderBottom = '1px solid #e0e0e0';
        dayHeader.textContent = title.textContent;
        daySchedule.appendChild(dayHeader);
        
        // Timeline
        const dayTimeline = document.createElement('div');
        dayTimeline.style.display = 'grid';
        dayTimeline.style.gridTemplateColumns = '60px 1fr';
        
        // Heures (de 8h à 20h pour simplifier l'impression)
        for (let hour = 8; hour < 21; hour++) {
            // Cellule de l'heure
            const hourCell = document.createElement('div');
            hourCell.style.padding = '10px 5px';
            hourCell.style.textAlign = 'right';
            hourCell.style.borderBottom = '1px solid #e0e0e0';
            hourCell.textContent = `${hour}:00`;
            dayTimeline.appendChild(hourCell);
            
            // Plage horaire
            const timeSlot = document.createElement('div');
            timeSlot.style.position = 'relative';
            timeSlot.style.minHeight = '60px';
            timeSlot.style.borderBottom = '1px solid #e0e0e0';
            dayTimeline.appendChild(timeSlot);
        }
        
        daySchedule.appendChild(dayTimeline);
        container.appendChild(daySchedule);
        
        // Ajouter les événements à la timeline
        this.addEventsToDailyTimeline(dayTimeline, events, categories, currentDate);
        
        // Liste des événements du jour
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayEvents = events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            return !(eventEndDate < dayStart || eventStartDate > dayEnd);
        });
        
        if (dayEvents.length > 0 && this.printOptions.showDescriptions) {
            const eventsSection = document.createElement('div');
            eventsSection.style.marginTop = '30px';
            
            const eventsTitle = document.createElement('h3');
            eventsTitle.textContent = 'Détails des événements';
            eventsTitle.style.marginBottom = '10px';
            eventsSection.appendChild(eventsTitle);
            
            // Trier par date
            dayEvents.sort((a, b) => {
                if (a.startTime && b.startTime) {
                    return a.startTime.localeCompare(b.startTime);
                }
                return a.startTime ? -1 : 1;
            });
            
            const eventsList = document.createElement('div');
            
            dayEvents.forEach(event => {
                const category = categories.find(c => c.id === event.categoryId);
                
                const eventItem = document.createElement('div');
                eventItem.style.padding = '10px';
                eventItem.style.marginBottom = '10px';
                eventItem.style.border = '1px solid #e0e0e0';
                eventItem.style.borderRadius = '5px';
                
                if (this.printOptions.useColors && category) {
                    eventItem.style.borderLeft = `4px solid ${category.color}`;
                }
                
                // En-tête de l'événement
                const eventHeader = document.createElement('div');
                eventHeader.style.marginBottom = '5px';
                
                const eventTitle = document.createElement('div');
                eventTitle.style.fontWeight = 'bold';
                
                if (this.printOptions.showCategories && category) {
                    eventTitle.textContent = `${category.emoji} ${event.title}`;
                } else {
                    eventTitle.textContent = event.title;
                }
                
                eventHeader.appendChild(eventTitle);
                
                // Heure de l'événement
                if (event.startTime) {
                    const eventTime = document.createElement('div');
                    eventTime.style.fontSize = '12px';
                    eventTime.style.color = '#666';
                    
                    if (event.endTime) {
                        eventTime.textContent = `De ${event.startTime} à ${event.endTime}`;
                    } else {
                        eventTime.textContent = `À ${event.startTime}`;
                    }
                    
                    eventHeader.appendChild(eventTime);
                }
                
                // Lieu de l'événement
                if (this.printOptions.showLocations && event.location) {
                    const eventLocation = document.createElement('div');
                    eventLocation.style.fontSize = '12px';
                    eventLocation.style.color = '#666';
                    eventLocation.textContent = `Lieu: ${event.location}`;
                    eventHeader.appendChild(eventLocation);
                }
                
                eventItem.appendChild(eventHeader);
                
                // Description de l'événement
                if (this.printOptions.showDescriptions && event.description) {
                    const eventDescription = document.createElement('div');
                    eventDescription.style.fontSize = '12px';
                    eventDescription.style.marginTop = '5px';
                    eventDescription.textContent = event.description;
                    eventItem.appendChild(eventDescription);
                }
                
                eventsList.appendChild(eventItem);
            });
            
            eventsSection.appendChild(eventsList);
            container.appendChild(eventsSection);
        }
    }
    
    // Ajouter les événements à la timeline quotidienne
    addEventsToDailyTimeline(timeline, events, categories, date) {
        // Filtrer les événements du jour
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayEvents = events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            return !(eventEndDate < dayStart || eventStartDate > dayEnd);
        });
        
        // Trier par heure de début
        dayEvents.sort((a, b) => {
            if (a.startTime && b.startTime) {
                return a.startTime.localeCompare(b.startTime);
            }
            return a.startTime ? -1 : 1;
        });
        
        // Pour chaque événement
        dayEvents.forEach(event => {
            const category = categories.find(c => c.id === event.categoryId);
            
            // Déterminer les heures de début et de fin
            let startHour = 8; // Début de la grille
            let endHour = 20;  // Fin de la grille
            
            if (event.startTime) {
                const [hours, minutes] = event.startTime.split(':').map(Number);
                startHour = Math.max(8, hours);
            }
            
            if (event.endTime) {
                const [hours, minutes] = event.endTime.split(':').map(Number);
                endHour = Math.min(20, hours + 1);
            } else {
                // Si pas d'heure de fin, on ajoute 1 heure par défaut
                endHour = Math.min(20, startHour + 1);
            }
            
            // Créer l'élément d'événement
            const eventElement = document.createElement('div');
            eventElement.style.position = 'absolute';
            eventElement.style.left = '5px';
            eventElement.style.right = '5px';
            eventElement.style.top = `${(startHour - 8) * 60 + 5}px`;
            eventElement.style.minHeight = `${(endHour - startHour) * 60 - 10}px`;
            eventElement.style.overflow = 'hidden';
            eventElement.style.borderRadius = '4px';
            eventElement.style.padding = '5px';
            
            if (this.printOptions.useColors && category) {
                eventElement.style.backgroundColor = `${category.color}40`;
                eventElement.style.borderLeft = `3px solid ${category.color}`;
            } else {
                eventElement.style.backgroundColor = '#f1f1f1';
                eventElement.style.border = '1px solid #ddd';
            }
            
            // Titre de l'événement
            const eventTitle = document.createElement('div');
            eventTitle.style.fontWeight = 'bold';
            
            if (this.printOptions.showCategories && category) {
                eventTitle.textContent = `${category.emoji} ${event.title}`;
            } else {
                eventTitle.textContent = event.title;
            }
            
            eventElement.appendChild(eventTitle);
            
            // Heure de l'événement
            if (event.startTime) {
                const eventTime = document.createElement('div');
                eventTime.style.fontSize = '10px';
                
                if (event.endTime) {
                    eventTime.textContent = `${event.startTime} - ${event.endTime}`;
                } else {
                    eventTime.textContent = event.startTime;
                }
                
                eventElement.appendChild(eventTime);
            }
            
            // Lieu de l'événement
            if (this.printOptions.showLocations && event.location) {
                const eventLocation = document.createElement('div');
                eventLocation.style.fontSize = '10px';
                eventLocation.textContent = event.location;
                eventElement.appendChild(eventLocation);
            }
            
            // Description (abrégée)
            if (this.printOptions.showDescriptions && event.description) {
                const eventDescription = document.createElement('div');
                eventDescription.style.fontSize = '10px';
                eventDescription.style.marginTop = '3px';
                
                // Limiter la description à 50 caractères
                const shortenedDescription = event.description.length > 50 ?
                    event.description.substring(0, 47) + '...' : event.description;
                
                eventDescription.textContent = shortenedDescription;
                eventElement.appendChild(eventDescription);
            }
            
            // Ajouter l'événement à la timeline
            const eventsColumn = timeline.children[(startHour - 8) * 2 + 1];
            if (eventsColumn) {
                eventsColumn.appendChild(eventElement);
            }
        });
    }
    
    // Utilitaires pour les noms de mois et jours
    getMonthName(monthIndex, format = 'long') {
        const date = new Date(2025, monthIndex, 1);
        return date.toLocaleDateString('fr-FR', { month: format });
    }
    
    getDayOfWeekName(dayIndex, format = 'long') {
        const date = new Date(2025, 0, 5 + dayIndex); // Le 5 janvier 2025 est un dimanche
        return date.toLocaleDateString('fr-FR', { weekday: format });
    }
}