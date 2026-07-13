# Reprise session — 2026-05-19

## 2026-07-13 — GO-LIVE-2 durcissement (2.A secrets + 2.A-bis MinIO)

**2.A** : mot de passe PostgreSQL rotaté (dev → aléatoire fort), retiré des fichiers trackés (`docker-compose.dev.yml`, `.env.example`, RAPPORT md — ancien mdp défunt reste dans l'historique, purge non faite volontairement). Tous les `.env` en 600. JWT_SECRET/ENCRYPTION_KEY OK (64 hex), jamais dans l'historique.

**2.A-bis (P0)** : **MinIO était exposé `0.0.0.0:9003/9004`** avec clés dev = documents cabinet sur l'internet public. Corrigé : conteneur recréé (standalone `docker run`, pas compose) en **`127.0.0.1` uniquement** + **clés root rotatées** (48 car.). Vérifié : externe injoignable, docs existants lisibles (download OK), génération/upload OK, backup cron non touché (n'accède pas à MinIO). Compose nettoyé (127.0.0.1 + env-var).

**2.A-ter (fermeture réseau, P0)** : Docker **bypasse UFW** (INPUT DROP inefficace sur les ports publiés) → Postgres 5434, Redis 6379, backend 4000 étaient **réellement joignables de l'internet**. Redis : **sans `requirepass`, DBSIZE=0, absent de la stack/code** (résidu depuis le 2 juin) — RCE potentiel. **Aucun signe de compromission** (authorized_keys root = 1 clé légitime, crontab propre, Redis vide sans clés d'attaque). Fermés : Redis + Postgres recréés en `127.0.0.1`, backend `server.js` bind `127.0.0.1` (HOST surchargeable). Vérifié externe injoignable, app OK via nginx :80, génération OK, cron backup OK, 208/208. **Récap `ss` : seuls 22 (ssh) + 80 (nginx) sur 0.0.0.0.** → **Redis : proposer sa SUPPRESSION** (résidu inutilisé).

**2.C (backups)** : mystère des **9 dumps à 334 834 o identiques ÉLUCIDÉ avec preuve** — un dump suspect (06/07) **restaure parfaitement** (42 tables, comptes = live) → script **PAS cassé**. Tailles identiques = **base figée** (aucune écriture 6→12 juillet), pg_dump `-Fc` déterministe. Rétention 7 j OK. Script **durci** (`ops/backup.sh`, déployé) : `set -uo pipefail`, plancher de taille, vérif intégrité `pg_restore -l`, **échec BRUYANT** (log + `logger` + mail) — fini le faux « OK » silencieux. **Trou majeur comblé : MinIO (documents) désormais sauvegardé** (`minio_*.tar.gz`, ~24 Mo). Procédure `ops/RESTORE.md` (testée : DB + MinIO restaurables). ⚠️ **Backups sur le MÊME serveur = pas de DR** : réplication hors-site requise avant go-live (proposé, non fait).

