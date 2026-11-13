# Synchronisation téléphone ↔ iMac (Firebase)

L'appli fonctionne seule, sans rien de tout ça. Cette étape sert uniquement à retrouver les trophées et les créatures sur plusieurs appareils.
Plan gratuit « Spark » (aucune carte bancaire, aucune facture possible).

1. Console : https://console.firebase.google.com (compte Google) → **Créer un projet** → nom au choix (ex. `calcul-cm2-famille`) → désactiver Google Analytics → Créer.
2. **Build → Firestore Database → Créer une base de données** → emplacement `eur3 (Europe)` → mode **Production** → Activer.
3. Onglet **Règles** → remplacer tout le contenu par celui du fichier `firestore.rules` de ce dépôt → **Publier**.
4. **Paramètres du projet** (roue dentée) → **Général** → « Vos applications » → icône **Web `</>`** → surnom `calcul-cm2` → ne pas cocher Hosting → Enregistrer. Relever `apiKey` et `projectId`.
5. Dans `js/firebase-config.js`, remplacer `null` par `{ apiKey: "…", projectId: "…" }`. La clé web Firebase n'est pas un secret (la protection, ce sont les règles).
6. (Conseillé) Console Google Cloud → **API et services → Identifiants** → la clé « Browser key » → **Restrictions relatives aux applications : Sites web** → ajouter `https://vincentferrand-alt.github.io/*` → Enregistrer.
7. Sur chaque appareil : Réglages → Synchronisation. Il faut le **même prénom et le même code secret** sur les deux appareils.

Si l'écran Réglages affiche un message d'erreur, il dit quoi corriger (base non créée, règles, clé…).
