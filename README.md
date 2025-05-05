# SuperCalendar

![SuperCalendar Logo](./app/assets/icon.png)

Une application de calendrier moderne et personnalisable basée sur Electron, vous permettant de gérer efficacement vos événements et rendez-vous avec une interface élégante et intuitive.

## ✨ Fonctionnalités

- **Vues multiples**: Annuelle, mensuelle, hebdomadaire et quotidienne
- **Gestion des catégories**: Organisez vos événements par catégories personnalisables avec émojis et couleurs
- **Interface responsive**: S'adapte à tous les écrans, du mobile au grand écran
- **Thème clair/sombre**: Personnalisez l'apparence de l'application selon vos préférences
- **Importation/Exportation**: Compatible avec les formats JSON et iCal
- **Impression et export PDF**: Générez des documents imprimables ou des PDF de vos calendriers
- **Interface intuitive**: Facile à prendre en main, avec des raccourcis clavier pour une productivité maximale
- **Compatible multi-plateformes**: Fonctionne sur Windows, macOS et Linux

## 📥 Installation

### Utilisateurs finaux

Téléchargez la dernière version de SuperCalendar pour votre système d'exploitation:

- [Windows (.exe)](https://github.com/username/SuperCalendar/releases/latest)
- [macOS (.dmg)](https://github.com/username/SuperCalendar/releases/latest)
- [Linux (.AppImage, .deb)](https://github.com/username/SuperCalendar/releases/latest)

### Pour les développeurs

#### Prérequis

- [Node.js](https://nodejs.org/) (v16 ou supérieure)
- [npm](https://www.npmjs.com/) (v8 ou supérieure)
- [Git](https://git-scm.com/)

#### Installation

```bash
# Cloner le dépôt
git clone https://github.com/username/SuperCalendar.git

# Accéder au répertoire du projet
cd SuperCalendar

# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm start
```

## 🔧 Structure du projet

```
SuperCalendar/
├── app/                      # Code source de l'application web
│   ├── css/                  # Feuilles de style CSS
│   ├── js/                   # Scripts JavaScript
│   │   ├── utils/            # Fonctions utilitaires (date-utils.js, uuid.js)
│   │   ├── app.js            # Point d'entrée de l'application
│   │   ├── calendar-manager.js # Gestionnaire de calendrier
│   │   ├── category-manager.js # Gestionnaire de catégories
│   │   ├── data-manager.js   # Gestionnaire de données
│   │   ├── event-manager.js  # Gestionnaire d'événements
│   │   ├── notification-manager.js # Gestionnaire de notifications
│   │   ├── print-manager.js  # Gestionnaire d'impression
│   │   ├── theme-manager.js  # Gestionnaire de thèmes
│   │   └── ui-manager.js     # Gestionnaire d'interface utilisateur
│   └── index.html            # Page HTML principale
├── build/                    # Ressources pour la compilation
│   └── icons/                # Icônes de l'application
├── dist/                     # Fichiers générés pour la distribution
├── main.js                   # Point d'entrée Electron
├── preload.js                # Script de préchargement Electron
├── package.json              # Configuration npm et dépendances
└── README.md                 # Ce fichier
```

## 🚀 Développement

### Scripts disponibles

- `npm start` : Lance l'application en mode développement
- `npm run debug` : Lance l'application avec la journalisation activée
- `npm run dev` : Lance l'application avec le débogueur Node.js
- `npm run watch` : Lance l'application avec redémarrage automatique lors des modifications
- `npm run build` : Construit l'application pour toutes les plateformes
- `npm run build:win` : Construit l'application pour Windows
- `npm run build:mac` : Construit l'application pour macOS
- `npm run build:linux` : Construit l'application pour Linux

### Architecture du code

SuperCalendar utilise une architecture modulaire basée sur des gestionnaires spécialisés :

- **CalendarManager** : Gestion des vues du calendrier et de la navigation
- **EventManager** : Gestion des événements (ajout, modification, suppression)
- **CategoryManager** : Gestion des catégories d'événements
- **DataManager** : Stockage et persistance des données
- **NotificationManager** : Gestion des notifications et alertes
- **PrintManager** : Gestion de l'impression et de l'export PDF
- **ThemeManager** : Gestion des thèmes et préférences visuelles
- **UIManager** : Coordination de l'interface utilisateur

## 📋 Guide d'utilisation

### Vues disponibles

- **Vue annuelle** : Aperçu complet de l'année avec tous les mois
- **Vue mensuelle** : Grille détaillée du mois sélectionné
- **Vue hebdomadaire** : Planning heure par heure de la semaine
- **Vue quotidienne** : Agenda détaillé de la journée

### Raccourcis clavier

- `Ctrl/Cmd + 1` : Vue annuelle
- `Ctrl/Cmd + 2` : Vue mensuelle
- `Ctrl/Cmd + 3` : Vue hebdomadaire
- `Ctrl/Cmd + 4` : Vue quotidienne
- `Ctrl/Cmd + T` : Aller à aujourd'hui
- `Ctrl/Cmd + N` : Nouveau calendrier
- `Ctrl/Cmd + O` : Importer
- `Ctrl/Cmd + S` : Exporter
- `Ctrl/Cmd + P` : Imprimer
- `Ctrl/Cmd + Shift + P` : Exporter en PDF
- `Ctrl/Cmd + ,` : Préférences

## 🛠️ Technologies utilisées

- [Electron](https://www.electronjs.org/) - Framework pour applications de bureau
- [JavaScript](https://developer.mozilla.org/fr/docs/Web/JavaScript) - Langage de programmation
- [HTML/CSS](https://developer.mozilla.org/fr/docs/Web/CSS) - Interface utilisateur
- [Electron Store](https://github.com/sindresorhus/electron-store) - Stockage persistant
- [Electron Updater](https://www.electron.build/auto-update) - Mises à jour automatiques
- [ical-generator](https://github.com/sebbo2002/ical-generator) - Génération de fichiers iCal

## 👨‍💻 Contributeurs

- Fabien Andréo - Développeur principal et architecte du projet

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📬 Contact

Si vous avez des questions ou des suggestions, n'hésitez pas à ouvrir un issue ou à me contacter directement.

---

Fait avec ❤️ à Longwy, France