### 🛡️ PRINCIPE PERMANENT — Docker bypasse UFW (cause racine 2.A-quater)
**Sur ce serveur, UFW ne protège PAS les conteneurs Docker.** Mécanisme : la chaîne `FORWARD` saute vers `DOCKER-USER` puis `DOCKER-FORWARD` (règles ACCEPT générées par `-p`) **avant** les chaînes `ufw-*`. Un port publié en `-p PORT:PORT` (nu) est donc joignable de l'internet même avec UFW en `INPUT DROP`. C'est UNE erreur systémique (elle avait ouvert MinIO, Redis, Postgres, backend).
**RÈGLE ABSOLUE : tout port Docker publié DOIT l'être en `127.0.0.1:port` — jamais `-p port:port` nu.** C'est la barrière fiable (docker-proxy n'écoute alors pas sur 0.0.0.0).
Défense en profondeur ajoutée : règle `DOCKER-USER` (DROP `eth0`→conteneurs sauf ESTABLISHED), persistée par le service systemd `docker-user-firewall.service` (réappliquée à chaque restart Docker). Fichiers versionnés : `ops/system/`. Elle bloque le chemin kernel FORWARD d'un vrai client externe, mais **ne remplace pas la convention 127.0.0.1** (le userland-proxy ne peut PAS être désactivé ici : ça casserait l'accès hôte→`127.0.0.1:conteneur`, méthode de connexion de l'app). Test hôte→IP-propre non probant (passe par docker-proxy, hors FORWARD) — dit franchement.

### ⚠️ CONSTATS À TRACER (hors périmètre)
1. **222 / 242 documents ont un `objectKey` orphelin** (fichier absent du volume MinIO `/opt`), **tous antérieurs à mai 2026** (données test/démo purgées). Les documents récents/réels sont tous présents et lisibles. Pré-existant (pas la rotation). → auditer/nettoyer les records DB orphelins avant go-live.

## 2026-07-12 (suite) — Assignation en référé mappée + dette Q21 assainie

**Template `assignation_refere_commerce`** : `.docm` (macros perso inertes retirées) → `.docx` → mapping **run-aware** (texte-seul, `rPr`/`pPr` intacts) → `.template.docx`. Identité demanderesse ET adverse en **rendu conditionnel PP/PM** (`{#..._est_morale}…{/}`), cabinet en dur (§19) remplacé par `cabinet.*`/`avocat.*`, champs huissier laissés vides. Enregistré tenant-scoped (seed `prisma/seeds/pragmavox_assignation.sql`, id `cml-pragmavox-assignation-refere-tc-v1`). Validé end-to-end PM + PP : zéro `{}` résiduel, zéro parenthèse orpheline, grammaire correcte (« Jean Dupont, demeurant… » en PP, pas de « société  au capital de  € »).

**Bonus MED** corrigés : « € euros » (facture/somme) et « Société {adversaire_denomination} » (doublon).

**Dette Q21 (`client.capital` String) assainie côté AFFICHAGE** (pas de migration) : `normalizeCapital()` retire `€`/`euros` en `collectData` (un seul point → `{client_capital}` + `{client_capital_social}`). Les templates gardent « euros » en dur. Q21 (colonne String) reste ouverte.

### ⚠️ CONSTAT À TRACER — « validé » ≠ « code passe »
La mise en demeure était réputée **validée** alors qu'elle produisait **« au capital de 100 000 € euros »** sur un client réel (`client.capital = "100 000 €"` en base). Le bug n'avait jamais été vu car personne n'avait relu le document GÉNÉRÉ sur données réelles — seul le code « passait ».
→ **Un template n'est validé que lorsqu'un humain a lu le document généré en entier, sur des données réelles.** Avant go-live : relire intégralement les 3 documents Pragma Vox (lettre de mission, mise en demeure, assignation) générés sur de vraies données cabinet.

## 2026-07-12 — GO-LIVE-1.B livré (adversaire personne morale) + hygiène

**Commit `2230262`, tag `v0.4.0-golive-1b` (poussé).** Modèle adversaire personne morale + champs orphelins de l'assignation en référé.
- `FolderPerson` : +4 colonnes nullable (`formeSociale`, `capital` [**Int centimes**, ≠ dette Q21 `client.capital` laissée en String], `villeImmatriculation`, `numeroImmatriculation`). Migration additive `20260712155411`, non destructive.
- `collectData` : `parties_adverses` expose les champs PM (vides si physique → zéro régression), `postulant.adresse`, champs calculés en toutes lettres (`date_annee_lettres`, `dossier.date_audience_lettres`, `dossier.heure_audience`), pré-init `additionalData` (`tribunal_ville/adresse`, `montant_article_700`, `date_mise_en_demeure`).
- Helpers purs extraits dans `backend/src/utils/legal-format.js` (testables isolément). Catalogue variables 83 → 97.
- Front : saisie conditionnelle PM (`FolderPersons.jsx` + `FolderCreateWizard.jsx`), capital saisi en euros → converti en centimes.
- Qualité : 188/188 tests unitaires ; 8/8 smoke tests HTTP après migration ; backup pré-migration (`pg_dump` SQL 1 085 642 o) restauré et vérifié dans une base jetable.
- Prochaine étape : **GO-LIVE-1.C** = mapping du template `assignation_refere_commerce.docm` (poser les tags, run splitting mixte à traiter).

### ⚠️ ITEM À TRACER — BACKUPS CRON NON VÉRIFIÉS (à faire en phase infra)
Le test de restauration de GO-LIVE-1.B a porté sur un **dump manuel** (SQL brut, 1 085 642 o), **PAS** sur un dump du cron (`/opt/backups/lexdoc/*.backup`, format `-Fc`, **334 834 o**). Les 9 derniers dumps automatiques font **tous exactement la même taille** alors que la base a évolué — anormal même pour du `-Fc` compressé.
→ **À FAIRE** : restaurer un dump CRON réel dans une base jetable et confirmer qu'il contient bien les tables + données. **Tant que ce n'est pas fait, la sauvegarde automatique est présumée NON FIABLE** (prérequis go-live P0 backup, cf. Q8).

## 2026-05-19 (soir) — Pré-démo Pragmavox : audit ciblé + diagnostic flux 6 corrigé

**Audit transversal du matin** : 5 ruptures UX listées sur le flux 6, dont rupture #1 "client sélectionné en étape 1 du wizard pas auto-ajouté comme partie". **Ce diagnostic était factuellement faux.** Smoke test API direct (POST `/api/folders/wizard` avec un clientId Pragmavox réel) → `folder_persons` contient bien une ligne `role=CLIENT` avec le `clientId` qui matche. Le wizard fait déjà l'auto-ajout depuis `backend/src/controllers/folder.controller.js:775-787` (étape 5 de la transaction `createWizard`). Confirmation aussi côté BDD : dossier le plus récent Pragmavox (2026-03-30 "Audit Final — Procédure 2026") a 1 FolderPerson role=CLIENT. Pas de fix code livré ; la "rupture" n'existait pas. **L'agent flux 6 a regardé `create` (POST `/api/folders` direct) et pas `createWizard` (POST `/api/folders/wizard`)** ; les deux chemins divergent — le simple ne fait pas l'auto-ajout, mais aucun consommateur en prod ne l'appelle (frontend wizard utilise toujours `/wizard`).

**Statut SendingBox prod (audit READ-ONLY)** :
- Variables définies : `SENDINGBOX_API_URL`, `SENDINGBOX_API_KEY`, `SENDINGBOX_CALLBACK_URL`, `SENDINGBOX_DEMO_MODE=true`
- `SENDINGBOX_WEBHOOK_SECRET` : ⚠️ **NON DÉFINI** — handler `webhook.routes.js:150-291` accepte tout payload signé ou non. Risque go-live confirmé (un externe pourrait forger un POST `/api/webhooks/sendingbox` pour faire passer un envoi en `delivered` factice). Mitigé partiellement par DEMO_MODE pour l'instant.
- `SENDINGBOX_API_URL=app.lexdoc.fr` : ne pointe pas vers SendingBox prod ni sandbox — surprenant, ressemble à un proxy interne ou config incomplète, à clarifier.

**Dates commits DocuSign/SendingBox/Universign (confirmation audit transversal)** :
- `backend/src/services/docusign.service.js` : dernier `6bec026 2026-02-18` ("feat: complete variable system, localhost cleanup, and folders tree view")
- `backend/src/services/sendingbox.service.js` + `lrar.routes.js` + `webhook.routes.js` : `d623a70 2026-02-18` Initial commit, **jamais retouchés depuis ~3 mois**
- Code dormant >60j confirmé pour SendingBox/Universign/webhook — testé une fois à l'init, état actuel inconnu en pratique.

**Universign — vif** : 65 hits dans `backend/src/`, service complet `universign.service.js`, variables d'env `UNIVERSIGN_URL`/`UNIVERSIGN_API_KEY`/`UNIVERSIGN_CALLBACK_URL` définies, webhook `/api/webhooks/universign` (`webhook.routes.js:85-111`) actif en parallèle de DocuSign. Deux providers signature configurés simultanément — à clarifier lequel pilote Pragmavox avant démo (sinon risque que la signature s'envoie via le mauvais provider).

