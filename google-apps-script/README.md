# Connecter la réservation à Google Agenda (gratuit, ~5 min)

Le module de réservation du site fonctionne déjà en **mode démo** (créneaux
affichés, demande enregistrée → confirmation par téléphone). Pour qu'il
**écrive automatiquement les rendez-vous dans l'agenda Google d'Andréa** et
n'affiche que les **vrais créneaux libres**, il faut déployer une petite
« passerelle » Google Apps Script. Tout est gratuit, rien à héberger.

## Étapes

1. **Se connecter au compte Google d'Andréa** (celui dont l'agenda sert de planning).

2. Aller sur **https://script.google.com** → **Nouveau projet**.

3. Supprimer le contenu par défaut, **coller tout le contenu de `Code.gs`** (le fichier de ce dossier).

4. En haut du fichier, ajuster si besoin :
   - `CALENDAR_ID` : laisser `'primary'` pour l'agenda principal, ou mettre
     l'adresse e-mail d'un agenda dédié aux RDV.
   - `OPEN_HOURS` : les horaires d'ouverture (déjà réglés Lun–Sam 9h–19h).
   - `SALON_EMAIL` : mettre l'e-mail d'Andréa pour recevoir une copie de chaque RDV (optionnel).

5. Cliquer sur **Déployer → Nouveau déploiement**.
   - Type : **Application Web** (icône engrenage → « Application Web »).
   - « Exécuter en tant que » : **Moi** (Andréa).
   - « Qui a accès » : **Tout le monde**.
   - Cliquer **Déployer**, puis **Autoriser l'accès** (accepter les permissions Google Agenda).

6. Google affiche une **URL** qui se termine par **`/exec`**. **La copier.**

7. L'ouvrir dans `js/booking.js` du site et la coller dans :
   ```js
   var CONFIG = {
     apiUrl: 'https://script.google.com/macros/s/XXXXXXXX/exec',
     ...
   ```
   → **C'est cette URL qu'il faut me transmettre**, je fais le branchement.

## Ce que ça fait ensuite

- Le site lit l'agenda et n'affiche que les créneaux **réellement libres**.
- À la confirmation, un événement est créé dans l'agenda (titre = soin + nom du client, détails = téléphone, e-mail, message).
- Si le client a laissé son e-mail, il reçoit l'invitation Google (rappel automatique).

## Modifier plus tard

Si on change les horaires, la durée d'un soin ou un tarif : il suffit de
rééditer `Code.gs` (horaires) ou `js/booking.js` (liste des prestations), puis
**Déployer → Gérer les déploiements → modifier** pour republier.

> Astuce : à chaque modification du script, republier **le même déploiement**
> (Gérer les déploiements → crayon → Version : Nouvelle → Déployer) pour
> **garder la même URL**. Un « Nouveau déploiement » créerait une URL différente.
