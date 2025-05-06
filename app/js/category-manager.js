/**
 * @fileoverview Gestionnaire des catégories d'événements
 * Responsable de la gestion du cycle de vie des catégories et de leur rendu dans l'interface
 * @module CategoryManager
 */

/**
 * Classe gestionnaire des catégories d'événements
 * Gère la création, modification, suppression et l'affichage des catégories dans l'interface
 */
export class CategoryManager {
    /**
     * Crée une instance du gestionnaire de catégories
     * @param {DataManager} dataManager - Instance du gestionnaire de données
     */
    constructor(dataManager) {
        /**
         * Référence au gestionnaire de données
         * @type {DataManager}
         * @private
         */
        this.dataManager = dataManager;
        
        /**
         * Éléments DOM pour la navigation des catégories
         * @type {HTMLElement}
         * @private
         */
        this.categoriesNav = document.getElementById('categories-nav');
        
        /**
         * Éléments DOM pour la liste des catégories dans la modal
         * @type {HTMLElement}
         * @private
         */
        this.categoryList = document.getElementById('category-list');
        
        /**
         * Éléments DOM pour le sélecteur de catégories dans le formulaire d'événement
         * @type {HTMLSelectElement}
         * @private
         */
        this.categorySelect = document.getElementById('event-category');
        
        /**
         * Modal de gestion des catégories
         * @type {HTMLElement}
         * @private
         */
        this.categoriesModal = document.getElementById('categories-modal');
        
        /**
         * Bouton d'ajout de catégorie
         * @type {HTMLElement}
         * @private
         */
        this.addCategoryBtn = document.getElementById('add-category');
        
        /**
         * Bouton de mise à jour de catégorie
         * @type {HTMLElement}
         * @private
         */
        this.updateCategoryBtn = document.getElementById('update-category');
        
        /**
         * Champs du formulaire de catégorie
         * @type {HTMLInputElement}
         * @private
         */
        this.categoryNameInput = document.getElementById('category-name');
        this.categoryEmojiInput = document.getElementById('category-emoji');
        this.categoryColorInput = document.getElementById('category-color');
        
        /**
         * ID de la catégorie en cours d'édition
         * @type {string|null}
         * @private
         */
        this.currentEditingCategoryId = null;
        
        // Initialiser les composants de l'interface
        this.initEmojiPicker();
        this.initEventListeners();
    }
    
    /**
     * Initialise tous les écouteurs d'événements liés aux catégories
     * @private
     */
    initEventListeners() {
        // Écouteur pour ouvrir la modal de gestion des catégories
        const addCategoryButton = document.getElementById('add-category-btn');
        if (addCategoryButton) {
            addCategoryButton.addEventListener('click', () => this.openCategoriesModal());
        }
        
        // Écouteurs pour la modal de gestion des catégories
        if (this.categoriesModal) {
            // Fermer la modal
            const closeBtn = this.categoriesModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal());
            }
            
            // Ajouter une nouvelle catégorie
            if (this.addCategoryBtn) {
                this.addCategoryBtn.addEventListener('click', () => this.addCategory());
            }
            
            // Mettre à jour une catégorie existante
            if (this.updateCategoryBtn) {
                this.updateCategoryBtn.addEventListener('click', () => this.updateCategory());
            }
            
