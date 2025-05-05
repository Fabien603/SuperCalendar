# SuperCalendar

Une application de calendrier avancée construite avec Electron, offrant une interface élégante et des fonctionnalités puissantes pour la gestion de vos rendez-vous et événements.

## 📋 Fonctionnalités

- Interface utilisateur intuitive et moderne
- Synchronisation avec plusieurs services de calendrier (Google Calendar, Microsoft Outlook, etc.)
- Gestion des événements récurrents
- Notifications configurables pour les événements à venir
- Personnalisation complète de l'apparence (thèmes clairs/sombres)
- Mode hors ligne pour accéder à vos données sans connexion internet
- Compatible avec Windows, macOS et Linux

## 🚀 Installation

### Prérequis

- [Node.js](https://nodejs.org/) (version 16.x ou supérieure)
- [npm](https://www.npmjs.com/) (version 8.x ou supérieure)
- [Git](https://git-scm.com/)

### Étapes d'installation

```bash
# Cloner ce dépôt
git clone https://github.com/Fabien603/SuperCalendar.git

# Accéder au répertoire du projet
cd SuperCalendar

# Installer les dépendances
npm install

# Lancer l'application
npm start
```

## 💻 Développement

### Structure du projet

```
SuperCalendar/
├── assets/           # Ressources statiques (images, icônes, etc.)
├── src/              # Code source
│   ├── main/         # Processus principal d'Electron
│   ├── renderer/     # Processus de rendu (interface utilisateur)
│   └── shared/       # Code partagé entre les processus
├── tests/            # Tests unitaires et d'intégration
├── build/            # Configuration de build et scripts
├── dist/             # Fichiers générés pour la distribution
├── package.json      # Dépendances et scripts npm
└── README.md         # Ce fichier
```

### Scripts disponibles

- `npm start` : Lance l'application en mode développement
- `npm run build` : Compile l'application pour la production
- `npm run package` : Crée des packages d'installation pour toutes les plateformes
- `npm test` : Exécute les tests unitaires et d'intégration

## 🛠️ Technologies utilisées

- [Electron](https://www.electronjs.org/) - Framework pour créer des applications de bureau
- [React](https://reactjs.org/) - Bibliothèque UI
- [Redux](https://redux.js.org/) - Gestion d'état
- [Electron Forge](https://www.electronforge.io/) - Outil de packaging et distribution
- [Jest](https://jestjs.io/) - Framework de test

## 📝 Contribution

Les contributions sont les bienvenues! Veuillez consulter le fichier [CONTRIBUTING.md](CONTRIBUTING.md) pour les directives détaillées.

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).

## 👨‍💻 Auteur

- **Fabien Andréo** - Architecte informaticien avec plus de 35 ans d'expérience

## 🙏 Remerciements

- Merci à tous les contributeurs qui ont participé à ce projet
- Inspiré par les meilleurs gestionnaires de calendrier existants
- Un grand merci à la communauté Electron pour leur excellent framework
