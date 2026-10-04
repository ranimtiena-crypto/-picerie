# Épicerie

PWA de caisse offline-first pour plusieurs épiceries, avec espaces de données isolés, rapports locaux, arabe RTL et synchronisation idempotente. Une vente est créée dans une transaction IndexedDB; le stock comptable reste la somme des mouvements et stockCache est une projection recalculable.

## Fichiers

    index.html                 Entrée React/TSX et import map
    styles.css, auth.css       Interface mobile-first et RTL
    app.tsx                    Authentification, rôles, navigation, SW
    manifest.webmanifest       Manifeste PWA
    sw.js                      Cache statique/CDN et signal Background Sync
    src/db.ts                  Dexie, migration v3, stockCache, bases par compte
    src/api.ts                 API avec Bearer token et codes d'erreur
    src/auth/AuthContext.tsx   Revalidation de session et déconnexion sûre
    src/i18n/                  Traductions fr/ar, contexte, formatage
    src/sync.ts                Rejeu client et pull produits/mouvements
    src/screens/               Login, Admin, Caisse, Réception, Produits, Rapports, Sync
    backend/express-server.js  API Railway/Render: Express, SQLite, bcrypt, JWT
    backend/Dockerfile         Image Node du backend
    netlify.toml               Build statique, proxy API, fallback SPA
    public/                    SW, manifeste et en-têtes copiés au build
    README.md                  Ce guide

## Comptes et données

