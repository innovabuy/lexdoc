# PHASE 5 — EXTRANET CLIENT

## Statut : TERMINÉ

## Résumé

Phase 5 implémente l'extranet client complet : interface dédiée pour les clients du cabinet (login, activation, wizard profil 5 étapes), accès aux dossiers/documents, relances automatiques, et notifications in-app côté cabinet.

---

## PARTIE 1 — BACKEND : Auth & Routes Extranet

### Routes publiques (pas d'auth)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/extranet/activate` | Activation compte (token + mot de passe → retourne JWT) |
| POST | `/api/extranet/login` | Connexion client (retourne JWT + profileCompletionPercent) |
| GET | `/api/extranet/verify-token/:token` | Vérification token d'activation |

### Routes client authentifié
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/extranet/me` | Données actuelles du client |
| GET | `/api/extranet/me/profile` | Profil complet du client |
| GET | `/api/extranet/me/profile/completeness` | { percent, missing[], step } |
| PATCH | `/api/extranet/me/profile/step/:step` | Sauvegarde progressive par étape (1-4) |
| POST | `/api/extranet/me/profile/submit` | Validation finale |
| GET | `/api/extranet/me/folders` | Dossiers accessibles (multi-dossier) |
| GET | `/api/extranet/me/folders/:id/documents` | Documents visibles (extranet=ON) |
| GET | `/api/extranet/me/documents/:id/download` | Télécharger un document |

### Routes cabinet (gestion extranet)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/clients/:id/invite-extranet` | Envoyer invitation extranet |
| POST | `/api/clients/:id/remind-extranet` | Relancer manuellement |
| GET | `/api/extranet/admin/activity` | Activité récente des clients extranet |

### Étapes du wizard profil
- **Étape 1 — Identité** : civilité, nom, prénom, date naissance, lieu naissance, nationalité, profession, sécu
- **Étape 2 — Coordonnées** : adresse perso, code postal, ville, téléphone, adresse pro
- **Étape 3 — Situation familiale** : situation, conjoint (conditionnel si marié/pacsé), régime matrimonial, enfants
- **Étape 4 — Filiation** : nom/prénom père, nom/prénom mère
- **Étape 5 — Vérification** : récapitulatif + envoi

### Calcul de complétude
- 10 champs requis répartis sur 4 étapes
- Chaque champ rempli = ~10% (arrondi)
- Champs requis : civilité, nom, prénom, dateNaissance, adresse, CP, ville, situationFamiliale, pereNom, mereNomJeuneFille

---

## PARTIE 2 — FRONTEND : Extranet Client

### Routes (Option A — même app Vite, layout différent)
```
/extranet/login                → ExtranetLogin
/extranet/activate/:token      → ExtranetActivate
/extranet/dashboard            → ExtranetDashboard (ExtranetLayout)
/extranet/profile              → ExtranetProfileWizard (ExtranetLayout)
/extranet/folders/:folderId    → ExtranetFolderView (ExtranetLayout)
```

### ExtranetLayout
- Navbar simplifiée : logo cabinet + nom client + déconnexion
- Menu horizontal : Mes dossiers | Mon profil
- Footer : coordonnées cabinet
- Design épuré, fond blanc, accents bleus

### ExtranetLogin
- Formulaire email/password sobre
- Redirection auto vers wizard si profil incomplet

### ExtranetActivate
- Vérification token valide
- Formulaire mot de passe (12 chars, majuscule, minuscule, chiffre)
- Confirmation + activation → JWT retourné → redirect profil

### ExtranetProfileWizard
- Écran d'accueil avec progression et aperçu des étapes
- 4 étapes de formulaire avec sauvegarde progressive (PATCH par étape)
- Champs conditionnels étape 3 (conjoint visible si marié/pacsé)
- Étape 5 vérification : récapitulatif avec bouton "Modifier" par section
- Bouton "Envoyer mes informations" → POST submit
- Écran de succès après soumission

### ExtranetDashboard
- Liste des dossiers accessibles avec nombre de documents
- Bouton "Consulter" par dossier

### ExtranetFolderView
- Liste des documents avec toggle extranet=ON uniquement
- Statut, date, bouton Télécharger
- Navigation retour vers dashboard

---

## PARTIE 3 — RELANCES AUTOMATIQUES

### Service `reminder.service.js`
- `processPendingReminders()` : traite les ClientReminder en attente
- Vérifie si le profil est déjà complété → annule si oui
- Envoie l'email de rappel via emailService
- Met à jour le status et crée un TimelineEvent

### Création automatique à l'invitation
- POST `/api/clients/:id/invite-extranet` crée 3 ClientReminder :
  - J+3, reminderNumber: 1
  - J+7, reminderNumber: 2
  - J+14, reminderNumber: 3
- Quand le client soumet sa fiche → toutes les relances pending sont annulées

