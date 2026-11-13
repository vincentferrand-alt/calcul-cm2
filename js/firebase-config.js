// Réglage de la synchronisation téléphone <-> iMac (Firebase / Firestore).
// Tant que c'est `null`, l'appli fonctionne seule, sur l'appareil. Une clé web Firebase n'est pas un secret :
// c'est la règle de sécurité côté Firebase (firestore.rules) qui protège les données.
// Pour activer : voir docs/firebase.md, puis remplacer null par { apiKey: "…", projectId: "…" }.
export const FIREBASE = null;
