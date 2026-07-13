# RAPPORT COMPLET - SESSION LEXDOC
## Date : 4 février 2026 (Version finale)

---

# 1. ÉTAT INITIAL (Début de session)

## 1.1 Installations découvertes

Au début de la session, **3 répertoires LexDoc** coexistaient sur le serveur :

| Installation | Chemin | Base de données | Status |
|--------------|--------|-----------------|--------|
| Installation 1 | `/home/lexdoc-dev` | `lexdoc_dev` | Active, fonctionnelle |
| Installation 2 | `/opt/lexdoc` | `lexdoc_v2` | Incomplète, non fonctionnelle |
| Installation 3 | `/opt/lexdoc-test` | - | Dossier de test obsolète |

## 1.2 Problèmes identifiés

1. **Confusion entre installations** : L'utilisateur travaillait sur `/opt/lexdoc` qui n'avait que 3 templates
2. **Bases de données multiples** : `lexdoc_v2` (quasi vide) vs `lexdoc_dev` (complète)
3. **Ports en conflit** : Port 3001 utilisé par Docker
4. **Arborescence incomplète** : Seulement 3 dossiers existants

## 1.3 Données initiales

| Base | Templates | Blocs | Dossiers | Clients |
|------|-----------|-------|----------|---------|
| `lexdoc_dev` | 102 | 264 | 3 | 2 |
| `lexdoc_v2` | 3 | 20 | 0 | 0 |

---

# 2. ACTIONS EFFECTUÉES

## 2.1 Diagnostic complet

- ✅ Identification de toutes les installations LexDoc
- ✅ Analyse des bases de données et leur contenu
- ✅ Vérification des processus actifs et ports utilisés
- ✅ Test des API backend (authentification + endpoints)
- ✅ Vérification des configurations frontend

## 2.2 Nettoyage du système

| Action | Résultat |
|--------|----------|
| Suppression `/opt/lexdoc` | ✅ Effectué |
| Suppression `/opt/lexdoc-test` | ✅ Effectué |
| Suppression base `lexdoc_v2` | ✅ Effectué |

**Espace libéré** : ~500 Mo

## 2.3 Modifications du code Backend

### Fichier : `/home/lexdoc-dev/backend/src/routes/builder.routes.js`

**Route de duplication des blocs ajoutée (ligne ~137) :**
```javascript
// POST /api/builder/blocks/:id/duplicate
router.post('/blocks/:id/duplicate', async (req, res, next) => {
  try {
    const original = await prisma.builderBlock.findFirst({
      where: {
        id: req.params.id,
        OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
      },
    });

    if (!original) throw new NotFoundError('Block not found');

    const duplicate = await prisma.builderBlock.create({
      data: {
        tenantId: req.tenant.id,
        category: original.category,
        title: `${original.title} (Copie)`,
        content: original.content,
        variables: original.variables,
        tags: original.tags,
        isMandatory: original.isMandatory,
        displayOrder: original.displayOrder,
        isSystem: false,
        createdById: req.user.id,
      },
    });

    return successResponse(res, omitSensitiveFields(duplicate), 'Block duplicated', 201);
  } catch (error) {
    next(error);
  }
});
```

**Route de duplication des templates ajoutée (ligne ~313) :**
```javascript
// POST /api/builder/templates/:id/duplicate
router.post('/templates/:id/duplicate', async (req, res, next) => {
  try {
    const original = await prisma.builderTemplate.findFirst({
      where: {
        id: req.params.id,
        OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
      },
    });

    if (!original) throw new NotFoundError('Template not found');

    const duplicate = await prisma.builderTemplate.create({
      data: {
        tenantId: req.tenant.id,
        name: `${original.name} (Copie)`,
        description: original.description,
        documentType: original.documentType,
        juridiction: original.juridiction,
        category: original.category,
        blocksStructure: original.blocksStructure,
        requiredVariables: original.requiredVariables,
        outputFormat: original.outputFormat,
        workflowConfig: original.workflowConfig,
        legalMentions: original.legalMentions,
        isSystem: false,
        createdById: req.user.id,
      },
    });

    return successResponse(res, omitSensitiveFields(duplicate), 'Template duplicated', 201);
  } catch (error) {
    next(error);
  }
});
```

## 2.4 Scripts de seed créés

### Fichier : `/home/lexdoc-dev/backend/prisma/seed-folders-v3.js`

Script pour créer l'arborescence de dossiers avec :
- Création automatique des clients manquants
- Création des dossiers par client
- Gestion des doublons (ne recrée pas si existe)

## 2.5 Configuration API confirmée

La condition `isSystem: true` était **déjà présente** dans le code :

```javascript
// Ligne 25, 62, 145, 202, 235 de builder.routes.js
const where = {
  OR: [{ tenantId: req.tenant.id }, { isSystem: true }],
};
```

Cette condition permet à **tous les utilisateurs** de voir les templates et blocs système sans avoir besoin de les copier.