            // Clic en dehors de la modal pour la fermer
            this.categoriesModal.addEventListener('click', (e) => {
                if (e.target === this.categoriesModal) {
                    this.closeModal();
                }
            });
        }
        
        // Écouteur pour les événements personnalisés de mise à jour des catégories
        window.addEventListener('categories:updated', () => {
            this.refreshAllCategoryViews();
        });
    }
    
    /**
     * Ferme la modal de gestion des catégories
     * @private
     */
    closeModal() {
        if (this.categoriesModal) {
            this.categoriesModal.classList.remove('active');
        }
    }
    
    /**
     * Initialise le sélecteur d'emoji pour les catégories
     * @private
     */
    initEmojiPicker() {
        const emojiPickerBtn = document.getElementById('emoji-picker-button');
        const emojiPicker = document.getElementById('emoji-picker');
        
        if (!emojiPickerBtn || !emojiPicker) return;
        
        // Liste des emojis populaires organisés par thèmes
        const popularEmojis = [
            // Émojis généraux d'expressions
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
            '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳',
            
            // Bureau et calendrier
            '📊', '📅', '📆', '📈', '📉', '📋', '📌', '📍', '📎', '📏', '📐', '📑', '📒', '📓', '📔', '📕',
            '📚', '📖', '📙', '📘', '📗', '📂', '📁', '🗂️', '📇', '🗃️', '🗄️', '🖋️', '✒️', '✏️', '📝', '💼',
            
            // Lieux et bâtiments
            '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '⛪',
            '🕌', '🕍', '⛩️', '🕋', '⛲', '⛺', '🏕️', '🏙️', '🌆', '🌇', '🌃', '🌉', '🏛️', '🏚️', '🏗️', '🧱',
            
            // Transport
            '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴',
            '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚋', '🚌', '🚍', '🚎', '🚏', '🚐', '🛻', '🛺', '🚖',
            
            // Voyage et destinations
            '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🚠', '🚡', '🚀', '🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏝️',
            '🏜️', '🏔️', '⛰️', '🌋', '🗻', '🏞️', '🏖️', '🏟️', '🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🌄', '🌅',
            
            // Sports et activités physiques
            '⚽', '⚾', '🏀', '🏐', '🏈', '🏉', '🎾', '🎳', '🏏', '🏑', '🏒', '🏓', '🏸', '⛳', '🏌️', '🥊',
            '🥋', '🥅', '⛸️', '🎣', '🤿', '🎽', '🛹', '🛼', '🛷', '⛷️', '🏂', '🪂', '🏄‍♂️', '🏄‍♀️', '🏊‍♂️', '🏊‍♀️',
            
            // Activités de loisirs et divertissement
            '🎮', '🎰', '🎲', '🧩', '♟️', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸',
            '🎻', '🎯', '🎪', '🎟️', '🎫', '🎡', '🎢', '🎠', '🏖️', '🏕️', '📺', '📱', '🎥', '🎞️', '📽️', '📹',
            
            // Affaires et finances
            '💼', '🧳', '💰', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💹', '📝', '📜', '📄', '📰', '🗞️',
            '📊', '📈', '📉', '💻', '🖥️', '🖨️', '📱', '📲', '💿', '💾', '📀', '🧮', '📋', '📌', '📍', '📎',
            
            // Métiers et professions
            '👩‍💼', '👨‍💼', '👩‍🏫', '👨‍🏫', '👩‍⚕️', '👨‍⚕️', '👩‍🔬', '👨‍🔬', '👩‍🚀', '👨‍🚀', '👩‍🚒', '👨‍🚒',
            '👨‍🍳', '👩‍🍳', '👨‍🌾', '👩‍🌾', '👨‍⚖️', '👩‍⚖️', '👨‍🏭', '👩‍🏭', '👨‍🔧', '👩‍🔧', '👮‍♂️', '👮‍♀️',
            
            // Golf spécifiquement
            '🏌️‍♂️', '🏌️‍♀️', '⛳', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏍️', '🏎️', '🚵‍♂️', '🚵‍♀️', '🏋️‍♂️', '🏋️‍♀️', '🎿',
            
            // Nourriture et boissons
            '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
            '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐',
            
            // Animaux et nature
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
            '🌱', '🌲', '🌳', '🌴', '🌵', '🌷', '🌹', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚',
            
            // Technologie
            '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷',
            '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️',
            
            // Météo et saisons
            '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️',
            '🌫️', '🌊', '💧', '💦', '☔', '☂️', '🌂', '⚡', '❄️', '☃️', '⛄', '🔥', '💥', '✨', '🌟', '⭐',
            
            // Festivités et célébrations
            '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🎈', '🎉', '🎊', '🎁', '🎀', '🎄', '🎋', '🎍', '🎑',
            '🎎', '🎏', '🎐', '🏮', '🪔', '✨', '🎇', '🎆', '🧨', '🎃', '👻', '🎭', '🪩', '🪅', '🪄', '🎪',
            
            // Symboles et signaux
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
            '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
            
            // Art et musique
            '🎨', '🖼️', '🎭', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '🧩',
            '🎮', '👾', '🎯', '🎺', '🎻', '👨‍🎤', '👩‍🎤', '🧑‍🎤', '🎵', '🎶', '🎙️', '🎚️', '🎛️', '🎞️', '📽️', '🎬'
        ];
        
        // Événement pour afficher/masquer le sélecteur d'emoji
        emojiPickerBtn.addEventListener('click', () => {
            // Vider et recréer le contenu du picker
            emojiPicker.innerHTML = '';
            
            // Remplir le sélecteur avec les emojis
            popularEmojis.forEach(emoji => {
                const emojiOption = document.createElement('div');
                emojiOption.className = 'emoji-item';
                emojiOption.textContent = emoji;
                emojiOption.addEventListener('click', () => {
                    this.categoryEmojiInput.value = emoji;
                    emojiPicker.style.display = 'none';
                });
                emojiPicker.appendChild(emojiOption);
            });
            
            // Afficher ou masquer le sélecteur
            emojiPicker.style.display = emojiPicker.style.display === 'grid' ? 'none' : 'grid';
        });
        
        // Fermer le sélecteur d'emoji en cliquant ailleurs
        document.addEventListener('click', (event) => {
            if (!emojiPickerBtn.contains(event.target) && !emojiPicker.contains(event.target)) {
                emojiPicker.style.display = 'none';
            }
        });
    }
    
    /**
     * Ouvre la modal de gestion des catégories
     * Affiche la liste des catégories existantes
     */
    openCategoriesModal() {
        if (!this.categoriesModal) return;
        
        // Réinitialiser le formulaire
        this.resetCategoryForm();
        
        // Afficher la modal
        this.categoriesModal.classList.add('active');
        
        // Afficher la liste des catégories
        this.renderCategoryList();
    }
    
    /**
     * Réinitialise le formulaire de catégorie
     * @private
     */
    resetCategoryForm() {
        if (!this.categoryNameInput || !this.categoryEmojiInput || !this.categoryColorInput) return;
        
        this.categoryNameInput.value = '';
        this.categoryEmojiInput.value = '';
        this.categoryColorInput.value = '#4caf50';
        
        // Cacher le bouton de mise à jour et afficher le bouton d'ajout
        if (this.addCategoryBtn && this.updateCategoryBtn) {
            this.addCategoryBtn.style.display = 'inline-flex';
            this.updateCategoryBtn.style.display = 'none';
        }
        
        // Réinitialiser l'ID de la catégorie en cours d'édition
        this.currentEditingCategoryId = null;
    }
    
    /**
     * Ouvre le formulaire d'édition d'une catégorie
     * @param {string} categoryId - L'identifiant de la catégorie à éditer
     */
    openEditCategoryForm(categoryId) {
        try {
            // Récupérer la catégorie
            const category = this.dataManager.getCategoryById(categoryId);
            
            if (!this.categoryNameInput || !this.categoryEmojiInput || !this.categoryColorInput) {
                console.error('Éléments du formulaire non trouvés');
                return;
            }
            
            // Mettre à jour l'ID de la catégorie en cours d'édition
            this.currentEditingCategoryId = categoryId;
            
            // Remplir le formulaire avec les données de la catégorie
            this.categoryNameInput.value = category.name || '';
            this.categoryEmojiInput.value = category.emoji || '';
            this.categoryColorInput.value = category.color || '#4caf50';
            
            // Afficher le bouton de mise à jour et cacher le bouton d'ajout
            if (this.addCategoryBtn && this.updateCategoryBtn) {
                this.addCategoryBtn.style.display = 'none';
                this.updateCategoryBtn.style.display = 'inline-flex';
            }
            
            // Faire défiler jusqu'au formulaire
            this.categoryNameInput.scrollIntoView({ behavior: 'smooth' });
            
            // Mettre le focus sur le champ de nom
            this.categoryNameInput.focus();
        } catch (error) {
            this.handleError('Erreur lors de l\'ouverture du formulaire d\'édition', error);
        }
    }
    
    /**
     * Ajoute une nouvelle catégorie
     * @returns {boolean} - Indique si l'ajout a réussi
     */
    addCategory() {
        try {
            // Valider les données du formulaire
            if (!this.validateCategoryForm()) {
                return false;
            }
            
            // Récupérer les données du formulaire
            const categoryData = this.getCategoryFormData();
            
            // Ajouter la catégorie via le gestionnaire de données
            const newCategory = this.dataManager.addCategory(categoryData);
            
            // Notifier l'utilisateur
            this.showNotification(`Catégorie "${newCategory.name}" ajoutée avec succès`);
            
            // Déclencher l'événement de mise à jour
            this.triggerCategoriesUpdatedEvent();
            
            // Réinitialiser le formulaire
            this.resetCategoryForm();
            
            return true;
        } catch (error) {
            this.handleError('Erreur lors de l\'ajout de la catégorie', error);
            return false;
        }
    }
    
    /**
     * Met à jour une catégorie existante
     * @returns {boolean} - Indique si la mise à jour a réussi
     */
    updateCategory() {
        try {
            // Vérifier si une catégorie est en cours d'édition
            if (!this.currentEditingCategoryId) {
                throw new Error('Aucune catégorie en cours d\'édition');
            }
            
            // Valider les données du formulaire
            if (!this.validateCategoryForm()) {
                return false;
            }
            
            // Récupérer les données du formulaire
            const categoryData = this.getCategoryFormData();
            
            // Mettre à jour la catégorie via le gestionnaire de données
            const updatedCategory = this.dataManager.updateCategory(this.currentEditingCategoryId, categoryData);
            
            // Notifier l'utilisateur
            this.showNotification(`Catégorie "${updatedCategory.name}" mise à jour avec succès`);
            
            // Déclencher l'événement de mise à jour
            this.triggerCategoriesUpdatedEvent();
            
            // Réinitialiser le formulaire
            this.resetCategoryForm();
            
            return true;
        } catch (error) {
            this.handleError('Erreur lors de la mise à jour de la catégorie', error);
            return false;
        }
    }
    
    /**
     * Récupère les données du formulaire de catégorie
     * @returns {Object} Données de la catégorie
     * @private
     */
    getCategoryFormData() {
        return {
            name: this.categoryNameInput.value.trim(),
            emoji: this.categoryEmojiInput.value.trim(),
            color: this.categoryColorInput.value
        };
    }
    
    /**
     * Supprime une catégorie
     * @param {string} categoryId - L'identifiant de la catégorie à supprimer
     * @returns {boolean} - Indique si la suppression a réussi
     */
    deleteCategory(categoryId) {
        try {
            // Demander confirmation
            const confirmDelete = confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Les événements associés perdront leur catégorie.');
            
            if (!confirmDelete) {
                return false;
            }
            
            // Récupérer la catégorie pour l'affichage
            const categoryToDelete = this.dataManager.getCategoryById(categoryId);
            const categoryName = categoryToDelete.name;
            
            // Supprimer la catégorie via le gestionnaire de données
            this.dataManager.deleteCategory(categoryId);
            
            // Notifier l'utilisateur
            this.showNotification(`Catégorie "${categoryName}" supprimée avec succès`);
            
            // Si nous avions un filtre actif sur cette catégorie, le réinitialiser
            this.resetFilterIfCategoryDeleted(categoryId);
            
            // Déclencher l'événement de mise à jour
            this.triggerCategoriesUpdatedEvent();
            
            return true;
        } catch (error) {
            this.handleError('Erreur lors de la suppression de la catégorie', error);
            return false;
        }
    }
    
    /**
     * Réinitialise le filtre si la catégorie supprimée était utilisée comme filtre
     * @param {string} categoryId - L'identifiant de la catégorie supprimée
     * @private
     */
    resetFilterIfCategoryDeleted(categoryId) {
        const uiManager = window.app?.uiManager;
        if (uiManager && uiManager.getCategoryFilterId() === categoryId) {
            window.dispatchEvent(new CustomEvent('categories:resetFilter'));
        }
    }
    
    /**
     * Valide les données du formulaire de catégorie
     * @returns {boolean} - Indique si les données sont valides
     * @private
     */
    validateCategoryForm() {
        // Vérifier si les éléments du formulaire existent
        if (!this.categoryNameInput || !this.categoryEmojiInput || !this.categoryColorInput) {
            console.error('Éléments du formulaire non trouvés');
            return false;
        }
        
        // Vérifier si le nom est renseigné
        if (!this.categoryNameInput.value.trim()) {
            alert('Veuillez saisir un nom pour la catégorie');
            this.categoryNameInput.focus();
            return false;
        }
        
        // Vérifier si l'emoji est renseigné
        if (!this.categoryEmojiInput.value.trim()) {
            alert('Veuillez choisir un emoji pour la catégorie');
            this.categoryEmojiInput.focus();
            return false;
        }
        
        // Vérifier si la couleur est renseignée
        if (!this.categoryColorInput.value) {
            alert('Veuillez choisir une couleur pour la catégorie');
            this.categoryColorInput.focus();
            return false;
        }
        
        return true;
    }
    
    /**
     * Affiche la liste des catégories dans la modal
     * @private
     */
    renderCategoryList() {
        if (!this.categoryList) return;
        
        // Vider la liste
        this.categoryList.innerHTML = '';
        
        // Récupérer les catégories
        const categories = this.dataManager.getAllCategories();
        
        // Afficher un message si aucune catégorie
        if (categories.length === 0) {
            this.categoryList.innerHTML = '<p>Aucune catégorie disponible.</p>';
            return;
        }
        
        // Créer le conteneur de grille
        const categoryItems = document.createElement('div');
        categoryItems.className = 'categories-grid';
        
        // Créer une carte pour chaque catégorie
        categories.forEach(category => {
            const categoryItem = this.createCategoryListItem(category);
            categoryItems.appendChild(categoryItem);
        });
        
        // Ajouter la grille à la liste
        this.categoryList.appendChild(categoryItems);
    }
    
    /**
     * Crée un élément de liste pour une catégorie
     * @param {Object} category - La catégorie à afficher
     * @returns {HTMLElement} - L'élément de liste pour la catégorie
     * @private
     */
    createCategoryListItem(category) {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.dataset.categoryId = category.id;
        
        // Couleur et emoji
        const categoryColor = document.createElement('div');
        categoryColor.className = 'category-color';
        categoryColor.style.backgroundColor = category.color;
        categoryColor.textContent = category.emoji;
        
        // Informations
        const categoryInfo = document.createElement('div');
        categoryInfo.style.flex = '1';
        
        const categoryName = document.createElement('div');
        categoryName.className = 'category-name';
        categoryName.textContent = category.name;
        
        categoryInfo.appendChild(categoryName);
        
        // Boutons d'action
        const actionsContainer = document.createElement('div');
        actionsContainer.style.display = 'flex';
        actionsContainer.style.gap = '5px';
        
        // Bouton d'édition
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-icon';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Modifier';
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openEditCategoryForm(category.id);
        });
        
        // Bouton de suppression
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.title = 'Supprimer';
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.deleteCategory(category.id);
        });
        
        actionsContainer.appendChild(editBtn);
        actionsContainer.appendChild(deleteBtn);
        
        // Assembler l'élément
        categoryItem.appendChild(categoryColor);
        categoryItem.appendChild(categoryInfo);
        categoryItem.appendChild(actionsContainer);
        
        return categoryItem;
    }
    
    /**
     * Affiche les catégories dans la navigation latérale
     */
    renderCategoriesNav() {
        if (!this.categoriesNav) return;
        
        // Vider la navigation
        this.categoriesNav.innerHTML = '';
        
        // Ajouter l'option "Tous les événements"
        this.addAllEventsOption();
        
        // Récupérer les catégories
        const categories = this.dataManager.getAllCategories();
        
        // Afficher un message si aucune catégorie
        if (categories.length === 0) {
            const noCategories = document.createElement('div');
            noCategories.className = 'nav-item disabled';
            noCategories.textContent = 'Aucune catégorie';
            this.categoriesNav.appendChild(noCategories);
            return;
        }
        
        // Créer un élément de navigation pour chaque catégorie
        categories.forEach(category => {
            const navItem = this.createCategoryNavItem(category);
            this.categoriesNav.appendChild(navItem);
        });
    }
    
    /**
     * Ajoute l'option "Tous les événements" à la navigation des catégories
     * @private
     */
    addAllEventsOption() {
        const allEventsItem = document.createElement('div');
        allEventsItem.className = 'nav-item';
        allEventsItem.dataset.categoryId = 'all';
        
        // Icône pour "Tous les événements"
        const allEventsIcon = document.createElement('span');
        allEventsIcon.style.marginRight = '10px';
        allEventsIcon.innerHTML = '<i class="fas fa-calendar-alt"></i>';
        
        // Texte
        const allEventsName = document.createElement('span');
        allEventsName.textContent = 'Tous les événements';
        
        // Assembler l'élément
        allEventsItem.appendChild(allEventsIcon);
        allEventsItem.appendChild(allEventsName);
        
        // Événement de clic pour réinitialiser le filtre
        allEventsItem.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('categories:resetFilter'));
        });
        
        // Marquer comme actif si aucun filtre n'est appliqué
        const uiManager = window.app?.uiManager;
        if (!uiManager || !uiManager.isCategoryFilterActive()) {
            allEventsItem.classList.add('active');
        }
        
        this.categoriesNav.appendChild(allEventsItem);
    }
    
    /**
     * Crée un élément de navigation pour une catégorie
     * @param {Object} category - La catégorie à afficher
     * @returns {HTMLElement} - L'élément de navigation
     * @private
     */
    createCategoryNavItem(category) {
        const navItem = document.createElement('div');
        navItem.className = 'nav-item';
        navItem.dataset.categoryId = category.id;
        
        // Vérifier si cette catégorie est le filtre actif
        const uiManager = window.app?.uiManager;
        if (uiManager && uiManager.isCategoryFilterActive() && 
            uiManager.getCategoryFilterId() === category.id) {
            navItem.classList.add('active');
        }
        
        // Emoji
        const categoryEmoji = document.createElement('span');
        categoryEmoji.style.marginRight = '10px';
        categoryEmoji.textContent = category.emoji;
        
        // Indicateur de couleur
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'color-indicator';
        colorIndicator.style.display = 'inline-block';
        colorIndicator.style.width = '8px';
        colorIndicator.style.height = '8px';
        colorIndicator.style.borderRadius = '50%';
        colorIndicator.style.backgroundColor = category.color;
        colorIndicator.style.marginRight = '5px';
        
        // Nom
        const categoryName = document.createElement('span');
        categoryName.textContent = category.name;
        
        // Assembler l'élément
        navItem.appendChild(categoryEmoji);
        navItem.appendChild(colorIndicator);
        navItem.appendChild(categoryName);
        
        // Événement de clic pour filtrer les événements
        navItem.addEventListener('click', () => {
            this.triggerCategoryFilterEvent(category.id);
        });
        
        return navItem;
    }
    
    /**
     * Déclenche un événement pour filtrer les événements par catégorie
     * @param {string} categoryId - L'identifiant de la catégorie
     * @private
     */
    triggerCategoryFilterEvent(categoryId) {
        window.dispatchEvent(new CustomEvent('categories:filter', {
            detail: { categoryId: categoryId }
        }));
    }
    
    /**
     * Met à jour le sélecteur de catégories dans le formulaire d'événement
     */
    updateCategorySelect() {
        if (!this.categorySelect) return;
        
        // Sauvegarder la valeur actuelle
        const currentValue = this.categorySelect.value;
        
        // Vider le sélecteur
        this.categorySelect.innerHTML = '';
        
        // Récupérer les catégories
        const categories = this.dataManager.getAllCategories();
        
        // Option vide
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Sélectionner une catégorie';
        this.categorySelect.appendChild(emptyOption);
        
        // Afficher un message si aucune catégorie
        if (categories.length === 0) {
            const noOption = document.createElement('option');
            noOption.value = '';
            noOption.textContent = 'Aucune catégorie disponible';
            noOption.disabled = true;
            this.categorySelect.appendChild(noOption);
            return;
        }
        
        // Créer une option pour chaque catégorie
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.emoji} ${category.name}`;
            this.categorySelect.appendChild(option);
        });
        
        // Restaurer la valeur sélectionnée si possible
        if (currentValue) {
            // Vérifier si la catégorie existe toujours
            const categoryStillExists = categories.some(cat => cat.id === currentValue);
            if (categoryStillExists) {
                this.categorySelect.value = currentValue;
            }
        }
    }
    
    /**
     * Rend une liste des catégories dans un élément HTML
     * @param {HTMLElement} container - L'élément conteneur où afficher les catégories
     */
    renderCategories(container) {
        if (!container) return;
        
        // Vider le conteneur
        container.innerHTML = '';
        
        // Récupérer les catégories
        const categories = this.dataManager.getAllCategories();
        
        // Afficher un message si aucune catégorie
        if (categories.length === 0) {
            container.innerHTML = '<p>Aucune catégorie disponible.</p>';
            return;
        }
        
        // Créer une carte pour chaque catégorie
        categories.forEach(category => {
            const categoryItem = this.createCategoryItem(category);
            container.appendChild(categoryItem);
        });
    }
    
    /**
     * Crée un élément pour une catégorie
     * @param {Object} category - La catégorie à afficher
     * @returns {HTMLElement} - L'élément de catégorie
     * @private
     */
    createCategoryItem(category) {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.dataset.categoryId = category.id;
        
        // Couleur et emoji
        const categoryColor = document.createElement('div');
        categoryColor.className = 'category-color';
        categoryColor.style.backgroundColor = category.color;
        categoryColor.textContent = category.emoji;
        
        // Nom
        const categoryName = document.createElement('div');
        categoryName.className = 'category-name';
        categoryName.textContent = category.name;
        
        // Assembler l'élément
        categoryItem.appendChild(categoryColor);
        categoryItem.appendChild(categoryName);
        
        // Événement de clic pour filtrer les événements
        categoryItem.addEventListener('click', () => {
            this.triggerCategoryFilterEvent(category.id);
        });
        
        return categoryItem;
    }
    
    /**
     * Met à jour toutes les vues des catégories
     * @private
     */
    refreshAllCategoryViews() {
        this.renderCategories();
        this.renderCategoriesNav();
        this.updateCategorySelect();
        this.renderCategoryList();
    }
    
    /**
     * Déclenche l'événement de mise à jour des catégories
     * @private
     */
    triggerCategoriesUpdatedEvent() {
        window.dispatchEvent(new CustomEvent('categories:updated'));
    }
    
    /**
     * Gère les erreurs de manière standardisée
     * @param {string} message - Message d'erreur pour l'utilisateur
     * @param {Error} error - L'objet d'erreur
     * @private
     */
    handleError(message, error) {
        console.error(`${message}:`, error);
        this.showNotification(message, true);
    }
    
    /**
     * Affiche une notification à l'utilisateur
     * @param {string} message - Message à afficher
     * @param {boolean} isError - Indique si c'est une erreur
     * @private
     */
    showNotification(message, isError = false) {
        const notificationManager = window.app?.notificationManager;
        if (notificationManager) {
            notificationManager.showNotification(message, isError);
        } else {
            // Fallback si le gestionnaire de notifications n'est pas disponible
            console.log(message);
            if (isError) {
                alert(message);
            }
        }
    }
    
    /**
     * Obtient le nombre total de catégories
     * @returns {number} - Le nombre de catégories
     */
    getCategoriesCount() {
        return this.dataManager.getAllCategories().length;
    }
    
    /**
     * Obtient une catégorie par son ID
     * @param {string} categoryId - L'identifiant de la catégorie
     * @returns {Object|null} - La catégorie ou null si non trouvée
     */
    getCategoryById(categoryId) {
        try {
            return this.dataManager.getCategoryById(categoryId);
        } catch (error) {
            console.error('Erreur lors de la récupération de la catégorie:', error);
            return null;
        }
    }
}