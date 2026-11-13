# Changelog

Règle : une entrée par version publiée. Les choix « raisonnables » pris sans poser de question sont notés ici.

## 0.10.1 — Correctif synchronisation
- Bug : le vrai Firestore répond « Document "…/databases/(default)/…" not found » quand le profil n'existe pas encore ; le mot « database » faisait croire que la base elle-même n'existait pas, et la première synchro s'arrêtait à tort. Reconnaissance corrigée (la vraie absence de base dit « does not exist »), tests alignés sur les vrais messages de Firestore.

## 0.10.0 — Nouveau bestiaire, boutique d'accessoires, écran d'ouverture
- Nouvelles créatures, dans cet ordre : 🐉 dragon (Additions, la première), 🐱 chat (Soustractions), belette, 🦊 renard, 🐯 tigre, kitsune à 4 queues, 🐺 loup, kitsune à 9 queues (Astuces). Chacune garde son œuf et ses 4 évolutions avec une histoire à chaque forme. Les identifiants de sauvegarde sont inchangés : les œufs et stades déjà obtenus restent (le dessin change, pas la progression).
- Boutique 🛍️ : les étoiles gagnées s'échangent contre 13 accessoires (chapeaux, lunettes, cou/cape). On habille chaque créature éclose ; l'accessoire se voit dans l'album, sur l'accueil et à l'ouverture. Solde = étoiles gagnées − prix des accessoires possédés ; un achat n'est jamais perdu (union à la fusion, synchronisé comme le reste). Nouveau trophée « Garde-robe ».
- Choix : un seul accessoire par emplacement ; « le plus récent gagne » entre deux appareils pour ce que porte une créature. Limite connue : si deux appareils achètent chacun un objet avec les mêmes étoiles, le solde est ramené à 0 (jamais négatif).
- Test corrigé : le test de copie de secours dépendait du hasard du générateur.

