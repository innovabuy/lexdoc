# PHASE 4 — INTÉGRATIONS DOCUSIGN + SENDINGBOX

## Statut : TERMINÉ

## Résumé

Phase 4 implémente les intégrations DocuSign EU (OAuth2 + signature électronique) et SendingBox (envoi recommandé LR/LRAR), avec webhooks de suivi, modales frontend, page d'intégrations dans les paramètres, et activation des boutons d'action sur les documents.

---

## PARTIE 1 — DOCUSIGN EU

### Service DocuSign (`services/docusign.service.js`)
- `getAuthorizationUrl(state)` → URL OAuth2 d'autorisation
- `exchangeCodeForToken(code)` → { accessToken, refreshToken, expiresIn }
- `refreshAccessToken(refreshToken)` → Refresh tokens
- `getUserInfo(accessToken)` → { name, email, accountId, accountName }
- `sendEnvelope(accessToken, params)` → { envelopeId }
  - Supporte : signataires multiples, routing order, expiration, webhook notification
- `getEnvelopeStatus(accessToken, envelopeId)` → Statut de l'enveloppe
- `downloadSignedDocument(accessToken, envelopeId)` → Buffer du document signé

### Routes DocuSign (`routes/docusign.routes.js`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/integrations/docusign/auth-url` | URL d'autorisation OAuth2 |
| GET | `/api/integrations/docusign/callback` | Callback OAuth2 (échange code → tokens → redirige frontend) |
| GET | `/api/integrations/docusign/status` | { connected, accountName, connectedAt } |
| POST | `/api/integrations/docusign/disconnect` | Supprime tokens DocuSign |
| POST | `/api/documents/:id/sign` | Envoie document à la signature |
| POST | `/api/documents/:id/send-registered` | Estimation coût envoi recommandé |
| POST | `/api/documents/:id/send-registered/confirm` | Confirmation et envoi effectif |

### Webhook DocuSign (`webhooks/docusign`)
- POST `/api/webhooks/docusign` — Reçoit les notifications DocuSign Connect
- Statuts gérés : completed → signe, declined/voided → annulé
- Actions automatiques :
  - Met à jour SignatureRequest et Document
  - Télécharge le document signé et le stocke dans MinIO
  - Met à jour DocumentTracking
  - Crée un AuditLog

---

## PARTIE 2 — SENDINGBOX

### Routes SendingBox (`routes/sendingbox.routes.js`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/integrations/sendingbox/status` | { connected, maskedKey } |
| PUT | `/api/integrations/sendingbox` | Sauvegarde la clé API |

### Envoi recommandé (dans `docusign.routes.js`)
- `POST /api/documents/:id/send-registered` — Estimation (valide adresse, retourne coût)
- `POST /api/documents/:id/send-registered/confirm` — Envoi effectif via API SendingBox

### Webhook SendingBox (existant)
- Le webhook existant dans `webhook.routes.js` gère déjà les statuts : PREPARING, SENT, IN_TRANSIT, DELIVERED, RETURNED, ERROR

---

## PARTIE 3 — PRISMA SCHEMA

### Champs ajoutés à TenantSettings
```
docusignAccessToken    String?  @db.Text
docusignRefreshToken   String?  @db.Text
docusignAccountId      String?
docusignAccountName    String?
docusignConnectedAt    DateTime?
sendingboxApiKey       String?
sendingboxConnectedAt  DateTime?
```

---

## PARTIE 4 — FRONTEND

### SignatureModal (`components/documents/SignatureModal.jsx`)
- Signataires pré-remplis depuis les personnes du dossier
- Ajout/suppression de signataires
- Options : ordre (parallèle/séquentiel), expiration (3-60 jours), message
- Envoi via `POST /api/documents/:id/sign`

### RegisteredMailModal (`components/documents/RegisteredMailModal.jsx`)
- Sélection type LR / LRAR
- Sélection destinataire parmi les personnes du dossier
- Vérification d'adresse automatique
- Affichage du coût estimé
- Double confirmation (popup de confirmation irréversible)