---

## PARTIE 4 — NOTIFICATIONS IN-APP

### Nouveaux types de notification
- `CLIENT_STEP_COMPLETED` : créé quand le client complète une étape du wizard
- `CLIENT_PROFILE_COMPLETE` : créé quand le client soumet sa fiche complète

### Composant NotificationBell
- Icône cloche dans la sidebar du cabinet (à côté de l'avatar)
- Badge rouge avec nombre de non-lues
- Polling toutes les 30 secondes
- Dropdown au clic : liste des 10 dernières notifications
- Actions : marquer comme lu, tout marquer lu
- Navigation vers la fiche client au clic

### Intégration
- NotificationBell ajouté dans Sidebar.jsx (section utilisateur)
- Utilise les routes existantes : GET /notifications, POST /notifications/:id/read, POST /notifications/mark-all-read

---

## FICHIERS CRÉÉS/MODIFIÉS

### Backend
- `src/routes/extranet.routes.js` — MODIFIÉ : +200 lignes (profile, folders, admin routes, JWT à l'activation)
- `src/routes/client.routes.js` — MODIFIÉ : +130 lignes (invite-extranet, remind-extranet)
- `src/services/reminder.service.js` — NOUVEAU : service de relances automatiques
- `prisma/schema.prisma` — MODIFIÉ : +2 NotificationType (CLIENT_STEP_COMPLETED, CLIENT_PROFILE_COMPLETE)

### Frontend
- `src/contexts/ExtranetAuthContext.jsx` — NOUVEAU : contexte auth client séparé
- `src/services/extranetApi.js` — NOUVEAU : API service extranet
- `src/components/layout/ExtranetLayout.jsx` — NOUVEAU : layout extranet
- `src/components/layout/ExtranetLayout.css` — NOUVEAU
- `src/components/layout/NotificationBell.jsx` — NOUVEAU : cloche de notification
- `src/components/layout/NotificationBell.css` — NOUVEAU
- `src/pages/extranet/ExtranetLogin.jsx` — NOUVEAU
- `src/pages/extranet/ExtranetActivate.jsx` — NOUVEAU
- `src/pages/extranet/ExtranetAuth.css` — NOUVEAU
- `src/pages/extranet/ExtranetProfileWizard.jsx` — NOUVEAU
- `src/pages/extranet/ExtranetProfileWizard.css` — NOUVEAU
- `src/pages/extranet/ExtranetDashboard.jsx` — NOUVEAU
- `src/pages/extranet/ExtranetDashboard.css` — NOUVEAU
- `src/pages/extranet/ExtranetFolderView.jsx` — NOUVEAU
- `src/pages/extranet/ExtranetFolderView.css` — NOUVEAU
- `src/App.jsx` — MODIFIÉ : +30 lignes (extranet routes + ExtranetAuthProvider)
- `src/components/layout/Sidebar.jsx` — MODIFIÉ : ajout NotificationBell

---

## TESTS ET VALIDATION

- **Backend tests** : 138/138 passent (9 suites)
- **Build frontend** : 1887 modules, 0 erreurs
- **Endpoints vérifiés** :
  - `POST /api/extranet/login` → 401 Invalid credentials (correct, pas de compte)
  - `GET /api/extranet/verify-token/:token` → valid=true
  - `POST /api/extranet/activate` → JWT retourné + profileCompletionPercent
  - `GET /api/extranet/me/profile` → profil complet
  - `GET /api/extranet/me/profile/completeness` → { percent: 20%, step: 1, missing: 8 }
  - `PATCH /api/extranet/me/profile/step/1` → percent: 40% (après sauvegarde étape 1)
  - `GET /api/extranet/me/folders` → 1 dossier accessible
  - `GET /api/extranet/me/folders/:id/documents` → 0 documents (aucun visible extranet)
  - `POST /api/clients/:id/invite-extranet` → invitation envoyée + 3 relances créées
  - `GET /api/notifications/unread-count` → 1 (notification step_completed)
  - `GET /api/extranet/admin/activity` → logs d'activité

---

## CRITÈRES DE SUCCÈS

- [x] Auth client séparée (JWT distinct, type='client')
- [x] Activation par token + création mot de passe + retour JWT
- [x] Wizard 5 étapes avec sauvegarde progressive
- [x] Champs conditionnels (situation familiale → conjoint)
- [x] Dashboard client avec dossiers/documents
- [x] Uniquement documents avec toggle ON visibles
- [x] Relances automatiques créées à l'invitation (J+3, J+7, J+14)
- [x] Notifications in-app côté cabinet (CLIENT_STEP_COMPLETED, CLIENT_PROFILE_COMPLETE)
- [x] Cloche de notification fonctionnelle (badge + dropdown + polling)
- [x] Build sans erreur (1887 modules)
- [x] Rapport PHASE_5_RESULT.md
