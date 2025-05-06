/**
 * @fileoverview Gestionnaire d'impression et d'exportation PDF pour SuperCalendrier
 * Responsable de la génération des vues imprimables, des aperçus et de l'exportation PDF
 * @module PrintManager
 */

import { DateUtils } from './utils/date-utils.js';

/**
 * Classe PrintManager 
 * Gère l'impression du calendrier et l'exportation en PDF
 */
export class PrintManager {
    /**
     * Crée une instance du gestionnaire d'impression
     */
    constructor() {
        /**
         * Options d'impression configurables
         * @type {Object}
         */
        this.printOptions = {
            view: 'yearly',           // 'yearly', 'monthly', 'weekly', 'daily'
            format: 'A4',             // 'A2', 'A3', 'A4', 'A5', 'A6'
            orientation: 'portrait',  // 'portrait', 'landscape'
            showCategories: true,     // Afficher les informations de catégorie
            showDescriptions: true,   // Afficher les descriptions d'événements
            showLocations: true,      // Afficher les lieux d'événements
            useColors: true,          // Utiliser les couleurs pour les catégories
            headerTitle: ''           // Titre personnalisé pour l'en-tête
        };
        
        /**
         * Référence à la modale d'impression
         * @type {HTMLElement}
         * @private
         */
        this._printModal = document.getElementById('print-modal');
        
        /**
         * Conteneur temporaire d'impression
         * @type {HTMLElement|null}
         * @private
         */
        this._tempPrintContainer = null;
        
        // Initialiser les écouteurs d'événements
        this._initEventListeners();
    }
    
    /**
     * Initialise tous les écouteurs d'événements pour l'impression
     * @private
     */
    _initEventListeners() {
        // Écouteurs pour les options d'impression dans la modale
        this._initPrintOptionsListeners();
        
        // Écouteur pour l'exportation PDF via Electron
        window.addEventListener('print:exportPdf', (e) => {
            if (window.electronAPI && window.electronAPI.exportToPdf) {
                window.electronAPI.exportToPdf(e.detail);
            } else {
                this._handleError('L\'exportation PDF nécessite Electron');
            }
        });
    }
    
    /**
     * Initialise les écouteurs d'événements pour les options d'impression
     * @private
     */
    _initPrintOptionsListeners() {
        const selectors = [
            { id: 'print-view', prop: 'view' },
            { id: 'print-format', prop: 'format' },
            { id: 'print-orientation', prop: 'orientation' },
            { id: 'print-show-categories', prop: 'showCategories', type: 'checkbox' },
            { id: 'print-show-descriptions', prop: 'showDescriptions', type: 'checkbox' },
            { id: 'print-show-locations', prop: 'showLocations', type: 'checkbox' },
            { id: 'print-use-colors', prop: 'useColors', type: 'checkbox' },
            { id: 'print-header-title', prop: 'headerTitle' }
        ];
        
        selectors.forEach(selector => {
            const element = document.getElementById(selector.id);
            if (element) {
                const eventType = selector.type === 'checkbox' ? 'change' : 'input';
                
                element.addEventListener(eventType, () => {
                    if (selector.type === 'checkbox') {
                        this.printOptions[selector.prop] = element.checked;
                    } else {
                        this.printOptions[selector.prop] = element.value;
                    }
                    
                    // Générer un aperçu en direct si possible
                    this._updateLivePreview();
                });
            }
        });
    }
    
    /**
     * Met à jour l'aperçu en direct dans la modale d'impression
     * @private
     */
    _updateLivePreview() {
        const previewContainer = document.getElementById('live-print-preview');
        if (!previewContainer) return;
        
        // Limiter les mises à jour avec un délai pour éviter trop de rendus
        if (this._previewUpdateTimeout) {
            clearTimeout(this._previewUpdateTimeout);
        }
        
        this._previewUpdateTimeout = setTimeout(() => {
            // Vider le conteneur d'aperçu
            previewContainer.innerHTML = '';
            
            // Créer un conteneur temporaire pour l'aperçu
            const printContainer = this._createSimplifiedPreviewContainer();
            
            // Ajouter le contenu au conteneur
            this._generatePrintContent(printContainer, true);
            
            // Ajouter le conteneur à l'aperçu
            previewContainer.appendChild(printContainer);
        }, 300);
    }
    
    /**
     * Crée un conteneur simplifié pour l'aperçu en direct
     * @returns {HTMLElement} - Le conteneur d'aperçu
     * @private
     */
    _createSimplifiedPreviewContainer() {
        const container = document.createElement('div');
        container.className = 'print-preview';
        container.style.width = '100%';
        container.style.height = '300px';
        container.style.overflow = 'auto';
        container.style.backgroundColor = 'white';
        container.style.color = 'black';
        container.style.padding = '10px';
        container.style.border = '1px solid #ddd';
        container.style.transform = 'scale(0.7)';
        container.style.transformOrigin = 'top left';
        return container;
    }
    
