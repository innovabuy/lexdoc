# PHASE 5B — PAGES PARAMÈTRES COMPLÈTES

## Statut : TERMINÉ

## Résumé

Phase 5B implémente les 3 pages de paramètres du cabinet : Arborescences (CRUD de modèles d'arborescence avec réordonnancement), Utilisateurs (gestion complète des membres avec invitation, rôles, désactivation), et Cabinet (formulaire enrichi avec logo, email, relances extranet, sécurité).

---

## PARTIE 1 — BACKEND : Arborescences (tree-templates)

### Routes `/api/tree-templates`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste des arborescences du tenant |
| GET | `/:id` | Détail d'une arborescence |
| POST | `/` | Créer une arborescence |
| PUT | `/:id` | Modifier une arborescence |
| DELETE | `/:id` | Supprimer une arborescence |
| POST | `/:id/set-default` | Définir comme défaut pour son folderType |
| PUT | `/:id/categories` | Mettre à jour l'ordre des catégories |

---

## PARTIE 2 — BACKEND : Utilisateurs (users)

### Routes `/api/users`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste des utilisateurs du tenant |
| GET | `/:id` | Détail d'un utilisateur |
| POST | `/` | Créer / inviter un utilisateur (ADMIN) |
| PUT | `/:id` | Modifier un utilisateur (ADMIN) |
| POST | `/:id/deactivate` | Désactiver un utilisateur (ADMIN) |
| POST | `/:id/activate` | Réactiver un utilisateur (ADMIN) |
| POST | `/:id/reset-password` | Réinitialiser le mot de passe (ADMIN) |

### Comportement
- Création : génère un mot de passe temporaire si non fourni, retourné dans la réponse
- Reset : génère un nouveau mot de passe temporaire
- Vérification limite d'utilisateurs (tenant.maxUsers)
- Protection : impossible de se désactiver soi-même
- Audit log pour chaque action

---

## PARTIE 3 — BACKEND : Paramètres cabinet (settings)

### Routes `/api/settings`
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Tenant + TenantSettings complets |
| PUT | `/tenant` | Modifier infos tenant (ADMIN) |
| PUT | `/preferences` | Modifier TenantSettings (ADMIN) |
| POST | `/logo` | Upload logo (multipart, ADMIN) |
| GET | `/logo` | Récupérer URL logo (redirect presigned) |
| DELETE | `/logo` | Supprimer logo (ADMIN) |

### Schema migration
Ajout de 4 champs à `TenantSettings` :
- `reminderDelay1 Int @default(3)` — jours avant 1re relance
- `reminderDelay2 Int @default(7)` — jours avant 2e relance
- `reminderDelay3 Int @default(14)` — jours avant 3e relance
- `reminderNotify Boolean @default(true)` — notifier le cabinet

---

## PARTIE 4 — FRONTEND : ArborescencesSettings

### Fonctionnalités
- Liste en cards avec nom, type (badge juridique/judiciaire), badge "Par défaut"
- Bouton "Nouvelle arborescence" → modale create
- Bouton "Modifier" par card → modale edit
- Bouton "Supprimer" → confirmation modale
- Bouton "Définir par défaut" (étoile)
- Liste des catégories avec numéro d'ordre
- Boutons ↑/↓ pour réordonner les catégories
- Ajout inline de catégorie (input + Enter)
- Suppression de catégorie par catégorie

---

## PARTIE 5 — FRONTEND : UtilisateursSettings

### Fonctionnalités
- Tableau avec colonnes : Utilisateur (avatar+nom+email), Rôle (badge couleur), Statut (dot actif/inactif), Dernière connexion, Actions
- Bouton "Inviter un utilisateur" → modale avec prénom, nom, email, téléphone, rôle, mot de passe optionnel
- Affichage du mot de passe temporaire après création (avec bouton copier)
- Bouton "Modifier" par ligne → modale edit
- Bouton "Réinitialiser mot de passe" → confirmation + affichage nouveau mot de passe
- Bouton "Désactiver" / "Réactiver" → confirmation modale
- Rôles : Administrateur, Avocat, Assistant(e), Utilisateur

---

## PARTIE 6 — FRONTEND : CabinetSettings

### Sections accordéon
1. **Informations du cabinet** : Logo upload/delete, nom, raison sociale, SIRET, toque, barreau, adresse, CP, ville, téléphone, email, site web, couleur principale (color picker)
2. **Configuration email** : Nom expéditeur, reply-to, signature HTML
3. **Relances extranet** : Toggle activer, délais 1re/2e/3e relance (jours), toggle notifier cabinet, toggle upload client, taille max fichier
4. **Sécurité** : Mots de passe forts, timeout session (minutes), 2FA obligatoire

### Comportement
- Chargement initial depuis GET /api/settings
- Sauvegarde unique "Enregistrer les paramètres" → PUT /settings/tenant + PUT /settings/preferences
- Upload logo séparé (POST /settings/logo en multipart)
- Sections repliables (accordéon) avec chevron animé
- Toggles stylisés

---

## FICHIERS CRÉÉS/MODIFIÉS

### Backend
- `prisma/schema.prisma` — MODIFIÉ : +4 champs TenantSettings (reminderDelay1/2/3, reminderNotify)
- `src/routes/tree-template.routes.js` — NOUVEAU : 155 lignes, CRUD arborescences
- `src/routes/user.routes.js` — NOUVEAU : 220 lignes, gestion utilisateurs
- `src/routes/settings.routes.js` — NOUVEAU : 200 lignes, paramètres cabinet + logo
- `src/routes/index.js` — MODIFIÉ : +6 lignes (import + register)

### Frontend
- `src/pages/parametres/ArborescencesSettings.jsx` — RÉÉCRIT : 366 lignes
- `src/pages/parametres/ArborescencesSettings.css` — NOUVEAU : 180 lignes
- `src/pages/parametres/UtilisateursSettings.jsx` — RÉÉCRIT : 437 lignes
- `src/pages/parametres/UtilisateursSettings.css` — NOUVEAU : 175 lignes
- `src/pages/parametres/CabinetSettings.jsx` — RÉÉCRIT : 428 lignes
- `src/pages/parametres/CabinetSettings.css` — NOUVEAU : 155 lignes

---

## TESTS ET VALIDATION

- **Backend tests** : 138/138 passent (9 suites)
- **Build frontend** : 1890 modules, 0 erreurs
- **Endpoints vérifiés** :
  - `GET /api/tree-templates` → 2 templates existants
  - `POST /api/tree-templates` → création OK, retourne ID
  - `PUT /api/tree-templates/:id` → modification OK
  - `POST /api/tree-templates/:id/set-default` → isDefault=true
  - `PUT /api/tree-templates/:id/categories` → réordonnancement OK
  - `DELETE /api/tree-templates/:id` → suppression OK
  - `GET /api/users` → 2 utilisateurs
  - `GET /api/settings` → tenant + settings avec reminderDelay1/2/3 + reminderNotify
  - `PUT /api/settings/preferences` → mise à jour reminder delays OK
  - `PUT /api/settings/tenant` → mise à jour infos cabinet OK

---

## CRITÈRES DE SUCCÈS

- [x] Arborescences : CRUD complet avec cards
- [x] Arborescences : Réordonnancement des catégories (↑/↓)
- [x] Arborescences : Badge "Par défaut" + bouton set-default
- [x] Arborescences : Ajout/suppression inline de catégories
- [x] Utilisateurs : Tableau avec avatar, rôle, statut
- [x] Utilisateurs : Invitation avec mot de passe temporaire
- [x] Utilisateurs : Modification rôle et infos
- [x] Utilisateurs : Désactivation/réactivation avec confirmation
- [x] Utilisateurs : Réinitialisation mot de passe
- [x] Cabinet : 4 sections accordéon (infos, email, relances, sécurité)
- [x] Cabinet : Upload/suppression logo
- [x] Cabinet : Configuration relances extranet (délais J+3/J+7/J+14)
- [x] Cabinet : Signature email HTML
- [x] Cabinet : Toggles sécurité (passwords forts, 2FA, session timeout)
- [x] Schema migration : +4 champs reminderDelay1/2/3, reminderNotify
- [x] Build sans erreur (1890 modules)
- [x] 138/138 tests passent
- [x] Rapport PHASE_5B_RESULT.md