**À traiter avant go-live (prochaine session)** :
1. Définir/déployer `SENDINGBOX_WEBHOOK_SECRET` + activer la validation HMAC obligatoire
2. ~~Clarifier provider signature actif pour Pragmavox~~ → **résolu 2026-05-19** : Universign désactivé, DocuSign seul actif
3. Ajouter polling fallback DocuSign si webhook timeout >24h
4. Tests d'intégration LRAR (0 actuellement sur un flux qui engage du coût réel)
5. Vérifier `SENDINGBOX_API_URL` (pointe vers `app.lexdoc.fr` au lieu de SendingBox)
6. **Connecter DocuSign côté tenant Pragmavox** : `GET /api/integrations/docusign/status` retourne `connected:false` — aucun OAuth2 token stocké en TenantIntegrations. Avant la démo Yves-Marie, faire le flow OAuth2 depuis l'UI Settings → Intégrations.

## 2026-05-19 (soir, B.1) — Timeline events câblés sur signature + LRAR

**Lacune découverte au smoke test B** : les routes `POST /api/documents/:id/sign` et `POST /api/documents/:id/send-registered/confirm` ne créaient aucun TimelineEvent. Conséquence : l'onglet "Historique" du dossier ne montrait pas ces actions à l'utilisateur. Visible en démo.

**Fix** (`backend/src/routes/docusign.routes.js`) :
- Import `timeline = require('../services/timeline.service')`
- Après création de `SignatureRequest` : `timeline.addEvent({type: 'signature_demandee', ...})` avec metadata `{signatureRequestId, envelopeId, signersCount, ordreSignature}`
- Après création de `RegisteredMail` : `timeline.addEvent({type: 'lrar_envoye', ...})` avec metadata `{registeredMailId, type, trackingNumber, cost, recipientName}`

Les deux types existent déjà dans `TYPE_LABELS` (timeline.service.js:26-27) et étaient documentés dans le commentaire du modèle Prisma `TimelineEvent.type` — il manquait juste les call-sites.

**Smoke test** : POST /sign + POST /lrar/confirm sur un dossier neuf → timeline contient bien les 5 events dans l'ordre (`dossier_cree`, `personne_ajoutee`, `document_cree`, `signature_demandee`, `lrar_envoye`). Cleanup BDD propre.

**Tests** : 159/159 préservés (pas de test unitaire ajouté — aucun test ne couvrait ces routes précédemment, hors scope ce stage).

**Backlog post-démo** :
- Câbler aussi les events sur les **webhooks** (DocuSign signed + SendingBox delivered) — actuellement les transitions automatiques sont silencieuses côté timeline
- Backfill BDD pour les SignatureRequest/RegisteredMail historiques sans TimelineEvent associé (script idempotent — facultatif)
- Standardiser noms d'events (frontend mappe via TYPE_LABELS, OK pour l'instant)

