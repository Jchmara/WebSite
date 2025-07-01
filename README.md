# WebSite

## 🛠️ Stack technique
- **FrontEnd** : React
- **BackEnd** : Node.js
- **Base de données** : PostgreSQL

---

Ce site web va permettre plusieurs choses aux utilisateurs.

### ✨ Fonctionnalités principales

#### 🔐 1. Authentification et accueil
- Se connecter avec sa session Windows
- Avoir une page d'accueil
    - Une pour les collaborateurs
    - Une pour les managers
- Permettre à tout le monde de voir le calendrier avec :
    - Le jour
    - Le projet sur lequel ils sont
    - La semaine avec leur moment sur site, en télétravail et chez le client

#### 📅 2. Gestion de la semaine de travail
- Rentrer sa semaine de travail comme dans Swift avec un design ressemblant
- Voir de telle semaine à telle semaine
- (Manager : peut voir une personne en particulier)
- Rentrer les options sur la semaine choisie
- Trois boutons :
    - Propager la semaine (si c'est la même semaine qui se répète)
    - Valider
    - Effacer la semaine
- Résumé de la semaine (ex : 3 jours sur site, 1 jour client, etc.)
- Bouton pour revenir au menu principal

#### 🗂️ 3. Gestion des projets
- Ajouter les projets sur le site pour voir qui est sur quel projet et la charge de travail
- Voir de telle semaine à telle semaine
- (Manager : peut voir une personne en particulier)
- Tableau pour :
    - Nom du projet
    - Pourcentage de charge de travail
    - Commentaire
    - Code projet associé
- Bouton pour ajouter une ligne au tableau
- Trois boutons :
    - Répartir automatiquement la charge de travail
    - Valider
    - Effacer la semaine
- Résumé des projets (ex : 100% répartis / 3 projets actifs cette semaine)
- Bouton pour revenir au menu principal

#### 📊 4. Reporting
- 3 pages distinctes
- **Collaborateur** :
    - Sélection d'une période
    - Résumé du taux de présence, taux d'occupation, nombre de jours sur site
    - Graphique associé
- **Manager** :
    - Même page d'accueil
    - Accès à la sélection d'une personne ou d'un projet
    - Statistiques par personne ou par équipe
    - Tableau récapitulatif : grade, jours sur site, jours client, télétravail, congés, taux d'occupation (%), projets principaux
    - Graphique adapté

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js (version recommandée : 18.x ou supérieure)
- npm ou yarn
- PostgreSQL (hébergé sur un serveur)

### Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/Jchmara/WebSite.git
   cd WebSite
   ```

2. **Installer les dépendances du frontend**
   ```bash
   cd frontend
   npm install
   # ou
   yarn install
   ```

3. **Installer les dépendances du backend**
   ```bash
   cd ../backend
   npm install
   # ou
   yarn install
   ```

4. **Configurer la base de données**
   - Utilisez une base PostgreSQL hébergée sur un serveur (local ou distant) et renseignez les informations de connexion (hôte, port, utilisateur, mot de passe, nom de la base) dans le fichier de configuration du backend (ex : `.env`).

5. **Lancer le backend**
   ```bash
   npm start
   # ou
   yarn start
   ```

6. **Lancer le frontend**
   ```bash
   cd ../frontend
   npm start
   # ou
   yarn start
   ```

L'application sera accessible sur `http://localhost:3000` (par défaut pour React).

---

## 🚧 État d'avancement

- [ ] Authentification Windows
- [ ] Page d'accueil collaborateurs/managers
- [ ] Saisie de la semaine de travail
- [ ] Gestion des projets
- [ ] Reporting avancé

## 📄 Licence

Ce projet est la propriété de [Deloitte]. Toute reproduction ou utilisation sans autorisation est interdite.

---
