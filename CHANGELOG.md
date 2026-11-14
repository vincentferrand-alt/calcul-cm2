# Changelog

Règle : une entrée par version publiée. Les choix « raisonnables » pris sans poser de question sont notés ici.

## 0.14.1 — Corrections de l'audit
- Grammaire : « de » devient « d' » devant une voyelle ou un h muet partout (missions « Réussis 10 calculs d'additions », trophées « Réussir 20 calculs d'astuces… », objectif « Prochaine évolution d'Aurore », énigme « L'énigme d'Aurore »). Une seule fonction pure, js/fr.js (de / elide / badDe), testée sur les 8 familles et sur TOUS les textes de missions, trophées, fiches, créatures et objectifs (aucun « de » + voyelle / h muet).
- « Que faire maintenant ? » : une mission presque finie (≥ 60 %, pas encore faite) passe avant « faire grandir » ; sinon on alterne : si le bouton proposait « faire grandir » la fois précédente ce jour-là, il propose une mission jouable s'il y en a une. Logique pure dans js/next.js (playableMissions, whatNext(s, date, { last })), tests mis à jour.
- Calculs à revoir visibles : pastille orange avec le nombre (« 🎯 4 ») sur l'onglet Exercices, et carte « Calculs à revoir (4) » en haut de l'écran Exercices avec un bouton qui lance la série « à revoir » (au plus 10). Rien s'il n'y en a pas.
- iMac (≥ 900 px) : carte « Ma semaine » compacte sous la scène et l'objectif (7 pastilles du lundi au dimanche, jour actuel entouré, bonnes réponses de la semaine). Logique pure js/week.js (tests/week.test.mjs) ; invisible sur le téléphone. La scène de l'accueil iMac est un peu moins haute pour laisser la place.
- Barre d'onglets : libellés à .8rem (au lieu de .72rem) ; contrôle automatique « aucun libellé ne déborde » ajouté aux captures, avec une nouvelle taille 360 × 780.
- Double dépense entre appareils : si, après une fusion, les décors possédés coûtent plus que les étoiles gagnées, rien n'est retiré (les achats restent) et l'appli l'explique une fois dans le bandeau : « Tes deux appareils ont fait des achats en même temps : ton solde repart de 0, tu gardes tout ce que tu as acheté. » (le bandeau reste 14 s). Testé (tests/news.test.mjs) et dans le parcours flow-sync (deux achats simultanés, message unique). La boutique se redessine aussi après une synchro (solde à jour).
- Correctif trouvé pendant les captures : sous un calcul sans « = ? » (compléments, doubles, moitiés…), le mot « null » pouvait s'afficher sous la question. Corrigé.
- Choix : l'alternance « faire grandir » / mission avance à chaque affichage de l'accueil (mémorisée sur l'appareil, réglage lastNext, non synchronisée). Une mission « jouable » = pas finie et lançable maintenant (pas la dictée sans voix, pas « à revoir » s'il n'y a rien à revoir, pas « défi du jour » s'il est fait).
- Choix : la pastille compte TOUS les calculs à revoir du jour ; la série en lance au plus 10. h aspirés gardés avec « de » (hibou, héros, hérisson…).
- Choix : l'explication de la double dépense est donnée par l'appareil dont la fusion provoque le dépassement (chacun l'affiche au plus une fois, au moment où ça arrive) ; aucune donnée nouvelle dans la sauvegarde.

## 0.14.0 — Créatures vivantes, album, carnet de rêves, grand écran
- Créature interactive : un appui sur la créature de l'accueil ou de l'écran d'ouverture la fait réagir (petit saut à partir du stade « jeune », rebond pour l'œuf et le bébé), avec un son synthétisé déjà existant et une bulle d'encouragement. 20 phrases bienveillantes (3 par moment de la journée : matin, jour, soir, nuit, et 8 de tous les jours), qui changent selon l'heure, le jour et à chaque appui ; au plus une réaction toutes les 2 s. Animations réduites : la bulle seule, sans saut.
- Album plus lisible : cartes courtes en grille (scène, nom, barre, famille en pastille). Un appui ouvre la page de la créature (#/album/<id>) : sa scène, ce qui la fait grandir, « Faire grandir », « ▶ Revoir l'évolution », « Choisir comme compagnon », « 🛍️ Ses décors » (la boutique s'ouvre sur elle), et l'histoire de ses 4 formes — celles pas encore atteintes en silhouette ; un appui sur une forme atteinte la choisit comme forme affichée.
- Carnet de rêves 🌙 (depuis l'album) : chaque énigme du soir faite ajoute une carte souvenir — la créature endormie dans son décor sous un ciel de nuit, la date, le calcul de l'énigme. Cartes à feuilleter (glisser, flèches ‹ ›, ← → sur l'iMac), la plus récente d'abord.
- Sauvegarde (ajout additif, aucune migration destructive) : à la fin de l'énigme, eve[date] reçoit en plus c (créature), st (forme affichée, 0 = œuf), bg (décor), q, a, eq (le calcul). La fusion reste l'union des soirs : aucune carte n'est jamais perdue (testé, y compris commutativité et idempotence).
- Grand écran (≥ 900 px, l'iMac) : appli plus large, accueil en deux colonnes (scène et objectif à gauche ; « Que faire maintenant ? », défi du jour et missions à droite), album sur 4 colonnes, page de créature en deux colonnes, QCM et clavier numérique plus grands, raccourcis clavier visibles en petit (1-4, Entrée, Retour arrière ; Échap pour fermer l'énigme ou l'écran d'ouverture ; 1-4 répondent aussi à l'énigme du soir). Le téléphone en portrait ne change pas.
- Choix : sur l'écran d'ouverture, toucher la créature la fait réagir puis on entre tout seul ~3 s plus tard (toucher ailleurs entre tout de suite). L'attente de 2 s est propre à chaque scène. Après l'énigme faite sur l'écran d'ouverture, l'accueil est redessiné (créature endormie, plus de bouton 🌙).
- Choix : le souvenir est enregistré à la fin de l'énigme, réussie du premier coup ou non (comme l'étoile). Pour les anciennes entrées (v0.12, sans ces informations), la carte montre la créature compagnon (ou celle de l'accueil) avec sa forme et son décor actuels ; leur calcul est recalculé avec la même graine que l'énigme, au niveau actuel (il peut donc différer légèrement de celui posé ce soir-là). Ces anciennes entrées ne sont jamais réécrites.
- Tests : phrases et rythme des réactions (tests/cheer.test.mjs), carnet, anciennes entrées, données abîmées, fusion et lecture de toutes les sauvegardes de référence (tests/dreams.test.mjs) ; nouveau parcours tools/flow-soir.mjs (heure fixée à 19 h : réaction de la créature, énigme → carte du carnet, page de créature → ses décors, iMac en deux colonnes, touches 1 et Échap) ; captures tools/capture.mjs avec la série (QCM et saisie).

## 0.13.0 — Navigation et accueil
- Barre d'onglets fixe en bas de l'écran (à portée de pouce) : 🏠 Accueil · 🎯 Exercices · 🥚 Créatures · 🛍️ Boutique · 🏆 Trophées. Onglet actif en jaune, zones d'appui de 56 px, marge pour la barre système Android (safe-area). Cachée pendant une partie et sur l'écran du prénom ; l'écran d'ouverture et les fenêtres (évolution, énigme) passent par-dessus et la masquent. Les flèches retour restent pour les sous-écrans (fiche, Apprendre, réglages, jeu) ; les écrans d'onglet n'en ont plus.
- Nouvelles regroupées : à l'ouverture et après une synchro, trophées, évolutions et étoiles gagnées sur l'autre appareil arrivent dans UN seul bandeau court, en bas, au-dessus des onglets (jamais sur la scène) ; un appui mène au bon écran, ✕ pour le fermer, il se range seul après 8 s. Pendant une partie, les nouvelles attendent la fin ; les messages d'éclosion en cours de partie sont plus petits et plus brefs.
- Accueil : sous la scène, l'objectif de la créature affichée (« Prochaine évolution de Braise : encore 18 additions », barre de progression) ; un appui lance une série de sa famille. Œuf : « Encore 6 soustractions pour faire éclore l'œuf ». Stade maximum : l'autre créature la plus proche de grandir.
- Bouton « Que faire maintenant ? » : propose, dans l'ordre, le défi du jour s'il n'est pas fait, sinon les calculs à revoir (« 🎯 5 calculs à revoir », une série faite seulement d'eux), sinon la créature la plus proche d'évoluer, sinon une mission. Le bouton dit ce qu'il va lancer. Logique pure : js/next.js (tests/next.test.mjs).
- Fin de série : si une créature des familles jouées est à 10 bonnes réponses ou moins de grandir, « Encore 5 additions et Braise évolue ! » avec un bouton « Continuer » (série de cette famille). Les boutons « Rejouer » et « Retour » restent.
- Défi du jour : l'icône (« ✖ » ressemblait à une erreur) devient les symboles de ses familles en pastilles colorées (couleurs du générateur), pour tous les thèmes ; le grand mélange montre + − × ÷.
- Choix : « Apprendre » est rangé sous l'onglet Exercices (bouton « 💡 Apprendre : les fiches astuces »), sa flèche retour y ramène. Les gros boutons de menu de l'accueil sont remplacés par les onglets. Le numéro de version est en bas de l'accueil (et toujours dans Réglages).
- Choix : le bandeau mène aux Créatures s'il y a une évolution, sinon aux Trophées, sinon à la Boutique (étoiles). Une série « calculs à revoir » compte au plus 10 calculs. « Faire grandir » vise la créature au plus petit nombre de bonnes réponses manquantes (œufs compris) ; à égalité, l'ordre du bestiaire. Le compagnon choisi reste affiché même si une autre créature est plus avancée.
- Tests : objectif de l'accueil (tests/goal.test.mjs), « Que faire maintenant ? », regroupement des nouvelles et onglets (tests/news.test.mjs) ; parcours tools/flow-test.mjs (onglets, objectif, fin de série « Continuer ») et tools/flow-sync.mjs (bandeau unique, nuage ✓) ; captures tools/capture.mjs (384 × 824, 1200 × 800, 1600 × 1000, heure fixée jour et soir).

## 0.12.1 — Retours d'essai : évolution plus douce, « où gagner les bonnes réponses », animations
- Transformation : fondu enchaîné plus long (l'ancienne forme s'efface en 1,5 s pendant que la nouvelle apparaît en 1,9 s) ; texte et bouton arrivent ensuite. En mode animations réduites : fondu de 1,4 s au lieu de 0,6 s.
- Album : la ligne de progression dit maintenant dans quelle famille gagner les bonnes réponses (« Encore 18 bonnes réponses en additions pour devenir : jeune dragon ») ; n'importe quel mode compte (défi du jour, exercices, dictée, fiches). Nouveau bouton « 🎯 Faire grandir Braise : additions » qui lance directement une série de cette famille (retour à l'album). Même précision dans l'onglet « Forme » de la boutique.
- Animations : l'appli suivait le réglage « réduire les animations » du téléphone, souvent activé par le mode économie d'énergie sur Samsung, ce qui figeait la météo, les effets et les animaux achetés. Nouveau réglage « ✨ Animations » : Automatique (suit le téléphone) / Toujours / Réduites. Dans la boutique, si les animations sont coupées, un message l'explique avec un bouton « Les faire bouger quand même ».
- Choix : le réglage Animations est propre à chaque appareil (comme les sons), il n'est pas synchronisé.

## 0.12.0 — Créatures manga, transformation animée, énigme du soir
- Les 8 créatures sont désormais les 32 images manga (4 stades chacune), partout : accueil, ouverture, album, boutique, scène, fin de série. L'œuf reste en SVG ; l'ancien dessin SVG prend le relais si une image manque (testé en coupant une image).
- Détourage : fond vert uni → transparence (seuil sur le « vert en trop » avec tolérance, retrait du bruit JPEG, léger lissage du bord, désmélange de la couleur du fond et anti-débordement vert sur les contours ; lueurs, flammes et volutes du stade 4 conservées en semi-transparence). Recadrage identique (carré, créature centrée, posée sur la même ligne de sol), WebP 512 × 512 avec transparence dans assets/creatures/, pré-cachés pour le hors-ligne. Planches de contrôle sur fond sombre et clair vérifiées : aucune image écartée. Outils : tools/detour.py et tools/planche-creatures.py.
- Ombre douce au sol générée pour chaque image, dans un fichier séparé (<id>-<stade>-ombre.webp, ~2 Ko) calé sous les pattes : la créature paraît posée dans n'importe quel décor, et l'ombre ne « respire » pas avec elle.
- Transformation animée (sans vidéo) à l'éclosion / évolution, jouée sur l'écran de résultats : l'ancienne forme se charge de lumière, flash, fondu enchaîné vers la nouvelle forme avec léger grossissement, particules aux couleurs de la créature, son synthétisé. Bouton « ▶ Revoir l'évolution » dans l'album (vers la forme affichée). « Réduire les animations » : simple fondu.
- Énigme du soir 🌙 : à partir de 18 h, une fois par jour, la créature affichée pose un calcul bonus (QCM, dans sa famille de calcul et à son niveau) sur l'écran d'ouverture, avant de s'endormir (💤 sur la scène). Une étoile en cadeau. « Plus tard » pour entrer ; un bouton « 🌙 Énigme du soir » reste sur l'accueil tant qu'elle n'est pas faite. Nouveau trophée « Énigmes du soir » (1, 7, 20, 50).
- Choix : deux essais ; au 1er raté, un coup de pouce (jamais le résultat) ; au 2e, la réponse et l'astuce s'affichent et l'étoile est donnée quand même (récompense d'avoir cherché, jamais de punition). L'énigme du jour est la même sur les deux appareils et ne compte qu'une fois (sauvegarde eve = { date }, union à la fusion) ; son étoile s'ajoute au solde sans risque d'être perdue entre appareils. Elle ne modifie ni le niveau ni les calculs à revoir.
- Choix : les fichiers « K9 1…4 » du lot d'images sont attribués à la créature comp (kitsune aux pointes de feu, seul jeu sans identifiant) ; les ids de sauvegarde ne changent pas. Noms de formes et histoires ajustés aux nouveaux dessins (ex. tigre orange « Tigre gardien », chat « Chat esprit des glaces », comp devient « Kitsune de feu » car l'image a plus de 4 queues). Taille des stades à l'écran : 80 %, 88 %, 96 %, 100 % pour sentir la croissance.
- Poids : 39 Ko en moyenne par image (1,27 Mo pour les 32) ; les formes du stade 4, très détaillées avec leurs lueurs, pèsent 45 à 66 Ko (en dessous, la compression abîmait les flammes).

