# LexDoc - Gestion Documentaire pour Cabinets d'Avocats

Solution de gestion électronique de documents (GED) spécialisée pour les cabinets d'avocats.

## Fonctionnalités

- Gestion multi-cabinet (multi-tenant)
- Gestion des clients (personnes physiques et morales)
- Gestion des dossiers avec suivi d'échéances
- Stockage sécurisé des documents (MinIO S3)
- Versioning des documents
- Modèles de documents avec variables
- Audit trail complet
- Authentification JWT sécurisée

## Prérequis

- Docker + Docker Compose v2
- Traefik configuré (existant sur le serveur)
- PostgreSQL configuré (existant sur le serveur)
- Nom de domaine avec DNS configuré

## Installation rapide

```bash
# 1. Configurer l'environnement
cp .env.example .env
nano .env  # Remplir les variables

# 2. Créer la base de données
./scripts/setup-database.sh

# 3. Lancer la stack
docker-compose up -d

# 4. Vérifier le statut
docker-compose ps
```

## Configuration DNS

Ajouter ces enregistrements DNS pointant vers l'IP du serveur :

| Sous-domaine | Type |
|-------------|------|
| `lexdoc.DOMAIN` | A/CNAME |
| `api.lexdoc.DOMAIN` | A/CNAME |
| `minio.lexdoc.DOMAIN` | A/CNAME |
| `minio-console.lexdoc.DOMAIN` | A/CNAME |
| `health.lexdoc.DOMAIN` | A/CNAME |

## URLs

| Service | URL |
|---------|-----|
| Frontend | https://lexdoc.DOMAIN |
| API | https://api.lexdoc.DOMAIN |
| MinIO Console | https://minio-console.lexdoc.DOMAIN |
| Health Check | https://health.lexdoc.DOMAIN |

## Commandes utiles

```bash
# Logs
docker-compose logs -f
docker-compose logs -f backend

# Redémarrer
docker-compose restart

# Rebuild
docker-compose up -d --build

# Backup
./scripts/backup.sh

# Restauration
./scripts/restore.sh 20260128_143000
```

## Structure du projet

```
lexdoc/
├── docker-compose.yml      # Orchestration Docker
├── .env                    # Configuration (non versionné)
├── .env.example           # Template configuration
├── prisma/
│   ├── schema.prisma      # Schéma base de données
│   └── migrations/        # Migrations SQL
├── scripts/
│   ├── setup-database.sh  # Init DB dans PostgreSQL existant
│   ├── backup.sh          # Backup DB + MinIO
│   └── restore.sh         # Restauration
├── healthcheck/           # Service de monitoring
├── backend/               # API Node.js (à créer)
└── frontend/              # React SPA (à créer)
```

## Sécurité

- Tous les secrets dans `.env` (jamais commité)
- Chiffrement TLS via Traefik/Let's Encrypt
- JWT pour authentification
- Rate limiting sur l'API
- Headers de sécurité (HSTS, XSS, etc.)
- Row Level Security PostgreSQL

## Documentation

- [Guide de déploiement](DEPLOYMENT.md)
- [Architecture technique](docs/ARCHITECTURE.md)

## Support

Pour toute question ou problème, consulter la documentation ou contacter l'équipe technique.
