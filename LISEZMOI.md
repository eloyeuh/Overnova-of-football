# Carrière Foot · site autonome

Le jeu complet, hors de Claude. Deux services gratuits :

- **GitHub Pages** héberge le site (les fichiers de ce dossier) ;
- **Firebase** gère la connexion Google et la base de données partagée (clubs, ligue, coupes, mercato…).

Aucune carte bancaire n'est demandée. Les intitulés des consoles peuvent varier légèrement selon la langue ou les mises à jour.

## Contenu du dossier

Tous les fichiers sont à plat, sans sous-dossier : sur GitHub, on les glisse tous d'un coup.

| Fichier | Rôle |
|---|---|
| `index.html` | La page du site |
| `style.css` | Le design (les couleurs sont en haut du fichier) |
| `firebase-config.js` | La configuration de ton projet Firebase (déjà remplie) |
| `data.js` | Effectifs, légendes, packs, entraîneurs |
| `engine.js` | Formations, simulateur de match, objectifs joueurs |
| `logic.js` | Règles : budget, gains, packs, coupes, enchères, saisons |
| `store.js` | Lien avec la base de données |
| `ui.js` | Affichage des pages |
| `firebase-sdk.js` | Bibliothèque officielle Firebase (ne pas modifier) |
| `firestore.rules` | Règles de sécurité à coller dans Firebase |

## Mise en ligne (une seule fois, environ 15 minutes)

### A. Firebase (la base de données)

La console Firebase peut être en français ou en anglais : les deux intitulés sont indiqués.

1. **Créer le projet** : va sur https://console.firebase.google.com avec ton compte Google → **Créer un projet** (*Create a new Firebase project*) → nom `carriere-foot` → accepte les conditions → **Continuer**. Gemini et Google Analytics : tu peux les désactiver → **Créer le projet**. Attends la fin puis **Continuer**.
2. **Créer la base** : menu de gauche **Bases de données et stockage › Firestore** (*Databases & Storage › Firestore*) → **Créer une base de données** (*Create database*). Si une édition est demandée, choisis **Standard**. Emplacement : **europe-west9 (Paris)** (choix définitif) → mode **production** → **Créer**.
3. **Règles de sécurité** : toujours dans Firestore, onglet **Règles** (*Rules*) → efface tout le texte → colle le contenu du fichier `firestore.rules` → **Publier** (*Publish*).
4. **Connexion Google** : menu de gauche **Sécurité › Authentication** (*Security › Authentication*) → **Commencer** (*Get started*) → onglet **Méthode de connexion** (*Sign-in method*) → **Google** → interrupteur **Activer** (*Enable*) → choisis ton e-mail dans « Adresse e-mail d'assistance » → **Enregistrer** (*Save*).
5. **Appli Web** : clique sur **Vue d'ensemble du projet** (*Project overview*, en haut à gauche) → bouton **+ Ajouter une application** (*Add app*) → icône **Web `</>`** → surnom `site` → ne coche pas Firebase Hosting → **Enregistrer l'application** (*Register app*). Firebase affiche un bloc `const firebaseConfig = { apiKey: "...", ... }` : copie-le et garde-le (tu peux le retrouver plus tard dans ⚙ **Paramètres du projet › Vos applications**).

### B. GitHub (l'hébergement)

6. Crée un compte sur https://github.com, puis **New repository** : nom `carriere-foot`, **Public** (obligatoire pour GitHub Pages en gratuit) → **Create repository**.
7. Clique sur **uploading an existing file**, sélectionne **tous les fichiers** de ce dossier (Cmd+A sur Mac, Ctrl+A sur PC), glisse-les dans la page → **Commit changes**. La liste du dépôt doit afficher `index.html`, `style.css`, `firebase-sdk.js`, etc.
8. (Seulement si tu changes de projet Firebase) Ouvre `firebase-config.js` sur GitHub → icône crayon ✏️ → remplace les 6 valeurs par celles de l'étape 5 → **Commit changes**.
9. **Settings › Pages** → *Build and deployment* : **Deploy from a branch** → branche `main`, dossier `/ (root)` → **Save**. Après 1 à 2 minutes, l'adresse apparaît : `https://TON-PSEUDO.github.io/carriere-foot/`.

### C. Relier les deux

10. Firebase › **Authentication › Paramètres › Domaines autorisés** → **Ajouter un domaine** → `TON-PSEUDO.github.io`.
11. Ouvre ton site et **connecte-toi en premier** : le premier compte connecté devient l'administrateur (réinitialiser la partie, lancer les saisons, outils de test).

## Jouer avec tes amis

1. Envoie l'adresse du site à tes amis : ils se connectent avec Google, choisissent un pseudo et un club (un coach par club).
2. Chacun clique sur **Inscrire mon club** ; toi, tu cliques sur **Lancer la saison** (Compétitions › Ligue).
3. 1 match par jour à 20h (heure de Paris), coupe le samedi à 15h, enchères le vendredi et le dimanche à 18h. Personne n'a besoin de rester connecté : tout se rattrape à la prochaine ouverture du site.

**Réserver le jeu à tes amis** : dans `firestore.rules`, suis le commentaire pour mettre la liste de leurs adresses Gmail, puis recolle les règles dans Firebase et **Publier**.

## Modifier le jeu plus tard

**Avec Claude (le plus simple)** : connecte ton compte GitHub à Claude (claude.ai › Paramètres › Connecteurs), puis demande la modification en donnant le nom de ton dépôt (`TON-PSEUDO/carriere-foot`). Claude modifie les fichiers et les envoie sur GitHub ; le site se met à jour tout seul en 1 à 2 minutes.

**À la main** : sur GitHub, ouvre le fichier → crayon ✏️ → modifie → **Commit changes**. Repères utiles :

- **Budget de départ, gains de match, prix et cotes des packs, coupes** : tout en haut de `logic.js`.
- **Joueurs** : `data.js`. Une ligne = un joueur : `POSTE[/POSTE2]|prénom|nom|âge|note|potentiel`. Le prix se calcule tout seul à partir de la note.
- **Formations** : `FORMATIONS` dans `engine.js` (poste, position x %, position y % sur le terrain).
- **Couleurs** : variables en haut de `style.css`.
- Si tu modifies des joueurs déjà en jeu, augmente `DATA_VERSION` dans `logic.js` : le site proposera de réinitialiser la partie.

## Limites et sécurité

- **Gratuit** : Firestore offre chaque jour 50 000 lectures et 20 000 écritures, largement assez pour un groupe d'amis.
- La configuration Firebase (`apiKey`…) est visible dans le code du site : c'est normal, ce n'est pas un mot de passe. Ce sont les règles de sécurité qui protègent la base.
- Entre amis, un joueur très doué en informatique pourrait tricher depuis la console de son navigateur : le jeu n'a pas d'arbitre côté serveur.
- **Changer d'administrateur** : Firebase › Firestore Database › collection `admin` › supprime le document `owner` ; le prochain compte qui ouvre le site devient administrateur.
