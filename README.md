# 🎓 IUT Dashboard

> Un tableau de bord moderne et interactif pour les étudiants et le personnel de l'IUT, développé avec React

[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16.0+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

## ⚠️ Avertissement de sécurité

> **🔐 ATTENTION - Informations importantes concernant la confidentialité**
> 
> Cette application peut traiter des identifiants de session (cookies PHPSESSID) pour accéder aux données ScoDoc. Bien que ces identifiants soient utilisés uniquement pour **consulter vos notes et informations académiques** en lecture seule (aucune action de modification n'est possible), il existe un risque théorique d'interception par des tiers malveillants.
> 
> **Points importants à retenir :**
> - ✅ **Accès en lecture seule** : Les tokens ne permettent que la visualisation de vos notes
> - ✅ **Aucune action destructive** : Impossible de modifier, supprimer ou altérer vos données
> - ⚠️ **Risque d'interception** : Comme tout identifiant web, il peut être intercepté
> 
> **Recommandations :**
> - Utilisez cette application uniquement sur des réseaux de confiance
> - Évitez l'utilisation sur des ordinateurs publics
> 
> En utilisant cette application, vous acceptez ces risques et reconnaissez que l'accès reste limité à la consultation de vos propres données académiques.

## 📖 À propos du projet

IUT Dashboard est une application web moderne conçue pour centraliser et faciliter l'accès aux informations importantes de l'IUT. Cette interface utilisateur intuitive permet aux étudiants et au personnel de consulter rapidement les données essentielles dans un environnement convivial et responsive.

### ✨ Fonctionnalités principales

- 📊 **Tableau de bord interactif** - Interface moderne avec des composants visuels attrayants
- 📱 **Design responsive** - Compatible avec tous les appareils (mobile, tablette, desktop)
- ⚡ **Performances optimisées** - Application rapide et fluide
- 🎨 **Interface utilisateur intuitive** - Navigation simple et ergonomique
- 🔧 **Architecture modulaire** - Code maintenable et extensible

## 🚀 Démarrage rapide

### Prérequis

Avant de commencer, assurez-vous d'avoir installé sur votre machine :

- [Node.js](https://nodejs.org/) (version 16.0 ou supérieure)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

### Installation

1. **Clonez le repository**
   ```bash
   git clone https://github.com/MickaelFlores/iut-dashboard-new.git
   cd iut-dashboard-new
   ```

2. **Installez les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Démarrez l'application en mode développement**
   ```bash
   npm start
   # ou
   yarn start
   ```

4. **Ouvrez votre navigateur**
   
   Rendez-vous sur [http://localhost:3000](http://localhost:3000) pour voir l'application.

## 📋 Scripts disponibles

Dans le répertoire du projet, vous pouvez exécuter les commandes suivantes :

### `npm start`
Lance l'application en mode développement. La page se recharge automatiquement lorsque vous apportez des modifications au code.

### `npm test`
Démarre le runner de tests en mode watch interactif. Consultez la [documentation sur les tests](https://facebook.github.io/create-react-app/docs/running-tests) pour plus d'informations.

### `npm run build`
Compile l'application pour la production dans le dossier `build`. L'application est optimisée pour les meilleures performances. Les fichiers sont minifiés et incluent des hashes pour le cache.

### `npm run eject`
**Attention : cette opération est irréversible !**

Cette commande copie tous les fichiers de configuration dans votre projet pour un contrôle total de la configuration.

## 🏗️ Structure du projet

```
iut-dashboard-new/
├── public/                 # Fichiers publics statiques
│   ├── index.html         # Template HTML principal
│   └── manifest.json      # Manifeste de l'application
├── src/                   # Code source de l'application
│   ├── components/        # Composants React réutilisables
│   ├── pages/            # Pages de l'application
│   ├── hooks/            # Hooks React personnalisés
│   ├── utils/            # Fonctions utilitaires
│   ├── styles/           # Feuilles de style
│   ├── App.js            # Composant principal
│   └── index.js          # Point d'entrée de l'application
├── package.json          # Dépendances et scripts
└── README.md            # Documentation du projet
```

## 🛠️ Technologies utilisées

- **[React](https://reactjs.org/)** - Bibliothèque JavaScript pour créer des interfaces utilisateur
- **[Create React App](https://create-react-app.dev/)** - Boilerplate pour démarrer rapidement un projet React
- **[JavaScript ES6+](https://developer.mozilla.org/fr/docs/Web/JavaScript)** - Langage de programmation principal
- **[CSS3](https://developer.mozilla.org/fr/docs/Web/CSS)** - Styles et animations
- **[HTML5](https://developer.mozilla.org/fr/docs/Web/HTML)** - Structure de l'application

## 🎯 Utilisation

Une fois l'application démarrée, vous pouvez :

1. **Naviguer dans le dashboard** - Explorez les différentes sections disponibles
2. **Consulter les informations** - Accédez aux données importantes de l'IUT
3. **Interagir avec l'interface** - Utilisez les composants interactifs pour personnaliser votre expérience

## 🚀 Déploiement

### Déploiement sur Netlify

1. Compilez l'application : `npm run build`
2. Uploadez le dossier `build` sur [Netlify](https://www.netlify.com/)

### Déploiement sur Vercel

1. Installez la CLI Vercel : `npm install -g vercel`
2. Dans le répertoire du projet : `vercel`
3. Suivez les instructions

### Déploiement sur GitHub Pages

1. Installez le package : `npm install --save-dev gh-pages`
2. Ajoutez dans `package.json` : `"homepage": "https://votre-username.github.io/iut-dashboard-new"`
3. Ajoutez les scripts de déploiement dans `package.json`
4. Déployez : `npm run deploy`

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Forkez le projet**
2. **Créez une branche** pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Committez vos changements** (`git commit -m 'Add some AmazingFeature'`)
4. **Poussez vers la branche** (`git push origin feature/AmazingFeature`)
5. **Ouvrez une Pull Request**

### Guidelines de contribution

- Respectez les conventions de code existantes
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation si nécessaire
- Assurez-vous que tous les tests passent

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

**Mickaël Flores**

- GitHub: [@MickaelFlores](https://github.com/MickaelFlores)
- LinkedIn: [Mickaël Flores](https://linkedin.com/in/mickael-flores)

## 🙏 Remerciements

- L'équipe pédagogique de l'IUT pour le soutien
- La communauté React pour les ressources et l'inspiration
- Tous les contributeurs qui ont participé à ce projet

## 📞 Support

Si vous rencontrez des problèmes ou avez des questions :

1. Consultez la [documentation](https://github.com/MickaelFlores/iut-dashboard-new/wiki)
2. Ouvrez une [issue](https://github.com/MickaelFlores/iut-dashboard-new/issues)
3. Contactez l'auteur directement

---

<div align="center">
  <sub>Développé avec ❤️ pour la communauté IUT</sub>
</div>