## 0.11.0 — Boutique de décors et scène animée
- La boutique 🛍️ vend désormais des DÉCORS (dessinés en SVG/CSS, originaux) : 8 fonds (prairie offerte, lac, forêt, plage, montagne, désert, banquise, nuit étoilée), 6 météos animées (feuilles, neige, pluie douce, vent, pétales, lucioles), 5 effets autour de la créature (étincelles, aura, cœurs d'étoiles, flammes, éclairs) et 6 petits animaux (papillons, oiseaux, libellules, petit lapin, poissons volants, chouette). Prix de 4 à 20 étoiles, croissants dans chaque rayon. Un appui sur une vignette pas encore achetée = un essai gratuit dans l'aperçu.
- Une « scène » unique (fond + météo + effet + petit animal + créature) sur l'accueil, l'écran d'ouverture, l'aperçu de la boutique et l'album.
- Pour chaque créature éclose : son décor (un fond, une météo, un effet, un animal) et sa forme affichée, choisie parmi les stades débloqués (onglet « Forme » de la boutique, ou les points sous chaque créature dans l'album). Ces choix sont dans la sauvegarde (synchronisés) ; entre deux appareils, le choix le plus récent gagne.
- Jour / soir / nuit automatiques selon l'heure réelle : soleil, coucher de soleil, lune et étoiles, lumière du paysage (sans rien acheter).
- Accessoires retirés de la boutique : leurs étoiles sont rendues automatiquement (solde = étoiles gagnées − prix des décors possédés). Rien n'est effacé : les achats d'accessoires restent dans la sauvegarde (ids inchangés) et le trophée « Garde-robe » déjà gagné est conservé (il n'affiche plus de prochain palier).
- Nouveau trophée « Décorateur » (1, 5, 12, 20 décors).
- Confort : 14 particules au plus (7 dans l'album), animations CSS en transform/opacité uniquement, arrêtées si « réduire les animations » est demandé, en pause quand l'appli passe en arrière-plan.
- Choix : le jour va de 8 h à 18 h, le soir de 18 h à 21 h (et de 6 h à 8 h, lumière d'aube), la nuit de 21 h à 6 h ; le fond « Nuit étoilée » est toujours de nuit. Les pétales sont blancs et dorés (pas de rose). Un seul fond, une météo, un effet et un animal à la fois par créature. Limite connue (inchangée) : si deux appareils achètent chacun un décor avec les mêmes étoiles, le solde est ramené à 0 (jamais négatif).

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