### IntegrationsSettings (`pages/parametres/IntegrationsSettings.jsx`)
- Carte DocuSign EU : statut connecté/déconnecté, bouton Connecter/Déconnecter
- Carte SendingBox : statut, champ clé API avec sauvegarde
- Détection callback DocuSign via URL params (`?docusign=connected`)

### Boutons activés dans DocumentRow
- Menu contextuel (···) ajouté sur chaque document avec :
  - "Envoyer à la signature" → ouvre SignatureModal
  - "Envoyer en LRAR" → ouvre RegisteredMailModal (type LRAR)
  - "Envoyer en LR simple" → ouvre RegisteredMailModal (type LR)

### SignaturesTab amélioré
- Boutons d'action sur chaque carte de signature :
  - Relancer (POST /signatures/:id/resend) — visible si envoye/partiellement_signe
  - Annuler (DELETE /signatures/:id) — visible si envoye/partiellement_signe

---

## FICHIERS CRÉÉS/MODIFIÉS

### Backend
- `src/services/docusign.service.js` — NOUVEAU : service DocuSign complet
- `src/routes/docusign.routes.js` — NOUVEAU : OAuth2 + sign + send-registered
- `src/routes/sendingbox.routes.js` — NOUVEAU : status + save API key
- `src/routes/webhook.routes.js` — MODIFIÉ : webhook DocuSign ajouté
- `src/routes/index.js` — MODIFIÉ : registration des nouvelles routes
- `prisma/schema.prisma` — MODIFIÉ : champs DocuSign/SendingBox dans TenantSettings
- `.env` — MODIFIÉ : variables DocuSign ajoutées

### Frontend
- `src/services/integrationsApi.js` — NOUVEAU : API service pour intégrations
- `src/components/documents/SignatureModal.jsx` — NOUVEAU
- `src/components/documents/SignatureModal.css` — NOUVEAU
- `src/components/documents/RegisteredMailModal.jsx` — NOUVEAU
- `src/components/documents/RegisteredMailModal.css` — NOUVEAU
- `src/pages/parametres/IntegrationsSettings.jsx` — RÉÉCRIT : page complète
- `src/pages/parametres/IntegrationsSettings.css` — NOUVEAU
- `src/pages/folders/FolderDetailPage.jsx` — MODIFIÉ : imports, états, modales, DocumentRow context menu, SignaturesTab actions
- `src/pages/folders/FolderDetailPage.css` — MODIFIÉ : styles context menu

---

## TESTS ET VALIDATION

- **Backend tests** : 138/138 passent (9 suites)
- **Build frontend** : 1873 modules, 0 erreurs
- **Endpoints vérifiés** :
  - `GET /api/integrations/docusign/auth-url` → URL OAuth2 valide
  - `GET /api/integrations/docusign/status` → { connected: false }
  - `GET /api/integrations/sendingbox/status` → { connected: false }
  - `GET /api/webhooks/docusign` → "DocuSign webhook endpoint ready"
  - `GET /api/webhooks/universign` → "Universign webhook endpoint ready"
  - `GET /api/webhooks/sendingbox` → "SendingBox webhook endpoint ready"

---

## CRITÈRES DE SUCCÈS

- [x] Service DocuSign avec OAuth2 + envoi + webhook
- [x] Service SendingBox avec envoi + validation adresse + webhook
- [x] Modal signature fonctionnelle
- [x] Modal recommandé avec double confirmation
- [x] Page intégrations dans les paramètres
- [x] Boutons activés dans le menu contextuel documents
- [x] Onglet Signatures avec actions (relancer/annuler)
- [x] Webhooks endpoints créés (Universign + SendingBox + DocuSign)
- [x] Build sans erreur
- [x] Rapport PHASE_4_RESULT.md
