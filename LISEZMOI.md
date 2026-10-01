# Carrière Foot · site autonome

Le jeu complet, hors de Claude. Deux services gratuits :

- **GitHub Pages** héberge le site (les fichiers de ce dossier) ;
- **Firebase** gère la connexion Google et la base de données partagée (clubs, ligue, coupes, mercato…).

Aucune carte bancaire n'est demandée. Les intitulés des consoles peuvent varier légèrement selon la langue ou les mises à jour.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | La page du site |
| `css/style.css` | Le design (les couleurs sont en haut du fichier) |
| `js/firebase-config.js` | **À remplir** avec la configuration de ton projet Firebase |
| `js/data.js` | Effectifs, légendes, packs, entraîneurs |
| `js/engine.js` | Formations, simulateur de match, objectifs joueurs |
| `js/logic.js` | Règles : budget, gains, packs, coupes, enchères, saisons |
| `js/store.js` | Lien avec la base de données |
| `js/ui.js` | Affichage des pages |
| `vendor/` | Bibliothèque officielle Firebase (ne pas modifier) |
| `firestore.rules` | Règles de sécurité à coller dans Firebase |

## Mise en ligne (une seule fois, environ 15 minutes)

### A. Firebase (la base de données)

1. Va sur https://console.firebase.google.com avec ton compte Google → **Créer un projet** (ex. `carriere-foot`). Tu peux désactiver Google Analytics.
2. Menu **Créer › Firestore Database** → **Créer une base de données** → mode **production** → emplacement **europe-west9 (Paris)** (choix définitif).
3. Onglet **Règles** : remplace tout par le contenu de `firestore.rules`, puis **Publier**.
4. Menu **Créer › Authentication** → **Commencer** → onglet **Méthode de connexion** → **Google** → **Activer** → choisis ton e-mail d'assistance → **Enregistrer**.
5. ⚙ **Paramètres du projet** → section **Vos applications** → icône **Web `</>`** → nom `site` → **Enregistrer l'application** (pas besoin de Firebase Hosting). Firebase affiche un objet `firebaseConfig` : garde cette page ouverte.

### B. GitHub (l'hébergement)

6. Crée un compte sur https://github.com, puis **New repository** : nom `carriere-foot`, **Public** (obligatoire pour GitHub Pages en gratuit) → **Create repository**.
7. Clique sur **uploading an existing file**, glisse **tout le contenu** de ce dossier (pas le dossier lui-même : `index.html` doit être à la racine) → **Commit changes**.
8. Ouvre `js/firebase-config.js` sur GitHub → icône crayon ✏️ → remplace les 6 valeurs par celles de l'étape 5 → **Commit changes**.
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

- **Budget de départ, gains de match, prix et cotes des packs, coupes** : tout en haut de `js/logic.js`.
- **Joueurs** : `js/data.js`. Une ligne = un joueur : `POSTE[/POSTE2]|prénom|nom|âge|note|potentiel`. Le prix se calcule tout seul à partir de la note.
- **Formations** : `FORMATIONS` dans `js/engine.js` (poste, position x %, position y % sur le terrain).
- **Couleurs** : variables en haut de `css/style.css`.
- Si tu modifies des joueurs déjà en jeu, augmente `DATA_VERSION` dans `js/logic.js` : le site proposera de réinitialiser la partie.

## Limites et sécurité

- **Gratuit** : Firestore offre chaque jour 50 000 lectures et 20 000 écritures, largement assez pour un groupe d'amis.
- La configuration Firebase (`apiKey`…) est visible dans le code du site : c'est normal, ce n'est pas un mot de passe. Ce sont les règles de sécurité qui protègent la base.
- Entre amis, un joueur très doué en informatique pourrait tricher depuis la console de son navigateur : le jeu n'a pas d'arbitre côté serveur.
- **Changer d'administrateur** : Firebase › Firestore Database › collection `admin` › supprime le document `owner` ; le prochain compte qui ouvre le site devient administrateur.