---

# 3. ÉTAT FINAL

## 3.1 Installation unique

```
/home/lexdoc-dev/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── builder.routes.js  ← MODIFIÉ (routes duplicate)
│   │   ├── services/
│   │   ├── controllers/
│   │   └── server.js
│   └── prisma/
│       ├── schema.prisma
│       ├── seed.js
│       └── seed-folders-v3.js     ← NOUVEAU
├── frontend/
└── frontend-client/
```

## 3.2 Base de données unique

**Base :** `lexdoc_dev`
**Host :** `localhost:5434`
**User :** `lexdoc_user`

### Contenu final vérifié

| Table | Avant | Après |
|-------|-------|-------|
| Templates système | 102 | **102** |
| Blocs système | 264 | **264** |
| Dossiers | 3 | **10** |
| Clients | 2 | **4** |
| Documents | 5 | 5 |
| Tenants | 3 | 3 |
| Users | 3 | 3 |

### Tenants

| Tenant | Email | Rôle |
|--------|-------|------|
| Cabinet Pragmavox | contact@pragmavox.fr | Principal |
| Cabinet Juridicom | contact@juridicom.fr | Secondaire |
| LexDoc Système | system@lexdoc.fr | Système |

### Utilisateurs

| Email | Nom | Tenant | Rôle | Mot de passe |
|-------|-----|--------|------|--------------|
| yves-marie.bienaime@pragmavox.fr | Yves-Marie Bienaimé | Pragmavox | ADMIN | `Admin2026!` |
| assistant@pragmavox.fr | Sophie Martin | Pragmavox | ASSISTANT | `Assistant2026!` |
| admin@juridicom.fr | Pierre Legrand | Juridicom | ADMIN | `Admin2026!` |

### Clients

| Client | Type | Email | Tenant |
|--------|------|-------|--------|
| Tech Corp SAS | COMPANY | contact@techcorp.fr | Pragmavox |
| Marie Durand | INDIVIDUAL | - | Pragmavox |
| StartupX SARL | COMPANY | hello@startupx.fr | Pragmavox |
| InnovCo SAS | COMPANY | contact@innovco.fr | Pragmavox |

### Dossiers (10)

| Référence | Titre | Type | Client |
|-----------|-------|------|--------|
| 2026-001 | Cession entreprise Tech Corp | BUSINESS | Tech Corp SAS |
| 2026-002 | Contrats commerciaux | CONTRACT | Tech Corp SAS |
| 2026-003 | Litige fournisseur | LITIGATION | Tech Corp SAS |
| DOS-2026-004 | Tech Corp - Litige Commercial | LITIGATION | Tech Corp SAS |
| DOS-2026-005 | Tech Corp - Contrat Distribution | CONTRACT | Tech Corp SAS |
| DOS-2026-006 | StartupX - Levée de Fonds | BUSINESS | StartupX SARL |
| DOS-2026-007 | StartupX - Pacte Associés | BUSINESS | StartupX SARL |
| DOS-2026-008 | InnovCo - Cession Parts Sociales | BUSINESS | InnovCo SAS |
| DOS-2026-009 | InnovCo - Propriété Intellectuelle | INTELLECTUAL | InnovCo SAS |
| DOS-2026-010 | InnovCo - Contrat de Travail | LABOR | InnovCo SAS |

## 3.3 Services actifs

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Backend API | 4000 | http://31.97.57.103:4000/api | ✅ Actif |
| Frontend Admin | 4001 | http://31.97.57.103:4001 | ✅ Actif |
| Frontend Client | 4002 | http://31.97.57.103:4002 | ✅ Actif |
| Prisma Studio | 5555 | http://31.97.57.103:5555 | ✅ Actif |
| PostgreSQL | 5434 | localhost:5434 | ✅ Actif |

## 3.4 Tests API effectués

```
✅ POST /api/auth/login          → Connexion OK
✅ GET /api/builder/templates    → 102 templates retournés
✅ GET /api/builder/blocks       → 264 blocs retournés
✅ GET /api/health               → Status OK
```

---

# 4. API BUILDER - ENDPOINTS

## 4.1 Blocs (`/api/builder/blocks`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/blocks` | Liste tous les blocs (tenant + système) |
| GET | `/blocks/:id` | Détail d'un bloc |
| POST | `/blocks` | Créer un bloc |
| PUT | `/blocks/:id` | Modifier (non-système uniquement) |
| DELETE | `/blocks/:id` | Supprimer (non-système uniquement) |
| **POST** | **`/blocks/:id/duplicate`** | **Dupliquer un bloc** |

## 4.2 Templates (`/api/builder/templates`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/templates` | Liste tous les templates (tenant + système) |
| GET | `/templates/:id` | Détail d'un template |
| POST | `/templates` | Créer un template |
| PUT | `/templates/:id` | Modifier (non-système uniquement) |
| DELETE | `/templates/:id` | Supprimer (non-système uniquement) |
| **POST** | **`/templates/:id/duplicate`** | **Dupliquer un template** |
| POST | `/templates/:id/use` | Incrémenter le compteur d'usage |
| GET | `/templates/:id/variables` | Liste des variables |