Au premier démarrage du backend, définir ADMIN_EMAIL et ADMIN_PASSWORD; le backend crée l’administrateur avec un hash bcrypt. La connexion renvoie un JWT et crée sa session en SQLite. Le JWT est vérifié à chaque route; les routes /api/admin/* demandent le rôle admin. Un administrateur crée, désactive et réactive les comptes épicerie ou remplace leur mot de passe.

Chaque ligne métier est filtrée par user_id côté serveur. Les produits, ventes, lignes de vente, mouvements et reçus d’idempotence ont une contrainte/index tenant. Le navigateur ouvre une base Dexie distincte par identifiant de compte. Lors de la première connexion épicerie sur un appareil, les données de l’ancienne base mono-boutique sont copiées vers le compte épicerie; les bases ne sont jamais supprimées à la déconnexion. Si une session expire pendant une coupure, l’application continue localement et affiche un avertissement; à la reconnexion elle appelle /auth/me, puis déconnecte le compte si le serveur le refuse sans effacer son IndexedDB.

Le navigateur stocke le jeton dans localStorage comme demandé. La protection serveur ne repose jamais sur le rôle ou l’identifiant envoyés par le client: ils sont tirés du jeton et de la session SQLite.

## Lancer en local

Prérequis: Node.js 20+, npm, Python et un compilateur C++ pour better-sqlite3 si aucun binaire précompilé n’est disponible. Le dépôt n’inclut pas package.json; la commande suivante installe les dépendances dans une copie de travail.

    npm init -y
    npm install vite@6 react@18.3.1 react-dom@18.3.1 dexie@4 html5-qrcode@2 express@5 better-sqlite3@11 bcrypt@5 jsonwebtoken@9

Dans un terminal, lancer l’API avec un secret d’au moins 32 caractères et les identifiants initiaux de l’admin:

    PORT=3001 DB_FILE=./epicerie.sqlite JWT_SECRET=remplacer-par-un-secret-long ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='un-mot-de-passe-long' FRONTEND_ORIGIN=http://localhost:5173 node backend/express-server.js

Dans un second terminal, lancer le frontend et pointer l’API sur Express:

    VITE_API_URL=http://localhost:3001/api npx vite --host 0.0.0.0

Ouvrir l’adresse localhost donnée par Vite. Les dépendances Dexie et html5-qrcode sont servies depuis esm.sh lors du premier chargement; le service worker les met en cache pour les chargements hors ligne suivants. En production le frontend est compilé par le build Netlify ci-dessous.

## Déploiement Netlify + Railway

Le frontend est un build Vite statique. L’API Express reste un processus Node avec un fichier SQLite sur volume persistant. Ne pas héberger SQLite dans Netlify Functions: leur disque local est éphémère.

1. Pousser le dépôt sur GitHub.
2. Dans Netlify, choisir Add new site → Import an existing project, puis sélectionner le dépôt. Netlify exécute la commande du netlify.toml et publie dist.
3. Le build définit VITE_API_URL à /api. Dans netlify.toml, remplacer CHANGE-ME.up.railway.app par l’hôte Railway réel en conservant /api/:splat. Le proxy Netlify garde les appels API sur la même origine; le fallback final vers /index.html ne capture donc pas les routes API.
4. Dans Railway, créer un service depuis le même dépôt et sélectionner backend/Dockerfile comme Dockerfile. Le conteneur initialise les dépendances et démarre avec node backend/express-server.js.
5. Ajouter un volume Railway monté sur /data. Configurer DB_FILE=/data/epicerie.sqlite, JWT_SECRET avec une valeur aléatoire d’au moins 32 caractères (par exemple openssl rand -hex 32), ADMIN_EMAIL, ADMIN_PASSWORD et FRONTEND_ORIGIN avec l’URL Netlify. Si le volume contient une ancienne base mono-boutique, définir aussi LEGACY_SHOP_EMAIL, LEGACY_SHOP_PASSWORD et LEGACY_SHOP_NAME pour réattribuer ses lignes à un compte épicerie dédié. Ne pas committer ces secrets.
6. Attendre le déploiement Railway, copier son domaine public dans la redirection API de netlify.toml, puis redéployer Netlify. Tester /api/auth/login via l’interface et vérifier que le domaine Railway utilise HTTPS.
7. Sur le téléphone, ouvrir l’URL Netlify en HTTPS et installer l’application depuis le menu du navigateur. Android/Chrome propose Installer l’application; sur iPhone/Safari utiliser Partager → Sur l’écran d’accueil.

Le manifeste et le worker sont copiés depuis public/ à la racine de dist. La route exacte /sw.js a Cache-Control no-cache et Service-Worker-Allowed /. Les en-têtes caméra, CSP et protection contre l’intégration en iframe sont dans public/_headers. Le worker met en cache les modules statiques/CDN et relaie uniquement le signal Background Sync aux pages ouvertes; le client est l’unique propriétaire du rejeu de file. Sans fenêtre ouverte, la synchronisation reprendra au prochain lancement.

Netlify construit avec des dépendances installées pendant le build car le workspace Websim qui contient la source sert les fichiers sans build et n’autorise pas de package.json. Pour un dépôt de production classique, il est préférable d’ajouter un package.json avec les dépendances et scripts Vite afin de bénéficier des builds reproductibles et des mises à jour contrôlées.

## Tester hors ligne

1. Se connecter une première fois avec un compte épicerie en ligne et attendre que le Service Worker passe à activated.
2. Dans DevTools → Application → IndexedDB, vérifier la base locale dédiée à cet identifiant. DevTools → Network → Offline simule une coupure.
3. Hors ligne, réceptionner des articles puis créer une vente. Les écritures restent locales, le stock est recalculé depuis le ledger et le badge affiche les ventes non synchronisées.
4. Revenir en ligne. L’événement online lance flushSync; le bouton Synchroniser maintenant reste disponible, notamment sous Safari. Contrôler les états dans l’écran Sync.
5. Pour valider le pull inter-appareils, synchroniser une entrée de stock sur un appareil, puis ouvrir le même compte sur un second navigateur/appareil connecté. Les produits sont tirés avant les mouvements; les UUID existants sont ignorés et stockCache est recalculé à partir des mouvements.
6. Se connecter avec deux comptes épicerie différents sur le même navigateur: chacun ouvre sa base Dexie par ID et ses requêtes API sont cloisonnées côté serveur.

Le scanner caméra requiert HTTPS et une autorisation caméra. Le champ code-barres de la caisse conserve le mode clavier pour les lecteurs USB/Bluetooth. Safari ne dépend pas de Background Sync: le listener online et le bouton manuel sont le chemin standard.

## Limites et migration

La version de prévisualisation Websim exécute son server.js racine en Worker D1, tandis que le déploiement multi-comptes Netlify/Railway utilise backend/express-server.js. L’authentification bcrypt/JWT et les nouvelles routes sont implémentées dans l’adaptateur Express de production; le backend D1 hérité du projet n’est pas l’API de production Netlify.

Les données locales existantes sont préservées et copiées au premier login épicerie. Pour une ancienne base SQLite serveur déjà peuplée, effectuer une sauvegarde avant la première migration multi-compte; les lignes sans propriétaire historique sont conservées sous l’identifiant initial, mais leur attribution métier doit être vérifiée avant de les rendre visibles à une épicerie.
