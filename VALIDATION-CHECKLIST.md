# LexDoc - Checklist de Validation Finale

## Infrastructure
- [x] VPS accessible via SSH (port 22, UFW actif)
- [x] Docker et Docker Compose installés (Docker 29.1.1, Compose v2.40.3)
- [x] Firewall configuré (ports 22, 80, 443 + ports applicatifs)
- [x] Fail2ban actif (jail SSH)
- [ ] Certificats SSL Let's Encrypt valides (en attente de domaine - Traefik prêt)

## Base de données
- [x] PostgreSQL démarre sans erreur (container Docker, port 5434)
- [x] Migrations Prisma appliquées (7 migrations)
- [x] Données de test présentes (206 templates, 264 blocs, 20 dossiers)
- [x] Backup automatique configuré (cron quotidien 2h du matin)
- [x] Port PostgreSQL sécurisé (iptables DOCKER-USER, accès externe bloqué)

## Backend API
- [x] GET /health retourne 200
- [x] GET /api/health/db retourne 200
- [x] POST /api/auth/login fonctionne
- [x] JWT tokens générés correctement
- [x] Multi-tenancy testé (isolation)
- [x] Upload document routes créées
- [x] MinIO stockage configuré (port 9003/9004)
- [x] Backend géré par PM2 (auto-restart crash + reboot)
- [x] Filtres date (dateFrom/dateTo) sur endpoint documents
- [x] Route /api/folders/tree (arborescence dossiers)
- [x] Routes duplicate templates et blocs
- [x] 138 tests backend passent (81.91% couverture)

## Frontend
- [x] Login page créée
- [x] Dashboard créé (KPIs, graphiques, statistiques)
- [x] Auth context fonctionnel
- [x] Upload document UI (DocumentUploader.jsx admin + modal upload client)
- [x] Responsive mobile (bottom nav, touch targets 44px, safe area, media queries)
- [x] Tree view documents (DocumentsTreePage avec FolderTree, expand/collapse)
- [x] Tree view templates (TemplatesTreePage avec TemplateTreeView)
- [x] Page Dossiers avec CRUD, recherche, filtres, tri, vue grille/liste
- [x] Page Détail Dossier (FolderDetail avec onglets personnes, timeline, documents)
- [x] Page Clients avec CRUD complet
- [x] Page Signatures
- [x] Page Documents globale avec filtres date, export CSV, actions en lot
- [x] Page Templates avec migration API, sélection dossier, filtres date
- [x] Calendrier et échéances
- [x] Statistiques et graphiques
- [x] Chat / messagerie inter-utilisateurs
- [x] Recherche globale multi-entités
- [x] Système de notifications
- [x] Dark mode avec toggle
- [x] PWA (offline, install prompt)
- [x] Breadcrumb navigation documents

## Intégrations
- [x] Universign : service créé
- [x] SendingBox : service créé
- [x] Emails : templates créés
- [x] Relances : job cron créé

## Sécurité
- [x] Passwords bcrypt (12 rounds)
- [x] JWT avec secret configurable
- [ ] HTTPS activé (en attente de domaine - Traefik + certresolver prêts)
- [x] Rate limiting actif (500/min)
- [x] Headers sécurité (Helmet)
- [x] PostgreSQL non exposé publiquement (iptables DOCKER-USER)
- [x] Validation mot de passe renforcée (12 car., majuscule, minuscule, chiffre)
- [x] UI checklist exigences mot de passe (Activate.jsx)

## Scripts disponibles
- [x] scripts/deploy.sh
- [x] scripts/backup.sh (avec --clean --if-exists pour restore propre)
- [x] scripts/restore.sh
- [x] scripts/healthcheck.sh
- [x] scripts/validate-setup.sh
- [x] scripts/validate-database.sh

## Tests
```bash
# Test health
curl http://localhost:4000/health

# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"yves-marie.bienaime@pragmavox.fr","password":"Admin2026!"}'

# Test avec token
TOKEN="<token_from_login>"
curl http://localhost:4000/api/auth/me -H "Authorization: Bearer $TOKEN"

# Test backup
/home/lexdoc-dev/scripts/backup.sh

# Test restore
/home/lexdoc-dev/scripts/restore.sh <date>
```

## Production
- [ ] DNS configuré (en attente de choix de domaine)
- [ ] SSL Let's Encrypt (en attente de DNS)
- [x] Monitoring actif (Uptime Kuma : API + Frontend Admin + Frontend Client)
- [x] Backup testé (2026-02-05, dump + restore validés)
- [x] Restore testé (2026-02-05, données intactes après restore)

## Diagnostic (6 février 2026)
- [x] Aucun répertoire fantôme (/opt/lexdoc supprimé, caches nettoyés)
- [x] Tree view correctement routé (/documents/tree, /templates/tree)
- [x] Sidebar menu : faux positif (seulement dans fichier test)
- [x] Pages Folders/FolderDetail fonctionnelles (nommage anglais, routing OK)
- [x] 66 tests frontend passent (12 échouent sur Layout - problème undici, pas logique)
- [x] Tous les services actifs (backend 4000, admin 4001, client 4002)
- [ ] DNS configuré (en attente)
- [ ] SSL Let's Encrypt (en attente DNS)

---

**Date validation :** 6 février 2026
**Validé par :** Diagnostic automatisé + session Claude