## 2026-05-19 (soir, suite) — Universign désactivé (DocuSign seul actif)

**Scénario découvert** : B — Dispatcher implicite par URL. Deux providers cohabitaient sur des routes parallèles :
- `POST /api/documents/:id/sign` → DocuSign (route `docusign.routes.js`, appelée par `SignatureModal.jsx` → `integrationsApi.sendDocumentForSignature`)
- `POST /api/signatures` + GET `/:id/status` + GET `/:id/download` + GET `/:id/certificate` → Universign (route `signature.routes.js`)
- `POST /api/signatures/:id/resend` + DELETE `/:id` → **n'appelaient pas Universign** (resend = email service, delete = update statut BDD) — préservés intacts
- `signature.controller.js` : code orphelin, jamais routé — laissé en place

**Patches conservateurs (rollback = git revert)** :
- `backend/src/routes/webhook.routes.js` : POST + GET `/universign` → retournent désormais HTTP 410 Gone avec message explicite. Handler original commenté dans un bloc `/* ... */` pour rollback rapide.
- `backend/src/routes/signature.routes.js` : 4 appels `universignService.xxx(...)` neutralisés par `throw new BadRequestError(...)` placés AVANT, avec `// eslint-disable-next-line no-unreachable` pour conserver le code original lisible.
- `backend/src/services/universign.service.js` : warning `logger.warn('[DEPRECATED] UniversignService instantiated…')` dans le constructeur. Loggé au boot (confirmé : `2026-05-19T10:23:50 [DEPRECATED] UniversignService instantiated`).

