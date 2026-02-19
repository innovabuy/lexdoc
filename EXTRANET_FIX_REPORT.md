# Rapport de correction — Invitation Extranet

**Date :** 2026-02-18
**Serveur :** srv1361818 (76.13.50.173)

---

## Problemes identifies et corriges

### 1. Bouton d'invitation absent dans ClientDetailPage

**Probleme :** Aucun bouton "Inviter a l'extranet" n'existait dans la fiche client. Seul "Envoyer le formulaire" etait present.

**Correction :**
- **`frontend/src/pages/clients/ClientDetailPage.jsx`** — Ajout d'un bouton contextuel dans le header :
  - **"Inviter a l'extranet"** (bleu, icone Globe) — si le client a un email et n'a jamais ete invite
  - **"Reinviter extranet"** (outline, icone RefreshCw) — si deja invite mais pas encore active
  - **"Extranet actif"** (badge vert, icone CheckCircle) — si le profil est soumis
- **`frontend/src/services/clientsApi.js`** — Ajout de la fonction `inviteExtranet(id)` qui appelle `POST /api/clients/:id/invite-extranet`

### 2. Lien d'activation dans l'email cassé (corrigé session précédente)

**Probleme :** Le lien email utilisait `primaryToken` (stocke dans `client.invitationToken`) mais les endpoints `verify-token` et `activate` cherchent dans `clientAccess.activationToken`. Le lien ne fonctionnait jamais.

**Correction :**
- **`backend/src/routes/client.routes.js`** — Le lien email utilise maintenant le token du premier dossier (`firstFolderToken`)
- **`backend/src/routes/extranet.routes.js`** — L'activation active maintenant **tous les acces** du meme email (multi-dossier)

### 3. CLIENT_PORTAL_URL non defini

**Probleme :** L'env var `CLIENT_PORTAL_URL` n'etait pas definie. Le lien d'activation pointait vers `http://localhost:5173` au lieu du vrai serveur.

**Correction :**
- **`backend/.env`** — Ajout de `CLIENT_PORTAL_URL=http://76.13.50.173`
- Le lien genere est maintenant `http://76.13.50.173/extranet/activate/:token`

---

## Tests effectues

### SMTP
```
EMAIL ENVOYE: <d8a3002b-69b9-f5a8-2caa-1537aa78051f@gmail.com>
Config: smtp.gmail.com:587, user=jfper54@gmail.com
```

### Flow complet invitation (client StartupX — hello@startupx.fr)

| Etape | Endpoint | Resultat |
|-------|----------|----------|
| Invitation | `POST /clients/:id/invite-extranet` | 6 ClientAccess crees, 3 rappels (J+3, J+7, J+14) |
| Verify token | `GET /extranet/verify-token/:token` | Token valide, retourne nom client + dossier + tenant |
| Activation | `POST /extranet/activate` | Compte active, JWT retourne, **6/6 acces actives** |
| Login | `POST /extranet/login` | OK avec email + mot de passe |
| Multi-dossiers | `GET /extranet/me/folders` | **6 dossiers accessibles** |

### Flow invitation avec email reel (client InnovCo — contact@innovco.fr)
```
activationUrl: http://76.13.50.173/extranet/activate/73035847e8...
email: contact@innovco.fr
foldersCount: 9
remindersCreated: 3
```
Pas d'erreur dans les logs — email envoye avec succes.

### Frontend build
```
frontend build: OK (6.78s)
ClientDetailPage-Cq7h_cH5.js: 15.40 kB
```

---

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `frontend/src/pages/clients/ClientDetailPage.jsx` | Ajout bouton extranet (3 etats), handler `handleInviteExtranet`, imports Globe/CheckCircle/RefreshCw |
| `frontend/src/services/clientsApi.js` | Ajout `inviteExtranet(id)` |
| `backend/src/routes/client.routes.js` | Fix: lien email utilise `firstFolderToken` au lieu de `primaryToken` |
| `backend/src/routes/extranet.routes.js` | Fix: activation multi-dossier (updateMany sur tous les acces du meme email) |
| `backend/.env` | Ajout `CLIENT_PORTAL_URL=http://76.13.50.173` |

---

## Statut final

- [x] Bouton visible dans la fiche client si email present
- [x] 3 etats : Inviter / Reinviter / Actif
- [x] SMTP fonctionne (Gmail, port 587)
- [x] Endpoint invite-extranet envoie l'email
- [x] Lien d'activation pointe vers http://76.13.50.173
- [x] Activation multi-dossier fonctionne
- [x] Frontend build OK
- [x] Backend redemarré