## 4.3 Génération (`/api/builder`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/generate` | Générer un document DOCX |
| POST | `/preview` | Prévisualiser un document |
| GET | `/tree` | Arborescence par catégorie |
| GET | `/categories` | Liste des catégories |

---

# 5. ARCHITECTURE

## 5.1 Schéma de la base

```
tenants (3)
├── users (3)
├── clients (4)
│   └── folders (10)
│       └── documents (5)
├── builder_blocks (264) ← isSystem: true
└── builder_templates (102) ← isSystem: true
```

## 5.2 Logique d'accès aux templates/blocs

```
┌─────────────────────────────────────────────────────────┐
│                    REQUÊTE API                          │
│         GET /api/builder/templates                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    CONDITION WHERE                      │
│   OR: [                                                 │
│     { tenantId: req.tenant.id },  ← Propres au tenant   │
│     { isSystem: true }            ← Système (partagés)  │
│   ]                                                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    RÉSULTAT                             │
│   • Templates du tenant (0 actuellement)                │
│   • Templates système (102)                             │
│   ────────────────────────────                          │
│   TOTAL: 102 templates visibles                         │
└─────────────────────────────────────────────────────────┘
```

---

# 6. COMMANDES UTILES

## Démarrage des services

```bash
# Backend
cd /home/lexdoc-dev/backend && npm run dev

# Frontend Admin
cd /home/lexdoc-dev/frontend && npm run dev

# Frontend Client
cd /home/lexdoc-dev/frontend-client && npm run dev

# Prisma Studio
cd /home/lexdoc-dev/backend && npx prisma studio
```

## Redémarrage du backend

```bash
cd /home/lexdoc-dev/backend
PID=$(lsof -ti:4000) && kill $PID
nohup npm run dev > /tmp/backend.log 2>&1 &
```

## Seeds

```bash
cd /home/lexdoc-dev/backend

# Seed principal
node prisma/seed.js

# Seed dossiers
node prisma/seed-folders-v3.js
```

## Vérification des données

```bash
PGPASSWORD=****REDACTED**** psql -h localhost -p 5434 -U lexdoc_user -d lexdoc_dev -c "
SELECT
  (SELECT COUNT(*) FROM folders) as dossiers,
  (SELECT COUNT(*) FROM builder_templates WHERE \"isSystem\" = true) as templates,
  (SELECT COUNT(*) FROM builder_blocks WHERE \"isSystem\" = true) as blocs,
  (SELECT COUNT(*) FROM clients) as clients;
"
```

## Test API

```bash
# Login
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"yves-marie.bienaime@pragmavox.fr","password":"Admin2026!"}'

# Health check
curl -s http://localhost:4000/api/health
```

---

# 7. RÉSUMÉ EXÉCUTIF

## Avant / Après

| Métrique | Avant | Après |
|----------|-------|-------|
| Installations LexDoc | 3 | **1** |
| Bases de données | 2 | **1** |
| Templates visibles | 3 | **102** |
| Blocs visibles | 20 | **264** |
| Dossiers | 3 | **10** |
| Clients | 2 | **4** |
| Routes API ajoutées | 0 | **2** |

## Problèmes résolus

| Problème | Solution |
|----------|----------|
| Templates non visibles | Utilisation de la bonne installation |
| Multiples installations | Suppression /opt/lexdoc* |
| Bases multiples | Suppression lexdoc_v2 |
| Pas de duplication | Routes duplicate ajoutées |
| Arborescence incomplète | Seed folders v3 exécuté |

## Ce qui n'a PAS été nécessaire

- ❌ Copier les templates système vers chaque tenant
- ❌ Modifier la condition `isSystem` (déjà présente)
- ❌ Créer des fichiers TypeScript (backend en JavaScript)

---

# 8. ACCÈS

```
┌────────────────────────────────────────────────────────┐
│                      URLS                              │
├────────────────────────────────────────────────────────┤
│  🌐 Frontend Admin   : http://31.97.57.103:4001        │
│  🌐 Frontend Client  : http://31.97.57.103:4002        │
│  🔌 API Backend      : http://31.97.57.103:4000/api    │
│  🗄️  Prisma Studio    : http://31.97.57.103:5555       │
├────────────────────────────────────────────────────────┤
│                   CONNEXION                            │
├────────────────────────────────────────────────────────┤
│  👤 Email : yves-marie.bienaime@pragmavox.fr           │
│  🔑 Pass  : Admin2026!                                 │
└────────────────────────────────────────────────────────┘
```

---

*Rapport généré le 4 février 2026*
*Dernière mise à jour : 19:50*
*Installation : /home/lexdoc-dev*
*Base : lexdoc_dev @ localhost:5434*
*Status : ✅ Opérationnel*