**Smoke tests post-patch** :
- `POST /api/webhooks/universign` → 410 Gone + message ✓
- `GET /api/webhooks/universign` → 410 Gone + message ✓
- `GET /api/integrations/docusign/status` → 200 (DocuSign opérationnel, mais `connected:false` côté Pragmavox — voir point #6 ci-dessus)
- Tests : 159/159 verts (aucun test ne couvrait spécifiquement Universign — pas de régression)
- PM2 restart : OK
- DocuSign présent dans 3 chunks frontend servis (`IntegrationsSettings`, `OnboardingWizard`, `integrationsApi`)

**Backlog post-démo Pragmavox** :
- Suppression définitive du code Universign (`backend/src/services/universign.service.js`, handlers commentés webhook.routes.js, blocs unreachable signature.routes.js, `backend/src/controllers/signature.controller.js` orphelin)
- Variables d'env `UNIVERSIGN_*` à retirer du `.env` prod après confirmation 1-2 semaines de non-régression
- Toggle UI signature provider dans CabinetSettings réservé pour le jour où LexDoc supportera plusieurs providers à nouveau (sinon pas nécessaire)

## 2026-05-19 — Backup applicatif désactivé + frontend prod rebuildé

**Objectif** : nettoyer le bruit de logs du cron node-cron cassé (~75 erreurs/mois depuis 2026-04-25) et exposer en prod les modifs cleanup-9 + B1 + B2 (build nginx datait du 30 avril).

**Backup nocturne — état audité** : assuré par cron système `/opt/backups/lexdoc/backup.sh` (crontab root, `0 3 * * *`), rétention 7j via `find -mtime +7 -delete`. 9 backups consécutifs OK du 11 au 19 mai. Le script utilise `docker exec postgres-lexdoc pg_dump -U lexdoc_user -d lexdoc_dev -F c` — évite le piège `?schema=public` en passant `-d` en CLI direct.

**Cron applicatif (node-cron)** : désactivé via commentaire de `backupJob.start()` dans `backend/src/server.js:125`. La classe `BackupJob` + route API `/api/backups/database` restent fonctionnelles pour snapshots manuels.

**Regex `parseDatabaseUrl`** : extraite en méthode dédiée + 5e groupe regex passé de `(.+)` à `([^?]+)` pour stripper le query-string Prisma. 3 tests unitaires ajoutés (`tests/unit/backup.service.test.js`) → **159/159 verts** (156 baseline + 3 nouveaux).

**Permissions secrets backupés** : ✅ corrigé en stage #1.C — 9 fichiers existants passés en `600 root root` via `chmod 600`. Script `/opt/backups/lexdoc/backup.sh` patché pour appliquer automatiquement `chmod 600` aux futurs `env_$D.backup`. Trigger manuel post-patch validé (`env_20260519_0935.backup` en `-rw-------`, db 334 KB, log OK).

**Versioning ops** : script `/opt/backups/lexdoc/backup.sh` désormais versionné dans `ops/backup.sh` (hors-repo auparavant). Header doc précise emplacement réel, procédure de redéploiement, et journal des modifs.

**Frontend prod rebuild + déploiement** : `npm run build` OK, nouveau bundle `index-D9bWRdl5.js` (262 KB). Nginx sert directement depuis `/home/lexdoc-dev/frontend/dist` (config `root /home/lexdoc-dev/frontend/dist;`) → rebuild = déploiement, juste `nginx -s reload`. Backup avant rebuild : `frontend/dist.pre-rebuild-20260519-092747`. Smoke test : HTTP 200, chunk `FolderCreateWizard-D_9kP98i.js` contient bien `CO_DEBITEUR` côté serveur prod.

**API restart** : PM2 lexdoc-api online, health 200, plus de planification cron backup au boot.

## 2026-05-18 (suite 2) — B2 Phase 3 livré (commit ff9d173, pas taggé)

**Objectif B2** : câbler une 2e collection itérable (`co_debiteurs`) au moteur de templates DOCX, validant le pattern miroir de `parties_adverses` introduit en B1.

**Livré** :
- **Enum Prisma `PersonRole` étendu** : `CO_DEBITEUR` ajouté (entre `MEDIATEUR` et `AUTRE` côté schema Prisma, **en queue côté SQL PostgreSQL** — `ALTER TYPE ... ADD VALUE` n'accepte pas la position via Prisma diff). Pas bloquant : c'est le client Prisma TS qui pilote l'UI, pas l'ordre SQL réel.
- **Migration** : `20260518145951_add_co_debiteur_person_role` appliquée, 11 valeurs en BDD, no drift.
- **`collectData()` étendu** : bloc `coDebiteurs` calqué sur `partiesAdverses` (template-engine.service.js, après L47). Mapping 8 champs : `nom, prenom, raison_sociale, adresse, code_postal, ville, email, telephone`. **8 vs 9 pour parties_adverses** (pas de sub-avocat — un co-débiteur n'a pas son propre avocat dans le pattern). Clé `co_debiteurs` aussi dans `renderData` (generateDocument L363).
- **`template-variables.js`** : 9 entrées ajoutées (1 collection + 8 champs) + nouvelle catégorie `co_debiteurs` (label "Co-débiteurs", icon 🔗, order 5.5).
- **Frontend** :
  - `FolderPersons.jsx` : `PERSON_ROLES` 8 → 9 entrées (+ couleur badge `bg-pink-100 text-pink-700`).
  - `FolderCreateWizard.jsx` : `<option value="CO_DEBITEUR">` ajoutée au dropdown wizard.
- **Tests** : 3 unitaires loops `co_debiteurs` (empty / 3 entries / single) → **156/156 passing** (12 suites = 11 baseline + 1 nouveau).
- **Fixture reproductible** : `tests/fixtures/template-co-debiteurs-example.docx` (7786 bytes) + script `scripts/generate-template-co-debiteurs-example.js`.
- **Doc MASTER_TEMPLATES section 10** : ligne `co_debiteurs` ajoutée dans le tableau + mapping `parties_adverses` complété (5 → 9 champs documentés).
- **Build frontend** : OK (`✓ built in 7.70s`), nouveau chunk `FolderCreateWizard-D_9kP98i.js`.
- **API PM2 restart** : OK, health 200, Prisma client expose `CO_DEBITEUR`.

**Backups disponibles** :
- `backend/backups/lexdoc-db-pre-b2-20260518-145903.sql` (1.1 M)
- + tous backups antérieurs cleanup-9

## Backlog mineur — 3 nouvelles entrées B2

8. **Position SQL enum `PersonRole`** : `CO_DEBITEUR` est en queue côté PostgreSQL (`enum_range` retourne `CLIENT, PARTIE_ADVERSE, …, AUTRE, CO_DEBITEUR`) alors qu'il est entre `MEDIATEUR` et `AUTRE` côté Prisma schema. **Pas bloquant** (le client Prisma TS pilote l'UI), mais à corriger si un jour quelqu'un génère une liste UI via `enum_range` SQL direct. Fix : recréer l'enum avec la position correcte (procédure lourde mais documentée PostgreSQL — DROP TYPE / CREATE TYPE / migrate columns).

9. **Refacto `CATEGORIES.order`** : `order: 5.5` ajouté en B2 pour `co_debiteurs` (bricole pour insérer entre 5 `parties` et 6 `societe` sans renuméroter). À refacto en intégers cohérents (5, 10, 15, 20…) pour permettre insertion future sans demi-pas. Fichier : `backend/src/config/template-variables.js` L111-122.

10. **Inconsistance dropdowns front** : `FolderPersons.jsx` expose 9 rôles, `FolderCreateWizard.jsx` 5 (subset volontaire). Pas un bug, mais redondance source de drift. À unifier via constante partagée importée depuis `frontend/src/constants/personRoles.js` (à créer) — voire mieux : générer la liste côté backend depuis `PersonRole` Prisma et exposer via route API. Décision à acter avant B3.

## Backlog mineur (rappel — 5 entrées restantes après 2026-05-19)

1. Sérialisation Date dans `omitSensitiveFields` (createdAt/updatedAt sortent `{}`).
2. Guard "Aucune info" `CabinetSettings.jsx` L568 (vérifie 3 champs mais n'en affiche qu'un).
3. Code mort potentiel `template-engine.service.js` L65-66 (`avocatLegalInfo` lu mais inutilisé dans le flow visible).
4. Migration nommée `202604291435` (12 chiffres au lieu de 14) — cosmétique.
5. `tenant.tva` peuplé en BDD alors que l'identité Bienaime indiquait NULL — à vérifier.

**Résolus 2026-05-19** : ~~Cron backup pg_dump cassé~~ (désactivé node-cron, cron système couvre), ~~Frontend prod build à reconstruire~~ (rebuild + reload nginx OK), ~~Perms `env_*.backup` 644~~ (passé en 600 + script patché + versionné dans `ops/`).

## Prochaine session — 2 options à arbitrer

### Option A — Phase 3 B3 (autre collection)

Câbler une 3e collection : `heritiers` ? `creanciers` ? Pattern identique B2 (~1h30 si type juridique simple).

**PRÉ-REQUIS** : signal métier de Me Bienaime sur ses templates réels — quels actes manipulent des collections ?
- Héritiers : succession, partage, donation-partage
- Créanciers : redressement, liquidation, plan de cession
- Opposants : contentieux multi-parties

Sans input métier → spéculation, risque de coder une collection qui ne servira jamais.

### Option B — Pause Phase 3, attaquer backlog mineur (1h-2h, sans risque)

Priorité pragmatique :
- 🟡 **Fix cron `pg_dump`** (#2) — bug actif, échec quotidien depuis 2026-05-17, ~15 min
- 🟢 **Refacto `CATEGORIES.order` entiers cohérents** (#9) — ~10 min
- 🟢 **Unifier dropdowns front PersonRole** (#10) — ~30 min
- 🟢 **Sérialisation Date** (#1) — investigation puis fix, ~30-45 min

### Recommandation

**B** si Bienaime silencieux (pas de signal métier nouveau d'ici la reprise) — bouclage propre du backlog Phase 2/3 sans pousser de feature spéculative.

**A** dès qu'il livre des templates concrets — alors B3 a un cas d'usage métier réel et c'est de la livraison utile.

## Stable courant

- **Tag stable** : `v0.3.0-mission-b-phase-2` (commit `14ab919`, 2026-05-18) — inchangé
- **HEAD courant** : `ff9d173` (B2 Phase 3, **non taggé** — `v0.4.0-mission-b-phase-3` réservé pour fin de Phase 3 complète)

---

## 2026-05-18 (suite) — B1 Phase 3 livré (commit 7745160, pas taggé)

**Objectif B1** : rendre exploitables les loops Docxtemplater (feature préexistante mais sous-utilisée et mal documentée).

**Livré** :
- Docxtemplater 3.67.6 + `paragraphLoop:true` étaient déjà actifs côté `template-engine.service.js` (L347-349) et `parties_adverses` déjà câblé dans `collectData()` (L145) — feature dormante.
- **Fix mismatch syntaxe** `backend/src/config/template-variables.js` L72-77 : la doc annonçait du Handlebars (`{{#each parties_adverses}}` + `{{this.nom}}`) → corrigé en vraie syntaxe Docxtemplater (`{#parties_adverses}...{/parties_adverses}` + accès direct `{nom}`). Sans ce fix, tout dev s'y fiant cassait son template.
- **3 tests unitaires** ajoutés dans `backend/tests/unit/template-engine-loops.test.js` (empty / 2 entries / 1 entry) → **153/153 verts** (150 baseline + 3 nouveaux, 11 suites).
- **Fixture reproductible** : `backend/scripts/generate-template-loops-example.js` (lib `docx@9.5.1`) génère `backend/tests/fixtures/template-loops-example.docx` (7771 bytes). Régénérable à volonté.
- **Doc dev** : section 10 ajoutée à `docs/MASTER_TEMPLATES_PRAGMAVOX.md` — syntaxe correcte, collections disponibles, pièges courants (mélange `{}` / `{{}}`, paragraphLoop, collection vide).

**Pas touché** : `template-engine.service.js` (le moteur marche), les 2 templates Pragmavox actifs, BDD, frontend.

## Prochaine session — Phase 3 B2 (à scoper)

**Étendre `collectData()` à d'autres collections** : héritiers, créanciers, opposants, co-débiteurs.

**PRÉ-REQUIS** : recueillir signal métier de Me Bienaime sur ses templates réels **avant** de partir dans la spéculation. Quelles collections rencontrera-t-il sur quels actes ?

**Plan B si pas de signal métier** : créer un template d'exemple co-débiteurs Pragmavox crédible (basé sur un cas réel projeté) pour valider end-to-end avec un cas concret. Permet d'ouvrir B2 même sans input direct.

## Stable courant

- **Tag stable** : `v0.3.0-mission-b-phase-2` (commit `14ab919`, 2026-05-18)
- **HEAD courant** : `7745160` (B1 Phase 3, **non taggé** — le tag `v0.4.0-mission-b-phase-3` attendra la fin complète de Phase 3 : B1 + B2 [+ B3 si besoin])

---

## 2026-05-18 — Cleanup-9 COMPLET (commit 14ab919, tag v0.3.0-mission-b-phase-2)

**Objectif** : drop 5 champs morts sur AvocatLegalInfo (numeroToque, barreau, rcs, tvaIntra, mentionsLegales).

**Stages livrés** :
- 9.1 : frontend admin (LegalInfo.jsx + CabinetSettings.jsx) — valid navigateur OK
- 9.2.A : audit inspection backend READ-ONLY
- 9.2.B : patch backend (route + schema + seed) sans migration — 150/150 tests
- 9.2.C : migration `drop_legacy_legal_info_columns` + smoke tests HTTP + commit (14ab919)
- 9.3 : smoke test Prisma post-drop + push + tag v0.3.0-mission-b-phase-2

**Backups disponibles** :
- backend/backups/lexdoc-db-pre-cleanup-9.2-20260518-133717.sql (1.1 MB)
- backend/backups/lexdoc-db-pre-migrate-9.2C-20260518-134327.sql (1.1 MB)

**État BDD** : `avocat_legal_info` passé de 14 à 9 colonnes. No drift. Prisma rejette explicitement un write sur `barreau` post-drop (preuve cohérence client/BDD).

**Smoke tests** :
- GET /api/legal-info → 200, 9 champs propres
- PUT payload sale (5 champs morts injectés) → 200, silencieusement stripé, pas d'erreur Prisma
- 150/150 tests backend verts
- Tenant context (barreau="Angers", toque="T-123", siret, tva, addressLine1, city) intact → footer DOCX OK

## Backlog mineur (découvertes cleanup-9, non bloquantes)

1. **Sérialisation Date dans `omitSensitiveFields`** : `createdAt` / `updatedAt` ressortent `{}` dans les JSON renvoyés par l'API. Bug préexistant cleanup-9. Fichier probable : `backend/src/utils/helpers.js` (fonction omitSensitiveFields).

2. **Cron backup pg_dump cassé** : utilise `pg_dump $DATABASE_URL` avec `?schema=public` dans l'URI → `invalid URI query parameter`. Logs montrent échec quotidien depuis le 2026-05-17. Contournement : `docker exec postgres-lexdoc pg_dump -U lexdoc_user lexdoc_dev`. Fichier à patcher : `backend/src/services/backup.service.js`.

3. **Guard "Aucune info" incohérent dans CabinetSettings.jsx L568** : vérifie 3 champs (assuranceRC, numeroPolice, specialites) mais la grille n'affiche que assuranceRC. Cas pathologique : legalInfo avec numeroPolice/specialites mais sans assuranceRC → cadre vide. Non bloquant.

4. **template-engine.service.js L65-66** : `avocatLegalInfo` lu via Promise.all puis jamais utilisé. Code mort potentiel à confirmer (peut-être nécessaire pour signaturePath/cachetPath ailleurs).

5. **Migration nommée 202604291435** (12 chiffres au lieu de 14) : nommage non-standard. Cosmetic.

6. **Frontend production déployé date du 30 Apr 16:28** (nginx sur port 80) : contient déjà les modifs cleanup-9.1. À reconstruire/redéployer proprement à la prochaine session pour clean state.

7. **`tenant.tva = "FR25982600272"`** côté BDD alors que l'identité Bienaime indiquait NULL. Possible seed reset. À vérifier si pertinent pour Phase 1 lettre mission.

## Prochaine session

- Démarrer Mission B Phase 3 (à définir selon roadmap)
- Adresser backlog mineur ci-dessus si fenêtre disponible
- Frontend rebuild + redeploy propre pour acter état post-cleanup-9

---

## État au 30 avril 2026 fin de session (post cleanup-9.1)

### Mission B Phase 2 backend cleanup : LIVRÉ NON-COMMITTÉ
- Bug rels image header corrigé (fix-rels)
- Footer dynamique opérationnel depuis tenants (single source of truth)
- Module utilitaire branding-format.js créé (formatSiret, formatSiren, buildFooterFromTenant)
- 12 nouveaux tests unitaires pour branding-format
- Baseline tests backend : 150/150 verts
- Identité Pragmavox alignée aux vraies données Bienaime (BDD)
- 4 sites legacy tenant.address → tenant.addressLine1 patchés
- avocat_legal_info.mentionsLegales : NULL pour Pragmavox
- Validation visuelle Word v5 : OK (footer 3 lignes propres, header logo page 1)

### Mission B Phase 2 frontend cleanup : LIVRÉ NON-COMMITTÉ (build vert, valid navigateur en attente)
- LegalInfo.jsx : suppression complète mentionsLegales (state + fetch + PUT + tab def + tab content)
- LegalInfo.jsx : suppression 4 inputs morts (Barreau, numeroToque, RCS, TVA)
- CabinetSettings.jsx : suppression 4 displays + guard refait sur assuranceRC/numeroPolice/specialites
- Build frontend : OK (chunks LegalInfo + CabinetSettings rebuilts)
- Conservation : tenant.barreau, tenant.toque (entités distinctes), assuranceRC, numeroPolice, specialites, signaturePath, cachetPath, useRef

## Validation humaine en attente AVANT cleanup-9.2

**BLOQUANT** : tunnel SSH local puis navigateur :
```
ssh -L 5173:localhost:5173 root@76.13.50.173
# puis http://localhost:5173/settings/legal-info
```

Login : yves-marie.bienaime@pragmavox.fr / admin123

Vérifications :
1. /settings/legal-info → 2 onglets seulement (Informations, Signature & Cachet), pas de Mentions, pas de Barreau/Toque/RCS/TVA dans Informations
2. PUT propre dans devtools Network (peut encore contenir les 5 champs morts dans le payload state mais sera ignoré par le backend une fois 9.2 livré)
3. /parametres/cabinet → section info légales affiche uniquement Assurance RC (ou message "Aucune information")
4. Édition tenant.toque + tenant.barreau du formulaire principal cabinet : INTACTE

Si valid OK → cleanup-9.2.
Si valid KO → fix avant.

## TODO 2026-05-01

### cleanup-9.2 — Backend legal-info.routes + Prisma drop colonnes
- Patch src/routes/legal-info.routes.js : retirer destructuring + upsert + audit log des 5 champs morts
- Migration Prisma : `ALTER TABLE avocat_legal_info DROP COLUMN mentionsLegales, numeroToque, barreau, tvaIntra, rcs`
- prisma/schema.prisma : retirer les 5 champs du model AvocatLegalInfo
- `npx prisma migrate dev --name drop_legacy_legal_info_columns`
- npm test → 150/150 (les tests data-driven peuvent nécessiter ajustement si certains figeaient ces colonnes)
- Validation : régénérer un MED, vérifier que rien ne casse

### cleanup-9.3 — Commits + tag v0.3.0-mission-b-phase-2
- Vérifier git status final propre
- Commits groupés thématiques (suggéré 4-6 commits) :
  1. fix(template-engine): correct image rels Target path
  2. feat(branding): add buildFooterFromTenant utility with 12 unit tests
  3. refactor(template-engine): use tenants as single source of truth for footer
  4. fix(template-engine): replace legacy tenant.address by addressLine1 (4 sites)
  5. data(pragmavox): align tenant with real Bienaime identity
  6. refactor(legal-info): drop legacy duplicate columns from avocat_legal_info
- tag v0.3.0-mission-b-phase-2 avec message récap
- push origin master + tags

### Stage 3.7.H principal — Refacto applyBranding pour header riche
- Maintenant trivial : infra prête (buildFooterFromTenant + pattern multiline <w:br/> + données BDD propres)
- À acter : header sur toutes pages ou page 1 uniquement (convention française = page 1, état actuel)
- Décliner pour les 53 templates système (multi-tenant générique)

## Backlog — Bugs template visibles dans v5.docx (HORS cleanup)

1. **Doublon "Société Société Mauvais Payeur SAS"** dans bloc destinataire → probablement template MED avec {partie.forme_juridique} {partie.nom} où partie.nom contient déjà la forme.
2. **Doublon "12 000,00€ euros TTC"** → formatMontantEur inclut déjà €, template rajoute "euros" en dur.

## Backlog technique

- Cleanup colonne `address` de tenants (NULL pour Pragmavox mais legacy ailleurs ?)
- Cleanup footer1.xml.rels orphelin (image3.png non utilisé après anonymisation)
- soffice à installer sur VPS (besoin pour conversion .doc legacy + preview PDF backend)
- Documentation : port API = 4000 (pas 3000)
- Convention "header/footer page 1 only" actée par défaut, à documenter dans SPEC_UX_UNIFIEE
- Exposition firewall Hostinger : port 5173 dev pas accessible publiquement (workaround tunnel SSH OK)

## Backups disponibles

### BDD
- /root/lexdoc-db-pre-cleanup-8-20260430-1536.sql (pre-UPDATE Pragmavox)
- /root/lexdoc-db-end-of-session-cleanup-9.1-* (fin session 30/04)
- Backups antérieurs (5 historiques)

### Code
- backend/src/services/template-engine.service.js.bak-3.7.H.cleanup-2
- backend/src/services/template-engine.service.js.bak-3.7.H.fix-rels
- backend/src/services/template-engine.service.js.bak-3.4
- frontend/src/pages/settings/LegalInfo.jsx.bak-3.7.H.cleanup-9.1
- frontend/src/pages/parametres/CabinetSettings.jsx.bak-3.7.H.cleanup-9.1
- backend/templates/pragmavox/*.bak-3.7.G

## Identité Pragmavox réelle (validée Bienaime + Google Maps)

- name : Pragma Vox Avocat
- legalName : SELARL Pragma Vox Avocat
- siret : 98260027200016
- addressLine1 : 11 Rue Paul Langevin
- postalCode : 49240
- city : Avrillé
- phone : 0614843838
- email : ym.bienaime@pragmavox-avocat.fr
- website : NULL
- mediateurNomComplet, mediateurBarreau : NULL (à demander à Bienaime quand pertinent pour Phase 1 lettre mission)

## Baseline à préserver demain

- 150/150 tests backend verts
- Build frontend vert (chunks LegalInfo + CabinetSettings)
- PM2 lexdoc-api online port 4000
- API health HTTP 200
- DB postgres-lexdoc up
