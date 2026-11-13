// Réglage de la synchronisation téléphone <-> iMac (Firebase / Firestore).
// Tant que c'est `null`, l'appli fonctionne seule, sur l'appareil. Une clé web Firebase n'est pas un secret :
// c'est la règle de sécurité côté Firebase (firestore.rules) qui protège les données ; la clé est en plus restreinte au site de l'appli.
// Mode d'emploi : docs/firebase.md.
export const FIREBASE = {
  apiKey: "AIzaSyAq9oavjhUjBuiMDMFx_EUcdJUGd_Nic9A",
  projectId: "calcul-cm2-famille",
};