## 0.9.1 — Synchronisation activée
- Projet Firebase « calcul-cm2-famille » branché (clé web restreinte au site de l'appli côté Google Cloud ; la protection des données, ce sont les règles firestore.rules).
- Petit nuage ☁️ sur l'accueil : ✓ synchro à jour, … en cours, ⚠️ problème (appui = Réglages avec la cause). Caché tant que la synchro n'est pas disponible.
- Non vérifié ici : le vrai Firestore (pas d'accès réseau depuis mon environnement). À contrôler sur le téléphone, voir les messages de Réglages en cas de souci.

## 0.9.0 — Synchronisation téléphone ↔ iMac et sauvegarde en fichier
- Synchronisation Firebase (Firestore, API REST : aucun SDK, aucune compilation). Inactive tant que js/firebase-config.js vaut `null` : l'appli reste 100 % locale. Guide pas à pas : docs/firebase.md ; règles de sécurité : firestore.rules.
- Principe « jamais rien perdre » : on lit la copie en ligne, on FUSIONNE (union des trophées et créatures, maximum des compteurs), on vérifie qu'aucun élément n'a disparu (sinon on n'écrit rien), puis on écrit avec précondition ; si l'autre appareil a écrit entre-temps, on relit et on refusionne. Une copie en ligne illisible n'est jamais écrasée.
- Quand : à l'ouverture, ~10 s après la fin d'une partie, quand l'appli passe en arrière-plan, au retour du réseau, et via le bouton « Synchroniser maintenant ». Les trophées / évolutions gagnés sur l'autre appareil sont annoncés.
- Réglages : état de la synchro avec messages clairs (base non créée, règles, clé refusée, hors ligne…), sauvegarde exportable en fichier .json et import qui FUSIONNE (n'efface jamais).
- Missions : la fusion garde au plus 3 missions actives (choix déterministe), pour que deux appareils ne se renvoient pas des missions en boucle. Une mission abîmée ne peut plus provoquer d'écran blanc.
- Choix : l'identité de synchro est l'empreinte (SHA-256) du prénom + code secret (même prénom et même code sur chaque appareil) ; le document est interdit en liste/suppression par les règles. Limite d'envoi : 900 000 caractères (très largement suffisant).
- Non testable ici : la vraie base Firebase (tests avec une fausse base qui imite l'API, et deux navigateurs). L'écran Réglages affichera la cause exacte si quelque chose ne va pas.

## 0.8.0 — Dictée, réglages, créature compagnon
- Mode « 🎧 Dictée : écoute et calcule » (écran Exercices) : le calcul est lu à voix haute en français (« quarante-sept plus trente-huit »), il n'est pas affiché ; boutons « ↻ Répéter » et « 👁 Voir le calcul ». Elle répond en QCM ou en tapant, comme d'habitude. Après une erreur, la bonne réponse et l'astuce sont lues à voix haute (bouton « Écouter l'astuce »).
- Lecture à voix haute des calculs aussi dans les autres modes (option, bouton 🔊 sur la carte).
- Synthèse vocale du navigateur uniquement : aucun micro, aucune reconnaissance vocale, aucun envoi de données. La voix ne démarre qu'après un appui. Si l'appareil n'a pas de voix française : message doux et le calcul s'affiche normalement.
- Écran Réglages (⚙️ sur l'accueil) : sons, vitesse de la voix (lente / normale / rapide), lecture à voix haute, façon de répondre, test de la voix.
- Créature compagnon : bouton « Choisir comme compagnon » dans l'album ; elle s'affiche sur l'accueil (réglage propre à chaque appareil).
- Nouvelle mission « Fais une dictée de calculs » (seulement quand l'appareil sait lire à voix haute) et trophée « Oreille fine » (déjà prévu) alimenté par les bonnes réponses en dictée.
- Choix : la voix n'est pas coupée par le réglage « sans le son » (qui ne concerne que les bruitages), puisque la dictée est une activité demandée.

## 0.7.1 — Retours d'essai : accueil, 4 niveaux, coup de pouce
- Correction : après le code secret on arrive tout de suite sur l'accueil (plus besoin de fermer l'appli). À la fin du défi du jour, « Retour » ramène à l'accueil (et non à Exercices).
- Flèche de retour (et croix) : bouton rond plus grand (48 px), icône dessinée et bien centrée.
- 4 niveaux de difficulté (★☆☆☆ à ★★★★) : nouveau niveau 1 « très facile » (additions sans retenue, soustractions sans emprunt, tables de 4 et 6, petits nombres). Les anciens niveaux 1-2-3 deviennent 2-3-4.
- Le défi du jour démarre doucement : ses premiers calculs (40 %) sont d'un cran plus faciles que le niveau de la famille.
- Coup de pouce : si elle hésite (12 s en QCM, 16 s en saisie), un bouton « 💡 Un coup de pouce ? » apparaît ; chaque appui donne un peu plus de la méthode, JAMAIS le résultat (testé sur des milliers de calculs).
- Choix : le niveau déjà atteint est conservé tel quel (aucune migration de la sauvegarde) ; comme les niveaux sont plus doux, elle repart donc d'un contenu un peu plus facile, ce qui est voulu. Un calcul à revoir réussi avec un coup de pouce compte comme bonne réponse mais ne valide pas encore la maîtrise.

## 0.7.0 — Créatures à collectionner
- 8 créatures originales dessinées en SVG (aucun personnage sous licence), une par famille de calcul : Pomplo (additions), Frimo (soustractions), Kroko (multiplications), Duplo (doubles/triples), Parto (moitiés/tiers), Complo (compléments), Piko (divisions), Astro (astuces).
- Chaque bonne réponse fait grandir la créature de sa famille : œuf (qui se fissure à mi-chemin) → éclosion à 10 bonnes réponses → bébé → jeune (50) → adulte (150) → légendaire (350, avec halo et étincelles).
- Écran « Mes créatures » (album) avec la progression vers le prochain stade ; l'accueil montre la créature la plus avancée (ou l'œuf le plus proche d'éclore).
- Éclosion / évolution : confettis, petit son, message et carte récapitulative à la fin de la série.
- Sauvegarde : le stade atteint ne redescend jamais, fusion téléphone/iMac = stade maximum (testé). Un test vérifie qu'aucune couleur de créature n'est rosée.
- Choix : les seuils (10 / 50 / 150 / 350) comptent les bonnes réponses de la famille, y compris les révisions.

## 0.6.0 — Récompenses : défi du jour, série, missions, trophées
- Écran d'accueil : défi du jour (thème différent chaque jour, ~20 calculs, aucun chrono ; on peut le rejouer avec de nouveaux calculs), série de jours avec joker (1 joker au départ, +1 tous les 7 jours, 2 max : un jour manqué ne casse pas tout), 3 missions toujours renouvelées, étoiles.
- Missions : remplacées dès qu'elles sont terminées par une nouvelle tirée d'une réserve variée (famille, enchaînement, mode, série parfaite, fiche à découvrir, calculs à rattraper, défi du jour).
- Trophées à paliers (bronze → diamant) : 13 lignes + 1 par famille. Identifiants figés dans tests/trophy-ids.json : un test échoue si l'un disparaît. Un trophée gagné ne se retire jamais, même si un compteur baissait.
- Écran prénom + code secret (une fois par appareil, stockés seulement sur l'appareil ; le code est transformé en empreinte SHA-256 pour la synchro).
- Choix : la série de jours est calculée à partir des jours joués (donc fusionnable sans conflit entre téléphone et iMac).

## 0.5.0 — Apprendre
- 17 fiches (une par astuce, couvrant tous les types de calcul) : principe court, exemple décomposé pas à pas (onglets pour plusieurs exemples), mini-exemple interactif où elle trouve elle-même chaque étape, bouton « Je m'entraîne » qui lance des exercices de ce type.
- Les exemples sont de vrais calculs du générateur (testés). Une fiche est marquée « lue » dès qu'elle a été travaillée ; le niveau adaptatif n'est pas modifié par l'entraînement d'une fiche.
- Couleurs de famille : textes sombres sur les fonds clairs (jaune, bleu ciel, turquoise) pour rester lisibles.

## 0.4.0 — Exercices jouables
- Écrans Exercices (par type de calcul ou mélange, 10/15/20 calculs) et jeu : QCM à 4 choix ou saisie avec clavier numérique intégré (clavier physique sur iMac : chiffres, Entrée, Retour arrière ; touches 1-4 en QCM).
- Réponse fausse : jamais de sanction ; la bonne réponse et l'astuce calculée pour CES nombres s'affichent étape par étape ; le calcul revient 4 questions plus tard puis à 1, 3, 7, 14 jours jusqu'à être « devenu facile ».
- Niveau adaptatif par famille (monte à ≥ 85 % de réussite, redescend doucement à ≤ 40 %, le meilleur niveau atteint est conservé).
- Résultats : 1 à 3 étoiles (toujours au moins une), meilleure série, calculs devenus faciles.
- Choix : le bouton « ✕ » quitte la série sans la perdre ni la punir (les réponses déjà données sont enregistrées).

## 0.3.0 — Sauvegarde qui ne perd rien
- État versionné (schéma 1), migrations additives seulement, identifiants stables.
- Fusion sans perte (union des trophées/créatures/fiches/jours, maximum des compteurs) : idempotente, commutative, associative (testé sur des états aléatoires).
- Stockage local avec copie de secours, instantané quotidien (5 conservés) et fusion de toutes les copies au chargement : même une copie abîmée ne fait rien perdre. Le service worker ne touche à aucune donnée.
- Export / import de la progression en fichier (l'import fusionne, il n'écrase jamais).
- Tests : chaque sauvegarde de référence des versions précédentes (tests/fixtures) doit se recharger sans perte ; une nouvelle référence est ajoutée à chaque mise en ligne (`node tests/make-fixture.mjs`).

## 0.2.0 — Générateur de calculs
- 8 familles x 3 niveaux (33 types de calcul), entiers positifs seulement, jamais de calcul trop simple.
- Une astuce calculée pour chaque calcul (47 + 38 → 47 + 40 − 2), avec les étapes détaillées.
- QCM : mauvaises réponses issues d'erreurs typiques (retenue oubliée, colonne à colonne, table voisine…).
- Phrases dictées en français naturel ; nombres en lettres (quatre-vingts, cent, mille…).
- Tests : ~38 000 calculs vérifiés (résultat, astuce, étapes, QCM, phrase dictée, règles strictes).
- Choix : « 30 × 70 » est possible (dizaines 3, 4, 6, 7, 8, 9) bien que le « ×3 » soit exclu des tables ; tiers et quarts ont toujours un résultat ≥ 12 (même logique que le triple d'un nombre ≥ 12).

## 0.1.0 — Coque PWA
- Manifest (plein écran, portrait), service worker (jouable hors ligne, ne touche à aucune donnée de progression), icônes PNG.
- Palette bleu nuit / turquoise / soleil (volontairement sans rose, à la demande).
- Accueil provisoire avec la mascotte œuf qui se balance.
- Choix : le service worker est un script classique à version codée en dur (contrôlée par un test) ; mise à jour proposée par un petit bandeau « Recharger ».

## 0.0.1 — Page minimale
- Page d'accueil provisoire affichant le numéro de version, pour vérifier la publication GitHub Pages.