    /**
     * Gère les erreurs de manière standardisée
     * @param {string} message - Message d'erreur
     * @param {Error} [error] - Objet d'erreur (optionnel)
     * @private
     */
    _handleError(message, error) {
        console.error(`PrintManager: ${message}`, error || '');
        
        // Afficher une notification d'erreur
        window.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                message: `Erreur d'impression: ${message}`,
                isError: true
            }
        }));
    }
    
    /**
     * Imprime le calendrier avec les options actuelles
     * @returns {Promise<boolean>} - Vrai si l'impression a réussi
     */
    async print() {
        try {
            // Créer un conteneur temporaire pour l'impression
            this._tempPrintContainer = this._createPrintContainer();
            
            // Ajouter le contenu à imprimer
            this._generatePrintContent(this._tempPrintContainer);
            
            // Fermer la modale d'impression
            if (this._printModal) {
                this._printModal.classList.remove('active');
            }
            
            // Imprimer
            window.print();
            
            // Afficher une notification de succès
            this._showNotification('Impression terminée');
            
            // Nettoyer après l'impression avec un délai
            setTimeout(() => {
                this._cleanupAfterPrint();
            }, 1000);
            
            return true;
        } catch (error) {
            this._handleError('Erreur lors de l\'impression', error);
            this._cleanupAfterPrint();
            return false;
        }
    }

    /**
     * Nettoie les ressources après l'impression
     * @private
     */
    _cleanupAfterPrint() {
        if (this._tempPrintContainer && this._tempPrintContainer.parentNode) {
            document.body.removeChild(this._tempPrintContainer);
            this._tempPrintContainer = null;
        }
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
     * Génère un aperçu avant impression
     * @returns {Promise<boolean>} - Vrai si la prévisualisation a réussi
     */
    async preview() {
        try {
            // Créer un conteneur pour l'aperçu
            const previewContainer = this._createPrintContainer(true);
            
            // Ajouter le contenu à prévisualiser
            this._generatePrintContent(previewContainer);
            
            // Créer une modale pour l'aperçu
            const previewModal = document.createElement('div');
            previewModal.className = 'modal-overlay active';
            
            previewModal.innerHTML = `
                <div class="modal" style="max-width: 90%; width: auto; height: 90vh; max-height: 90vh;">
                    <div class="modal-header">
                        <div class="modal-title">Aperçu avant impression</div>
                        <button class="modal-close" aria-label="Fermer">&times;</button>
                    </div>
                    <div class="modal-body" style="overflow: auto; max-height: calc(90vh - 140px);">
                        <div id="preview-content"></div>
                    </div>
                    <div class="modal-footer">
                        <button id="print-from-preview" class="btn btn-primary">
                            <i class="fas fa-print"></i>
                            Imprimer
                        </button>
                        <button id="export-pdf-from-preview" class="btn btn-info">
                            <i class="fas fa-file-pdf"></i>
                            Exporter en PDF
                        </button>
                    </div>
                </div>
            `;
            
            // Ajouter l'aperçu au corps du document
            document.body.appendChild(previewModal);
            
            // Ajouter le contenu à l'aperçu
            const previewContent = previewModal.querySelector('#preview-content');
            if (previewContent) {
                previewContent.appendChild(previewContainer);
            }
            
            // Gérer les événements de la modale
            this._setupPreviewModalEvents(previewModal);
            
            return true;
        } catch (error) {
            this._handleError('Erreur lors de la génération de l\'aperçu', error);
            return false;
        }
    }
    
    /**
     * Configure les événements de la modale d'aperçu
     * @param {HTMLElement} modal - La modale d'aperçu
     * @private
     */
    _setupPreviewModalEvents(modal) {
        // Bouton de fermeture
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }
        
        // Bouton d'impression
        const printBtn = modal.querySelector('#print-from-preview');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                this.print();
            });
        }
        
        // Bouton d'exportation PDF
        const pdfBtn = modal.querySelector('#export-pdf-from-preview');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                this.exportToPdf();
            });
        }
        
        // Fermer en cliquant en dehors de la modale
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    /**
     * Exporte en PDF via Electron
     * @returns {Promise<boolean>} - Vrai si l'exportation a réussi
     */
    async exportToPdf() {
        try {
            // Vérifier si l'API Electron est disponible
            if (!window.electronAPI) {
                throw new Error('L\'exportation PDF n\'est disponible que dans la version desktop de l\'application.');
            }
            
            // Créer un conteneur temporaire pour l'impression
            this._tempPrintContainer = this._createPrintContainer();
            
            // Ajouter le contenu à exporter
            this._generatePrintContent(this._tempPrintContainer);
            
            // Fermer la modale d'impression
            if (this._printModal) {
                this._printModal.classList.remove('active');
            }
            
            // Déclencher l'événement d'exportation PDF
            window.dispatchEvent(new CustomEvent('print:exportPdf', {
                detail: { 
                    options: this.printOptions,
                    targetElement: this._tempPrintContainer.id
                }
            }));
            
            // Nettoyer après l'exportation
            setTimeout(() => {
                this._cleanupAfterPrint();
            }, 1000);
            
            return true;
        } catch (error) {
            this._handleError('Erreur lors de l\'exportation PDF', error);
            this._cleanupAfterPrint();
            return false;
        }
    }
    
    /**
     * Crée un conteneur pour l'impression
     * @param {boolean} [isPreview=false] - Indique si c'est pour un aperçu
     * @returns {HTMLElement} - Le conteneur pour l'impression
     * @private
     */
    _createPrintContainer(isPreview = false) {
        // Générer un ID unique pour le conteneur
        const containerId = `print-container-${Date.now()}`;
        
        // Créer le conteneur
        const printContainer = document.createElement('div');
        printContainer.id = containerId;
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
        this._applyPaperFormat(printContainer);
        
        // Ajouter des styles spécifiques à l'impression
        if (!isPreview) {
            this._addPrintStylesheet(printContainer, containerId);
        }
        
        // Ajouter au corps du document
        document.body.appendChild(printContainer);
        
        return printContainer;
    }
    
    /**
     * Applique le format et l'orientation à un conteneur
     * @param {HTMLElement} container - Le conteneur à formater
     * @private
     */
    _applyPaperFormat(container) {
        // Dimensions des formats de papier en mm
        const paperSizes = {
            'A2': { width: 420, height: 594 },
            'A3': { width: 297, height: 420 },
            'A4': { width: 210, height: 297 },
            'A5': { width: 148, height: 210 },
            'A6': { width: 105, height: 148 }
        };
        
        // Récupérer les dimensions du format sélectionné
        const size = paperSizes[this.printOptions.format] || paperSizes['A4'];
        
        // Ajuster en fonction de l'orientation
        const width = this.printOptions.orientation === 'landscape' ? size.height : size.width;
        const height = this.printOptions.orientation === 'landscape' ? size.width : size.height;
        
        // Appliquer les dimensions
        container.style.width = `${width}mm`;
        container.style.height = `${height}mm`;
        container.style.maxWidth = `${width}mm`;
        container.style.maxHeight = `${height}mm`;
    }
    
    /**
     * Ajoute une feuille de style pour l'impression
     * @param {HTMLElement} container - Le conteneur d'impression
     * @param {string} containerId - L'ID du conteneur
     * @private
     */
    _addPrintStylesheet(container, containerId) {
        const printStyles = document.createElement('style');
        printStyles.innerHTML = `
            @media print {
                body * {
                    visibility: hidden;
                }
                #${containerId}, #${containerId} * {
                    visibility: visible;
                }
                #${containerId} {
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
        container.appendChild(printStyles);
    }
    
    /**
     * Génère le contenu à imprimer
     * @param {HTMLElement} container - Le conteneur où générer le contenu
     * @param {boolean} [isSimplified=false] - Si true, génère une version simplifiée pour l'aperçu en direct
     * @private
     */
    _generatePrintContent(container, isSimplified = false) {
        // En-tête de la page
        this._generateHeader(container);
        
        // Contenu spécifique à la vue sélectionnée
        switch (this.printOptions.view) {
            case 'yearly':
                this._generateYearlyPrintContent(container, isSimplified);
                break;
            case 'monthly':
                this._generateMonthlyPrintContent(container, isSimplified);
                break;
            case 'weekly':
                this._generateWeeklyPrintContent(container, isSimplified);
                break;
            case 'daily':
                this._generateDailyPrintContent(container, isSimplified);
                break;
        }
        
        // Pied de page
        if (!isSimplified) {
            this._generateFooter(container);
        }
    }
    
    /**
     * Génère l'en-tête de la page d'impression
     * @param {HTMLElement} container - Le conteneur d'impression
     * @private
     */
    _generateHeader(container) {
        const header = document.createElement('div');
        header.className = 'print-header';
        header.style.textAlign = 'center';
        header.style.marginBottom = '20px';
        
        // Titre personnalisé ou par défaut
        const title = this.printOptions.headerTitle || 'SuperCalendrier';
        
        header.innerHTML = `
            <h1 style="color: #4361ee; margin-bottom: 5px;">${title}</h1>
            <p style="color: #666;">Imprimé le ${new Date().toLocaleDateString('fr-FR')}</p>
        `;
        
        container.appendChild(header);
    }
    
    /**
     * Génère le pied de page de la page d'impression
     * @param {HTMLElement} container - Le conteneur d'impression
     * @private
     */
    _generateFooter(container) {
        const footer = document.createElement('div');
        footer.className = 'print-footer';
        footer.style.marginTop = '20px';
        footer.style.borderTop = '1px solid #ddd';
        footer.style.paddingTop = '10px';
        footer.style.textAlign = 'center';
        footer.style.fontSize = '10px';
        footer.style.color = '#666';
        
        footer.innerHTML = `
            <p>SuperCalendrier - Page ${this._getCurrentPage()} - Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        `;
        
        container.appendChild(footer);
    }
    
    /**
     * Obtient le numéro de page actuel (pour les impressions multi-pages)
     * @returns {string} - Le numéro de page
     * @private
     */
    _getCurrentPage() {
        // Cette fonction est un espace réservé pour une future implémentation
        // de numérotation de pages pour les impressions multi-pages
        return '1';
    }
    
    /**
     * Ouvre la modale d'impression et initialise ses champs
     */
    openPrintModal() {
        if (!this._printModal) return;
        
        // Initialiser les champs de la modale avec les valeurs actuelles
        this._updatePrintModalFields();
        
        // Afficher la modale
        this._printModal.classList.add('active');
        
        // Générer un aperçu en direct si possible
        this._updateLivePreview();
    }
    
    /**
     * Met à jour les champs de la modale d'impression
     * @private
     */
    _updatePrintModalFields() {
        // Récupérer la vue actuelle du calendrier
        const calendarManager = window.app?.calendarManager;
        if (calendarManager) {
            this.printOptions.view = calendarManager.currentView;
        }
        
        // Mettre à jour les champs du formulaire
        const fields = [
            { id: 'print-view', prop: 'view' },
            { id: 'print-format', prop: 'format' },
            { id: 'print-orientation', prop: 'orientation' },
            { id: 'print-show-categories', prop: 'showCategories', type: 'checkbox' },
            { id: 'print-show-descriptions', prop: 'showDescriptions', type: 'checkbox' },
            { id: 'print-show-locations', prop: 'showLocations', type: 'checkbox' },
            { id: 'print-use-colors', prop: 'useColors', type: 'checkbox' },
            { id: 'print-header-title', prop: 'headerTitle' }
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                if (field.type === 'checkbox') {
                    element.checked = this.printOptions[field.prop];
                } else {
                    element.value = this.printOptions[field.prop];
                }
            }
        });
    }
    
    // ======================================================================
    // MÉTHODES DE GÉNÉRATION DES VUES POUR L'IMPRESSION
    // ======================================================================
    
    /**
     * Génère le contenu pour la vue annuelle
     * @param {HTMLElement} container - Le conteneur d'impression
     * @param {boolean} [isSimplified=false] - Si true, génère une version simplifiée
     * @private
     */
    _generateYearlyPrintContent(container, isSimplified = false) {
        // Récupérer les événements et les catégories depuis l'application
        const events = this._getEventsFromManager();
        const categories = this._getCategoriesFromManager();
        
        // Année actuelle
        const currentDate = this._getCurrentDateFromManager();
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
        
        // Limiter le nombre de mois si c'est une version simplifiée
        const monthsToShow = isSimplified ? 3 : 12;
        
        // Créer chaque mois
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        for (let i = 0; i < monthsToShow; i++) {
            const monthCard = this._createMonthCardForYearlyView(year, i, events, months);
            monthsGrid.appendChild(monthCard);
        }
        
        container.appendChild(monthsGrid);
        
        // Légende des catégories
        if (this.printOptions.showCategories && categories.length > 0 && !isSimplified) {
            this._generateCategoriesLegend(container, categories);
        }
    }
    
    /**
     * Crée une carte de mois pour la vue annuelle
     * @param {number} year - L'année
     * @param {number} monthIndex - L'index du mois (0-11)
     * @param {Array} events - Liste des événements
     * @param {Array} months - Noms des mois
     * @returns {HTMLElement} - La carte du mois
     * @private
     */
    _createMonthCardForYearlyView(year, monthIndex, events, months) {
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
        monthHeader.textContent = months[monthIndex];
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
        
        // Premier jour du mois (ajustement pour commencer par lundi)
        const firstDay = new Date(year, monthIndex, 1).getDay();
        const firstDayAdjusted = (firstDay === 0) ? 6 : firstDay - 1;
        
        // Cellules vides pour les jours précédant le premier du mois
        for (let i = 0; i < firstDayAdjusted; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.style.aspectRatio = '1';
            daysGrid.appendChild(emptyDay);
        }
        
        // Nombre de jours dans le mois
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        
        // Aujourd'hui
        const today = new Date();
        const isCurrentMonth = today.getMonth() === monthIndex && today.getFullYear() === year;
        
        // Ajouter les jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this._createDayElementForYearlyView(day, year, monthIndex, events, isCurrentMonth);
            daysGrid.appendChild(dayElement);
        }
        
        monthCard.appendChild(daysGrid);
        return monthCard;
    }
    
    /**
     * Crée un élément jour pour la vue annuelle
     * @param {number} day - Jour du mois
     * @param {number} year - Année
     * @param {number} monthIndex - Index du mois
     * @param {Array} events - Liste des événements
     * @param {boolean} isCurrentMonth - Si ce mois est le mois courant
     * @returns {HTMLElement} - Élément jour
     * @private
     */
    _createDayElementForYearlyView(day, year, monthIndex, events, isCurrentMonth) {
        // Créer l'élément jour
        const dayElement = document.createElement('div');
        dayElement.style.aspectRatio = '1';
        dayElement.style.display = 'flex';
        dayElement.style.alignItems = 'center';
        dayElement.style.justifyContent = 'center';
        dayElement.style.position = 'relative';
        dayElement.style.fontSize = '14px';
        dayElement.textContent = day;
        
        // Vérifier si le jour est aujourd'hui
        const today = new Date();
        if (isCurrentMonth && today.getDate() === day) {
            dayElement.style.fontWeight = 'bold';
            dayElement.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
            dayElement.style.borderRadius = '50%';
        }
        
        // Vérifier si le jour a des événements
        const date = new Date(year, monthIndex, day);
        const dayEvents = this._getEventsForDay(events, date);
        
        if (dayEvents.length > 0) {
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
        
        return dayElement;
    }
    
    /**
     * Génère le contenu pour la vue mensuelle
     * @param {HTMLElement} container - Le conteneur d'impression
     * @param {boolean} [isSimplified=false] - Si true, génère une version simplifiée
     * @private
     */
    _generateMonthlyPrintContent(container, isSimplified = false) {
        // Récupérer les événements et les catégories depuis l'application
        const events = this._getEventsFromManager();
        const categories = this._getCategoriesFromManager();
        
        // Date actuelle
        const currentDate = this._getCurrentDateFromManager();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Titre
        const title = document.createElement('h2');
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        title.textContent = `${this._getMonthName(month)} ${year}`;
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
        
        // Limiter le nombre de semaines pour la version simplifiée
        const weeksToShow = isSimplified ? 3 : 6;
        const daysToShow = weeksToShow * 7;
        
        // Générer les jours
        for (let i = 0; i < daysToShow; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayElement = this._createDayElementForMonthlyView(currentDate, month, events, categories);
            daysGrid.appendChild(dayElement);
        }
        
        monthCalendar.appendChild(daysGrid);
        container.appendChild(monthCalendar);
        
        // Liste des événements du mois
        if (this.printOptions.showDescriptions && !isSimplified) {
            this._generateMonthEventsListing(container, events, categories, year, month);
        }
    }
    
    /**
     * Crée un élément jour pour la vue mensuelle
     * @param {Date} date - Date du jour
     * @param {number} currentMonth - Mois actuel
     * @param {Array} events - Liste des événements
     * @param {Array} categories - Liste des catégories
     * @returns {HTMLElement} - Élément jour
     * @private
     */
    _createDayElementForMonthlyView(date, currentMonth, events, categories) {
        const currentDay = date.getDate();
        const month = date.getMonth();
        
        const dayElement = document.createElement('div');
        dayElement.style.border = '1px solid #e0e0e0';
        dayElement.style.padding = '5px';
        dayElement.style.minHeight = '80px';
        
        // Ajouter une classe pour les jours hors du mois courant
        if (month !== currentMonth) {
            dayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
            dayElement.style.color = '#aaa';
        }
        
        // En-tête du jour
        const dayHeader = document.createElement('div');
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.marginBottom = '5px';
        dayHeader.textContent = currentDay;
        
        // Marquer aujourd'hui
        const today = new Date();
        if (date.getFullYear() === today.getFullYear() && 
            date.getMonth() === today.getMonth() && 
            date.getDate() === today.getDate()) {
            dayHeader.style.backgroundColor = 'rgba(67, 97, 238, 0.2)';
            dayHeader.style.borderRadius = '50%';
            dayHeader.style.width = '24px';
            dayHeader.style.height = '24px';
            dayHeader.style.display = 'flex';
            dayHeader.style.alignItems = 'center';
            dayHeader.style.justifyContent = 'center';
        }
        
        dayElement.appendChild(dayHeader);
        
        // Filtrer les événements du jour
        const dayEvents = this._getEventsForDay(events, date);
        
        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.style.fontSize = '10px';
            
            // Limiter le nombre d'événements pour la vue mensuelle
            const maxEvents = 3;
            const visibleEvents = dayEvents.slice(0, maxEvents);
            
            visibleEvents.forEach(event => {
                const eventElement = this._createEventElementForMonthlyView(event, categories);
                eventsContainer.appendChild(eventElement);
            });
            
            // Ajouter une indication s'il y a plus d'événements
            if (dayEvents.length > maxEvents) {
                const moreIndicator = document.createElement('div');
                moreIndicator.style.textAlign = 'center';
                moreIndicator.style.fontSize = '9px';
                moreIndicator.style.color = '#666';
                moreIndicator.textContent = `+ ${dayEvents.length - maxEvents} événement(s)`;
                eventsContainer.appendChild(moreIndicator);
            }
            
            dayElement.appendChild(eventsContainer);
        }
        
        return dayElement;
    }
    
    /**
     * Crée un élément d'événement pour la vue mensuelle
     * @param {Object} event - Événement à afficher
     * @param {Array} categories - Liste des catégories
     * @returns {HTMLElement} - Élément d'événement
     * @private
     */
    _createEventElementForMonthlyView(event, categories) {
        const category = this._findCategoryById(categories, event.categoryId);
        
        const eventElement = document.createElement('div');
        eventElement.style.marginBottom = '3px';
        eventElement.style.padding = '2px';
        eventElement.style.borderRadius = '3px';
        eventElement.style.whiteSpace = 'nowrap';
        eventElement.style.overflow = 'hidden';
        eventElement.style.textOverflow = 'ellipsis';
        
        if (this.printOptions.useColors && category) {
            eventElement.style.borderLeft = `2px solid ${category.color}`;
            eventElement.style.backgroundColor = `${category.color}20`;
        } else {
            eventElement.style.borderLeft = '2px solid #ccc';
            eventElement.style.backgroundColor = '#f5f5f5';
        }
        
        // Titre de l'événement
        const eventText = document.createElement('span');
        eventText.style.fontWeight = 'bold';
        
        if (this.printOptions.showCategories && category) {
            eventText.textContent = `${category.emoji} ${event.title}`;
        } else {
            eventText.textContent = event.title;
        }
        
        eventElement.appendChild(eventText);
        
        // Heure de l'événement
        if (event.startTime && !event.isAllDay) {
            const time = document.createElement('span');
            time.style.marginLeft = '5px';
            time.style.fontSize = '8px';
            time.style.color = '#666';
            time.textContent = event.startTime;
            eventElement.appendChild(time);
        }
        
        return eventElement;
    }
    
    /**
     * Génère la liste des événements du mois pour la vue mensuelle
     * @param {HTMLElement} container - Conteneur d'impression
     * @param {Array} events - Liste des événements
     * @param {Array} categories - Liste des catégories
     * @param {number} year - Année
     * @param {number} month - Mois
     * @private
     */
    _generateMonthEventsListing(container, events, categories, year, month) {
        // Créer la section des événements
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
                const eventItem = this._createEventItemForListing(event, categories);
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
    
    /**
     * Crée un élément d'événement pour la liste des événements
     * @param {Object} event - Événement à afficher
     * @param {Array} categories - Liste des catégories
     * @returns {HTMLElement} - Élément d'événement
     * @private
     */
    _createEventItemForListing(event, categories) {
        const category = this._findCategoryById(categories, event.categoryId);
        
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
        
        return eventItem;
    }
    
    /**
     * Génère le contenu pour la vue hebdomadaire
     * @param {HTMLElement} container - Le conteneur d'impression
     * @param {boolean} [isSimplified=false] - Si true, génère une version simplifiée
     * @private
     */
    _generateWeeklyPrintContent(container, isSimplified = false) {
        // Récupérer les événements et les catégories depuis l'application
        const events = this._getEventsFromManager();
        const categories = this._getCategoriesFromManager();
        
        // Date actuelle
        const currentDate = this._getCurrentDateFromManager();
        
        // Déterminer le début de la semaine (lundi par défaut)
        const firstDayOfWeek = 1; // Lundi
        const startOfWeek = this._getStartOfWeek(currentDate, firstDayOfWeek);
        const endOfWeek = this._getEndOfWeek(startOfWeek);
        
        // Titre
        const title = document.createElement('h2');
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        
        // Format du titre: "Semaine du 1 janvier au 7 janvier 2025"
        const formattedStartDay = startOfWeek.getDate();
        const formattedEndDay = endOfWeek.getDate();
        const startMonth = this._getMonthName(startOfWeek.getMonth());
        const endMonth = this._getMonthName(endOfWeek.getMonth());
        const year = endOfWeek.getFullYear();
        
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
            title.textContent = `Semaine du ${formattedStartDay} au ${formattedEndDay} ${startMonth} ${year}`;
        } else {
            title.textContent = `Semaine du ${formattedStartDay} ${startMonth} au ${formattedEndDay} ${endMonth} ${year}`;
        }
        
        container.appendChild(title);
        
        // Créer le planning hebdomadaire
        const weekCalendar = document.createElement('div');
        weekCalendar.style.border = '1px solid #e0e0e0';
        weekCalendar.style.borderRadius = '12px';
        weekCalendar.style.overflow = 'hidden';
        
        // En-tête des jours
        this._generateWeeklyHeader(weekCalendar, startOfWeek);
        
        // Générer la section des événements toute la journée
        const allDayEvents = events.filter(event => event.isAllDay);
        if (allDayEvents.length > 0) {
            this._generateAllDayEventsSection(weekCalendar, allDayEvents, categories, startOfWeek);
        }
        
        // Générer la grille horaire (simplifiée ou complète)
        const hourRange = isSimplified ? { start: 9, end: 17 } : { start: 8, end: 20 };
        
        // Grille des heures
        this._generateWeeklyHoursGrid(weekCalendar, hourRange, startOfWeek, 
            events.filter(event => !event.isAllDay), categories);
        
        container.appendChild(weekCalendar);
        
        // Liste des événements de la semaine (pour la version complète uniquement)
        if (this.printOptions.showDescriptions && !isSimplified) {
            this._generateWeekEventsListing(container, events, categories, startOfWeek, endOfWeek);
        }
    }
    
    /**
     * Génère l'en-tête de la vue hebdomadaire
     * @param {HTMLElement} container - Conteneur du calendrier hebdomadaire
     * @param {Date} startOfWeek - Date de début de la semaine
     * @private
     */
    _generateWeeklyHeader(container, startOfWeek) {
        const weekHeader = document.createElement('div');
        weekHeader.style.display = 'grid';
        weekHeader.style.gridTemplateColumns = '60px repeat(7, 1fr)';
        weekHeader.style.borderBottom = '1px solid #e0e0e0';
        
        // Cellule vide pour l'en-tête des heures
        const emptyCell = document.createElement('div');
        weekHeader.appendChild(emptyCell);
        
        // Jours de la semaine
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            
            const dayCell = document.createElement('div');
            dayCell.style.padding = '10px';
            dayCell.style.textAlign = 'center';
            dayCell.style.borderRight = '1px solid #e0e0e0';
            
            // Marquer aujourd'hui
            if (dayDate.getFullYear() === today.getFullYear() &&
                dayDate.getMonth() === today.getMonth() &&
                dayDate.getDate() === today.getDate()) {
                dayCell.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
            }
            
            const dayName = document.createElement('div');
            dayName.style.fontWeight = 'bold';
            dayName.textContent = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i];
            
            const dayNumber = document.createElement('div');
            dayNumber.style.fontSize = '12px';
            dayNumber.style.color = '#666';
            dayNumber.textContent = `${dayDate.getDate()} ${this._getMonthName(dayDate.getMonth(), 'short')}`;
            
            dayCell.appendChild(dayName);
            dayCell.appendChild(dayNumber);
            weekHeader.appendChild(dayCell);
        }
        
        container.appendChild(weekHeader);
    }
    
    /**
     * Génère la section des événements toute la journée
     * @param {HTMLElement} container - Conteneur du calendrier
     * @param {Array} allDayEvents - Événements toute la journée
     * @param {Array} categories - Liste des catégories
     * @param {Date} startOfWeek - Date de début de la semaine
     * @private
     */
    _generateAllDayEventsSection(container, allDayEvents, categories, startOfWeek) {
        const allDayContainer = document.createElement('div');
        allDayContainer.style.display = 'grid';
        allDayContainer.style.gridTemplateColumns = '60px repeat(7, 1fr)';
        allDayContainer.style.borderBottom = '1px solid #e0e0e0';
        allDayContainer.style.padding = '5px 0';
        
        // Cellule de titre
        const titleCell = document.createElement('div');
        titleCell.style.padding = '5px';
        titleCell.style.fontWeight = 'bold';
        titleCell.style.fontSize = '12px';
        titleCell.textContent = 'Journée';
        allDayContainer.appendChild(titleCell);
        
        // Créer une cellule pour chaque jour
        for (let day = 0; day < 7; day++) {
            const dayCell = document.createElement('div');
            dayCell.style.padding = '2px';
            dayCell.style.borderRight = '1px solid #e0e0e0';
            
            // Date du jour
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + day);
            
            // Filtrer les événements pour ce jour
            const dayEvents = allDayEvents.filter(event => {
                const eventStartDate = new Date(event.startDate);
                const eventEndDate = new Date(event.endDate);
                
                // Ajuster les dates pour comparer uniquement les jours
                eventStartDate.setHours(0, 0, 0, 0);
                eventEndDate.setHours(23, 59, 59, 999);
                
                const currentDate = new Date(dayDate);
                currentDate.setHours(0, 0, 0, 0);
                
                return currentDate >= eventStartDate && currentDate <= eventEndDate;
            });
            
            // Ajouter les événements
            if (dayEvents.length > 0) {
                // Limiter le nombre d'événements affichés
                const maxEvents = 2;
                const visibleEvents = dayEvents.slice(0, maxEvents);
                
                visibleEvents.forEach(event => {
                    const category = this._findCategoryById(categories, event.categoryId);
                    
                    const eventElement = document.createElement('div');
                    eventElement.style.fontSize = '10px';
                    eventElement.style.padding = '2px';
                    eventElement.style.margin = '1px 0';
                    eventElement.style.whiteSpace = 'nowrap';
                    eventElement.style.overflow = 'hidden';
                    eventElement.style.textOverflow = 'ellipsis';
                    eventElement.style.borderRadius = '3px';
                    
                    if (this.printOptions.useColors && category) {
                        eventElement.style.backgroundColor = `${category.color}30`;
                        eventElement.style.borderLeft = `2px solid ${category.color}`;
                    } else {
                        eventElement.style.backgroundColor = '#f5f5f5';
                        eventElement.style.borderLeft = '2px solid #ccc';
                    }
                    
                    if (this.printOptions.showCategories && category) {
                        eventElement.textContent = `${category.emoji} ${event.title}`;
                    } else {
                        eventElement.textContent = event.title;
                    }
                    
                    dayCell.appendChild(eventElement);
                });
                
                // Indiquer s'il y a plus d'événements
                if (dayEvents.length > maxEvents) {
                    const moreIndicator = document.createElement('div');
                    moreIndicator.style.fontSize = '9px';
                    moreIndicator.style.textAlign = 'center';
                    moreIndicator.style.color = '#666';
                    moreIndicator.textContent = `+ ${dayEvents.length - maxEvents}`;
                    dayCell.appendChild(moreIndicator);
                }
            }
            
            allDayContainer.appendChild(dayCell);
        }
        
        container.appendChild(allDayContainer);
    }
    
    /**
     * Génère la grille des heures pour la vue hebdomadaire
     * @param {HTMLElement} container - Conteneur du calendrier
     * @param {Object} hourRange - Plage d'heures à afficher
     * @param {Date} startOfWeek - Date de début de la semaine
     * @param {Array} events - Liste des événements
     * @param {Array} categories - Liste des catégories
     * @private
     */
    _generateWeeklyHoursGrid(container, hourRange, startOfWeek, events, categories) {
        const weekGrid = document.createElement('div');
        weekGrid.style.display = 'grid';
        weekGrid.style.gridTemplateColumns = '60px repeat(7, 1fr)';
        
        // Ajouter les heures
        for (let hour = hourRange.start; hour < hourRange.end; hour++) {
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
                const dayColumn = document.createElement('div');
                dayColumn.style.borderRight = '1px solid #e0e0e0';
                dayColumn.style.borderBottom = '1px solid #e0e0e0';
                dayColumn.style.position = 'relative';
                dayColumn.style.height = '40px';
                
                // Date du jour
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + day);
                
                // Ajouter les événements qui correspondent à cette heure et ce jour
                this._addEventsToWeeklyHourCell(dayColumn, dayDate, hour, events, categories);
                
                weekGrid.appendChild(dayColumn);
            }
        }
        
        container.appendChild(weekGrid);
    }
    
    /**
     * Ajoute les événements à une cellule horaire de la vue hebdomadaire
     * @param {HTMLElement} cell - Cellule horaire
     * @param {Date} date - Date du jour
     * @param {number} hour - Heure
     * @param {Array} events - Liste des événements
     * @param {Array} categories - Liste des catégories
     * @private
     */
    _addEventsToWeeklyHourCell(cell, date, hour, events, categories) {
        // Filtrer les événements pour ce jour
        const dayEvents = events.filter(event => {
            // Date de début et de fin de l'événement
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            // Vérifier si c'est le même jour
            const sameDay = date.getFullYear() === eventStartDate.getFullYear() &&
                           date.getMonth() === eventStartDate.getMonth() &&
                           date.getDate() === eventStartDate.getDate();
            
            if (!sameDay) return false;
            
            // Heures de début et de fin
            let eventStartHour = 0;
            let eventEndHour = 23;
            
            // Si l'heure de début est spécifiée
            if (event.startTime) {
                const [startHours, startMinutes] = event.startTime.split(':').map(Number);
                eventStartHour = startHours + (startMinutes / 60);
            }
            
            // Si l'heure de fin est spécifiée
            if (event.endTime) {
                const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                eventEndHour = endHours + (endMinutes / 60);
            }
            
            // Vérifier si l'événement a lieu pendant cette heure
            return hour >= Math.floor(eventStartHour) && hour < Math.ceil(eventEndHour);
        });
        
        // Ajouter un événement à la cellule (en prenant le premier si plusieurs)
        if (dayEvents.length > 0) {
            const event = dayEvents[0];
            const category = this._findCategoryById(categories, event.categoryId);
            
            const eventElement = document.createElement('div');
            eventElement.style.position = 'absolute';
            eventElement.style.left = '2px';
            eventElement.style.right = '2px';
            eventElement.style.top = '2px';
            eventElement.style.bottom = '2px';
            eventElement.style.padding = '2px';
            eventElement.style.overflow = 'hidden';
            eventElement.style.fontSize = '9px';
            eventElement.style.borderRadius = '3px';
            
            // Appliquer les couleurs
            if (this.printOptions.useColors && category) {
                eventElement.style.backgroundColor = `${category.color}30`;
                eventElement.style.borderLeft = `2px solid ${category.color}`;
            } else {
                eventElement.style.backgroundColor = '#f5f5f5';
                eventElement.style.borderLeft = '2px solid #ccc';
            }
            
            // Titre de l'événement
            if (this.printOptions.showCategories && category) {
                eventElement.textContent = `${category.emoji} ${event.title}`;
            } else {
                eventElement.textContent = event.title;
            }
            
                            // Indicateur s'il y a plus d'événements
            if (dayEvents.length > 1) {
                const countIndicator = document.createElement('span');
                countIndicator.style.marginLeft = '3px';
                countIndicator.style.fontSize = '8px';
                countIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                countIndicator.style.borderRadius = '10px';
                countIndicator.style.padding = '0 3px';
                countIndicator.textContent = `+${dayEvents.length - 1}`;
                eventElement.appendChild(countIndicator);
            }
            
            cell.appendChild(eventElement);
        }
    }
    
    /**
     * Génère la liste des événements de la semaine
     * @param {HTMLElement} container - Conteneur d'impression
     * @param {Array} events - Liste des événements
     * @param {Array} categories - Liste des catégories
     * @param {Date} startOfWeek - Date de début de la semaine
     * @param {Date} endOfWeek - Date de fin de la semaine
     * @private
     */
    _generateWeekEventsListing(container, events, categories, startOfWeek, endOfWeek) {
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
            // Trier par date puis par heure
            weekEvents.sort((a, b) => {
                const dateA = new Date(a.startDate);
                const dateB = new Date(b.startDate);
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime();
                }
                return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
            });
            
            const eventsList = document.createElement('div');
            
            // Regrouper les événements par jour
            const eventsByDay = this._groupEventsByDay(weekEvents, startOfWeek);
            
            // Créer une section pour chaque jour
            Object.keys(eventsByDay).forEach(dateStr => {
                const dayDate = new Date(dateStr);
                const dayEvents = eventsByDay[dateStr];
                
                // Titre du jour
                const dayTitle = document.createElement('h4');
                dayTitle.style.marginTop = '15px';
                dayTitle.style.marginBottom = '5px';
                dayTitle.style.paddingBottom = '5px';
                dayTitle.style.borderBottom = '1px solid #ddd';
                
                const dayName = this._getDayOfWeekName(dayDate.getDay());
                const formattedDate = dayDate.toLocaleDateString('fr-FR');
                dayTitle.textContent = `${dayName} ${formattedDate}`;
                
                eventsList.appendChild(dayTitle);
                
                // Ajouter les événements du jour
                dayEvents.forEach(event => {
                    const eventItem = this._createEventItemForListing(event, categories);
                    eventsList.appendChild(eventItem);
                });
            });
            
            eventsSection.appendChild(eventsList);
        } else {
            const noEvents = document.createElement('p');
            noEvents.textContent = 'Aucun événement cette semaine.';
            eventsSection.appendChild(noEvents);
        }
        
        container.appendChild(eventsSection);
    }
    
    /**
     * Regroupe les événements par jour
     * @param {Array} events - Liste des événements
     * @param {Date} startDate - Date de référence
     * @returns {Object} - Événements regroupés par jour (format YYYY-MM-DD)
     * @private
     */
    _groupEventsByDay(events, startDate) {
        const eventsByDay = {};
        
        events.forEach(event => {
            const eventStartDate = new Date(event.startDate);
            const dateStr = this._formatYYYYMMDD(eventStartDate);
            
            if (!eventsByDay[dateStr]) {
                eventsByDay[dateStr] = [];
            }
            
            eventsByDay[dateStr].push(event);
        });
        
        return eventsByDay;
    }
    
    /**
     * Génère le contenu pour la vue quotidienne
     * @param {HTMLElement} container - Le conteneur d'impression
     * @param {boolean} [isSimplified=false] - Si true, génère une version simplifiée
     * @private
     */
    _generateDailyPrintContent(container, isSimplified = false) {
        // Récupérer les événements et les catégories depuis l'application
        const events = this._getEventsFromManager();
        const categories = this._getCategoriesFromManager();
        
        // Date actuelle
        const currentDate = this._getCurrentDateFromManager();
        
        // Titre
        const title = document.createElement('h2');
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        
        const dayOfWeekName = this._getDayOfWeekName(currentDate.getDay());
        const formattedDate = currentDate.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        title.textContent = `${dayOfWeekName} ${formattedDate}`;
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
        
        // Filtrer les événements pour ce jour
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayEvents = events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            return !(eventEndDate < dayStart || eventStartDate > dayEnd);
        });
        
        // Séparer les événements toute la journée des autres
        const allDayEvents = dayEvents.filter(event => event.isAllDay);
        const regularEvents = dayEvents.filter(event => !event.isAllDay);
        
        // Générer la section des événements toute la journée s'il y en a
        if (allDayEvents.length > 0) {
            this._generateAllDayEventsForDailyView(daySchedule, allDayEvents, categories);
        }
        
        // Générer la timeline (simplifiée ou complète)
        const hourRange = isSimplified ? { start: 9, end: 17 } : { start: 8, end: 20 };
        this._generateDailyTimeline(daySchedule, hourRange, regularEvents, categories);
        
        container.appendChild(daySchedule);
        
        // Liste détaillée des événements
        if (this.printOptions.showDescriptions && dayEvents.length > 0 && !isSimplified) {
            this._generateDailyEventsListing(container, dayEvents, categories);
        }
    }
    
    /**
     * Génère la section des événements toute la journée pour la vue quotidienne
     * @param {HTMLElement} container - Conteneur de l'agenda quotidien
     * @param {Array} allDayEvents - Événements toute la journée
     * @param {Array} categories - Liste des catégories
     * @private
     */
    _generateAllDayEventsForDailyView(container, allDayEvents, categories) {
        const allDayContainer = document.createElement('div');
        allDayContainer.style.padding = '10px';
        allDayContainer.style.borderBottom = '1px solid #e0e0e0';
        
        // Titre de la section
        const sectionTitle = document.createElement('div');
        sectionTitle.style.fontWeight = 'bold';
        sectionTitle.style.marginBottom = '5px';
        sectionTitle.textContent = 'Toute la journée';
        allDayContainer.appendChild(sectionTitle);
        
        // Liste des événements toute la journée
        const eventsList = document.createElement('div');
        
        allDayEvents.forEach(event => {
            const category = this._findCategoryById(categories, event.categoryId);
            
            const eventItem = document.createElement('div');
            eventItem.style.padding = '5px';
            eventItem.style.margin = '2px 0';
            eventItem.style.borderRadius = '4px';
            
            if (this.printOptions.useColors && category) {
                eventItem.style.backgroundColor = `${category.color}30`;
                eventItem.style.borderLeft = `3px solid ${category.color}`;
            } else {
                eventItem.style.backgroundColor = '#f5f5f5';
                eventItem.style.borderLeft = '3px solid #ccc';
            }
            
            // Titre de l'événement
            const eventTitle = document.createElement('div');
            eventTitle.style.fontWeight = 'bold';
            
            if (this.printOptions.showCategories && category) {
                eventTitle.textContent = `${category.emoji} ${event.title}`;
            } else {
                eventTitle.textContent = event.title;
            }
            
            eventItem.appendChild(eventTitle);
            
            // Lieu de l'événement
            if (this.printOptions.showLocations && event.location) {
                const eventLocation = document.createElement('div');
                eventLocation.style.fontSize = '12px';
                eventLocation.style.color = '#666';
                eventLocation.textContent = event.location;
                eventItem.appendChild(eventLocation);
            }
            
            eventsList.appendChild(eventItem);
        });
        
        allDayContainer.appendChild(eventsList);
        container.appendChild(allDayContainer);
    }
    
    /**
     * Génère la timeline pour la vue quotidienne
     * @param {HTMLElement} container - Conteneur de l'agenda quotidien
     * @param {Object} hourRange - Plage d'heures à afficher
     * @param {Array} events - Événements réguliers
     * @param {Array} categories - Liste des catégories
     * @private
     */
    _generateDailyTimeline(container, hourRange, events, categories) {
        const dayTimeline = document.createElement('div');
        dayTimeline.style.display = 'grid';
        dayTimeline.style.gridTemplateColumns = '60px 1fr';
        
        // Trier les événements par heure de début
        const sortedEvents = [...events].sort((a, b) => {
            const timeA = a.startTime || '00:00';
            const timeB = b.startTime || '00:00';
            return timeA.localeCompare(timeB);
        });
        
        // Créer une ligne pour chaque heure
        for (let hour = hourRange.start; hour < hourRange.end; hour++) {
            // Cellule de l'heure
            const hourCell = document.createElement('div');
            hourCell.style.padding = '10px 5px';
            hourCell.style.textAlign = 'right';
            hourCell.style.borderBottom = '1px solid #e0e0e0';
            hourCell.textContent = `${hour}:00`;
            dayTimeline.appendChild(hourCell);
            
            // Cellule des événements pour cette heure
            const eventsCell = document.createElement('div');
            eventsCell.style.position = 'relative';
            eventsCell.style.minHeight = '60px';
            eventsCell.style.borderBottom = '1px solid #e0e0e0';
            
            // Ajouter les événements pour cette heure
            this._addEventsToDailyHourCell(eventsCell, hour, sortedEvents, categories);
            
            dayTimeline.appendChild(eventsCell);
        }
        
        container.appendChild(dayTimeline);
    }
    
    /**
     * Ajoute les événements à une cellule horaire de la vue quotidienne
     * @param {HTMLElement} cell - Cellule horaire
     * @param {number} hour - Heure
     * @param {Array} events - Liste des événements
     * @param {Array} categories - Liste des catégories
     * @private
     */
    _addEventsToDailyHourCell(cell, hour, events, categories) {
        // Filtrer les événements pour cette heure
        const hourEvents = events.filter(event => {
            if (!event.startTime) return false;
            
            const [startHours, startMinutes] = event.startTime.split(':').map(Number);
            const startHour = startHours;
            
            const [endHours, endMinutes] = (event.endTime || '23:59').split(':').map(Number);
            const endHour = endHours;
            
            return (hour >= startHour && hour < endHour) || 
                   (hour === startHour && startMinutes < 30) || 
                   (hour === endHour - 1 && endMinutes > 30);
        });
        
        // Ajouter les événements à la cellule
        hourEvents.forEach((event, index) => {
            const category = this._findCategoryById(categories, event.categoryId);
            
            const eventElement = document.createElement('div');
            eventElement.style.position = 'absolute';
            eventElement.style.left = '5px';
            eventElement.style.right = '5px';
            
            // Calculer la position en fonction de l'heure
            if (event.startTime) {
                const [startHours, startMinutes] = event.startTime.split(':').map(Number);
                
                if (startHours === hour) {
                    // Positionner en fonction des minutes
                    const topOffset = (startMinutes / 60) * 100;
                    eventElement.style.top = `${topOffset}%`;
                } else if (startHours < hour) {
                    // Événement qui commence avant cette heure
                    eventElement.style.top = '0%';
                } else {
                    // Ne devrait pas arriver car filtré
                    eventElement.style.top = '0%';
                }
            } else {
                eventElement.style.top = '0%';
            }
            
            // Calculer la hauteur
            if (event.endTime && event.startTime) {
                const [startHours, startMinutes] = event.startTime.split(':').map(Number);
                const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                
                const startInMinutes = startHours * 60 + startMinutes;
                const endInMinutes = endHours * 60 + endMinutes;
                const hourInMinutes = hour * 60;
                
                // Limiter à cette cellule d'heure
                const visibleStartMinutes = Math.max(startInMinutes, hourInMinutes);
                const visibleEndMinutes = Math.min(endInMinutes, hourInMinutes + 60);
                
                const durationInMinutes = visibleEndMinutes - visibleStartMinutes;
                const heightPercentage = (durationInMinutes / 60) * 100;
                
                eventElement.style.height = `${heightPercentage}%`;
            } else {
                // Par défaut, occuper toute la cellule
                eventElement.style.height = '90%';
            }
            
            eventElement.style.padding = '3px';
            eventElement.style.overflow = 'hidden';
            eventElement.style.borderRadius = '4px';
            eventElement.style.fontSize = '12px';
            
            // Styles en fonction de la catégorie
            if (this.printOptions.useColors && category) {
                eventElement.style.backgroundColor = `${category.color}30`;
                eventElement.style.borderLeft = `3px solid ${category.color}`;
            } else {
                eventElement.style.backgroundColor = '#f5f5f5';
                eventElement.style.borderLeft = '3px solid #ccc';
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
                const timeElement = document.createElement('div');
                timeElement.style.fontSize = '10px';
                
                if (event.endTime) {
                    timeElement.textContent = `${event.startTime} - ${event.endTime}`;
                } else {
                    timeElement.textContent = event.startTime;
                }
                
                eventElement.appendChild(timeElement);
            }
            
            // Lieu de l'événement
            if (this.printOptions.showLocations && event.location) {
                const locationElement = document.createElement('div');
                locationElement.style.fontSize = '10px';
                locationElement.style.color = '#666';
                locationElement.style.whiteSpace = 'nowrap';
                locationElement.style.overflow = 'hidden';
                locationElement.style.textOverflow = 'ellipsis';
                locationElement.textContent = event.location;
                
                eventElement.appendChild(locationElement);
            }
            
            cell.appendChild(eventElement);
        });
    }
    
    /**
     * Génère la liste détaillée des événements du jour
     * @param {HTMLElement} container - Conteneur d'impression
     * @param {Array} events - Liste des événements
     * @param {Array} categories - Liste des catégories
     * @private
     */
    _generateDailyEventsListing(container, events, categories) {
        const eventsSection = document.createElement('div');
        eventsSection.style.marginTop = '30px';
        
        const eventsTitle = document.createElement('h3');
        eventsTitle.textContent = 'Détails des événements';
        eventsTitle.style.marginBottom = '10px';
        eventsSection.appendChild(eventsTitle);
        
        // Trier par heure de début
        const sortedEvents = [...events].sort((a, b) => {
            if (a.isAllDay && !b.isAllDay) return -1;
            if (!a.isAllDay && b.isAllDay) return 1;
            if (a.isAllDay && b.isAllDay) return 0;
            
            const timeA = a.startTime || '00:00';
            const timeB = b.startTime || '00:00';
            return timeA.localeCompare(timeB);
        });
        
        const eventsList = document.createElement('div');
        
        sortedEvents.forEach(event => {
            const eventItem = this._createEventItemForListing(event, categories);
            eventsList.appendChild(eventItem);
        });
        
        eventsSection.appendChild(eventsList);
        container.appendChild(eventsSection);
    }
    
    /**
     * Génère une légende des catégories
     * @param {HTMLElement} container - Conteneur d'impression
     * @param {Array} categories - Liste des catégories
     * @private
     */
    _generateCategoriesLegend(container, categories) {
        if (!categories || categories.length === 0) return;
        
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
    
    // ======================================================================
    // MÉTHODES UTILITAIRES
    // ======================================================================
    
    /**
     * Obtient la liste des événements depuis le gestionnaire
     * @returns {Array} - Liste des événements
     * @private
     */
    _getEventsFromManager() {
        const dataManager = window.app?.categoryManager?.dataManager;
        return dataManager ? dataManager.getAllEvents() : [];
    }
    
    /**
     * Obtient la liste des catégories depuis le gestionnaire
     * @returns {Array} - Liste des catégories
     * @private
     */
    _getCategoriesFromManager() {
        const dataManager = window.app?.categoryManager?.dataManager;
        return dataManager ? dataManager.getAllCategories() : [];
    }
    
    /**
     * Obtient la date actuelle depuis le gestionnaire de calendrier
     * @returns {Date} - Date actuelle
     * @private
     */
    _getCurrentDateFromManager() {
        const calendarManager = window.app?.calendarManager;
        return calendarManager ? calendarManager.currentDate : new Date();
    }
    
    /**
     * Trouve une catégorie par son ID
     * @param {Array} categories - Liste des catégories
     * @param {string} categoryId - ID de la catégorie
     * @returns {Object|null} - Catégorie trouvée ou null
     * @private
     */
    _findCategoryById(categories, categoryId) {
        if (!categoryId || !categories) return null;
        return categories.find(category => category.id === categoryId) || null;
    }
    
    /**
     * Obtient les événements pour un jour spécifique
     * @param {Array} events - Liste des événements
     * @param {Date} date - Date du jour
     * @returns {Array} - Événements du jour
     * @private
     */
    _getEventsForDay(events, date) {
        if (!events || !Array.isArray(events)) return [];
        
        return events.filter(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);
            
            // Ajuster les dates pour comparer uniquement les jours
            const eventStart = new Date(eventStartDate);
            eventStart.setHours(0, 0, 0, 0);
            
            const eventEnd = new Date(eventEndDate);
            eventEnd.setHours(23, 59, 59, 999);
            
            const dayDate = new Date(date);
            dayDate.setHours(0, 0, 0, 0);
            
            return dayDate >= eventStart && dayDate <= eventEnd;
        });
    }
    
    /**
     * Obtient le nom du mois
     * @param {number} monthIndex - Index du mois (0-11)
     * @param {string} [format='long'] - Format ('long' ou 'short')
     * @returns {string} - Nom du mois
     * @private
     */
    _getMonthName(monthIndex, format = 'long') {
        const months = {
            long: [
                'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ],
            short: [
                'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
            ]
        };
        
        return months[format][monthIndex];
    }
    
    /**
     * Obtient le nom du jour de la semaine
     * @param {number} dayIndex - Index du jour (0-6, 0 = dimanche)
     * @param {string} [format='long'] - Format ('long' ou 'short')
     * @returns {string} - Nom du jour
     * @private
     */
    _getDayOfWeekName(dayIndex, format = 'long') {
        const days = {
            long: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
            short: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        };
        
        return days[format][dayIndex];
    }
    
    /**
     * Obtient le début de la semaine pour une date donnée
     * @param {Date} date - Date de référence
     * @param {number} [firstDayOfWeek=1] - Premier jour de la semaine (0-6, 0 = dimanche)
     * @returns {Date} - Date du début de la semaine
     * @private
     */
    _getStartOfWeek(date, firstDayOfWeek = 1) {
        if (DateUtils && typeof DateUtils.getStartOfWeek === 'function') {
            return DateUtils.getStartOfWeek(date, firstDayOfWeek);
        }
        
        // Implémentation de secours
        const day = date.getDay();
        const diff = (day < firstDayOfWeek ? 7 : 0) + day - firstDayOfWeek;
        const result = new Date(date);
        result.setDate(date.getDate() - diff);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    
    /**
     * Obtient la fin de la semaine pour une date donnée
     * @param {Date} startOfWeek - Date du début de la semaine
     * @returns {Date} - Date de fin de la semaine
     * @private
     */
    _getEndOfWeek(startOfWeek) {
        if (DateUtils && typeof DateUtils.getEndOfWeek === 'function') {
            return DateUtils.getEndOfWeek(startOfWeek);
        }
        
        // Implémentation de secours
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek;
    }
    
    /**
     * Formate une date au format YYYY-MM-DD
     * @param {Date} date - Date à formater
     * @returns {string} - Date formatée
     * @private
     */
    _formatYYYYMMDD(date) {
        if (DateUtils && typeof DateUtils.formatDate === 'function') {
            return DateUtils.formatDate(date);
        }
        
        // Implémentation de secours
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}