# Changelog

Règle : une entrée par version publiée. Les choix « raisonnables » pris sans poser de question sont notés ici.

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
