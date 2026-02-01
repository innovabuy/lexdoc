# LexDoc - Guide de Déploiement Complet

Ce guide détaille le déploiement de LexDoc sur un serveur avec infrastructure existante.

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Configuration serveur](#2-configuration-serveur)
3. [Configuration DNS](#3-configuration-dns)
4. [Installation](#4-installation)
5. [Vérification](#5-vérification)
6. [Post-installation](#6-post-installation)
7. [Maintenance](#7-maintenance)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prérequis

### Infrastructure existante utilisée

| Composant | Container | Ports |
|-----------|-----------|-------|
| Reverse Proxy | `cap_traefik` | 80, 443, 8082 |
| PostgreSQL | `dcf-postgres` | 5432 |
| Réseau Docker | `cap-navigator_cap_network` | - |

### Ports LexDoc (libres)

| Service | Port |
|---------|------|
| MinIO API | 9002 |
| MinIO Console | 9003 |
| Backend (interne) | 3000 |
| Healthcheck (interne) | 3000 |

---

## 2. Configuration serveur

### 2.1 Vérifier l'infrastructure existante

```bash
# Vérifier Traefik
docker ps | grep traefik
# Attendu: cap_traefik actif sur ports 80, 443

# Vérifier PostgreSQL
docker ps | grep postgres
# Attendu: dcf-postgres actif sur port 5432

# Vérifier le réseau
docker network ls | grep cap-navigator
# Attendu: cap-navigator_cap_network
```

### 2.2 Vérifier la configuration Traefik

S'assurer que Traefik est configuré avec :
- Entrypoints `web` (80) et `websecure` (443)
- CertResolver `letsencrypt` configuré
- Découverte Docker activée

```bash
# Vérifier les labels d'un container existant
docker inspect cap_traefik | grep -A 50 "Labels"
```

---

## 3. Configuration DNS

### 3.1 Enregistrements requis

Ajouter ces enregistrements DNS chez votre registrar :

```
lexdoc.votredomaine.fr          A     IP_SERVEUR
api.lexdoc.votredomaine.fr      A     IP_SERVEUR
minio.lexdoc.votredomaine.fr    A     IP_SERVEUR
minio-console.lexdoc.votredomaine.fr  A  IP_SERVEUR
health.lexdoc.votredomaine.fr   A     IP_SERVEUR
```

Ou avec CNAME si vous avez un enregistrement A principal :

```
lexdoc.votredomaine.fr          CNAME  serveur.votredomaine.fr
api.lexdoc.votredomaine.fr      CNAME  serveur.votredomaine.fr
...
```

### 3.2 Vérifier la propagation DNS

```bash
# Vérifier que les DNS pointent vers le serveur
dig +short lexdoc.votredomaine.fr
dig +short api.lexdoc.votredomaine.fr
```

---

## 4. Installation

### 4.1 Cloner/Copier le projet

```bash
cd /opt
# Si git
git clone <repository> lexdoc

# Ou copier les fichiers manuellement
```

### 4.2 Configurer l'environnement

```bash
cd /opt/lexdoc

# Copier le template
cp .env.example .env

# Éditer la configuration
nano .env
```

**Variables importantes à modifier :**

```bash
# Domaine (SANS https://)
DOMAIN=votredomaine.fr

# Database (générer un mot de passe fort)
DATABASE_URL=postgresql://lexdoc_user:MOT_DE_PASSE_FORT@172.17.0.1:5432/lexdoc_production

# MinIO (générer des credentials forts)
MINIO_ROOT_USER=lexdoc_admin
MINIO_ROOT_PASSWORD=MOT_DE_PASSE_FORT_16_CHARS

# JWT Secrets (générer avec: openssl rand -base64 64)
JWT_SECRET=<64+ caractères aléatoires>
JWT_REFRESH_SECRET=<64+ caractères aléatoires différents>

# Encryption Key (générer avec: openssl rand -hex 16)
ENCRYPTION_KEY=<exactement 32 caractères>
```

### 4.3 Générer les secrets

```bash
# JWT Secrets
echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')"

# Encryption Key
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)"

# MinIO Password
echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 24 | tr -d '\n')"
```

### 4.4 Créer la base de données

```bash
chmod +x scripts/*.sh
./scripts/setup-database.sh
```

### 4.5 Lancer la stack

```bash
docker-compose up -d
```

---

## 5. Vérification

### 5.1 Vérifier les containers

```bash
docker-compose ps
```

Tous les services doivent être `Up (healthy)`.

### 5.2 Vérifier les logs

```bash
# Tous les logs
docker-compose logs

# Logs en temps réel
docker-compose logs -f

# Log d'un service spécifique
docker-compose logs -f backend
```

### 5.3 Tester les endpoints

```bash
# Health check
curl -s https://health.lexdoc.votredomaine.fr/health | jq

# API (devrait retourner 200 ou redirect auth)
curl -I https://api.lexdoc.votredomaine.fr

# Frontend
curl -I https://lexdoc.votredomaine.fr

# MinIO
curl -I https://minio.lexdoc.votredomaine.fr
```

### 5.4 Vérifier les certificats SSL

```bash
# Vérifier le certificat
echo | openssl s_client -connect lexdoc.votredomaine.fr:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 6. Post-installation

### 6.1 Créer le premier administrateur

```bash
# Se connecter au backend
docker exec -it lexdoc-backend sh

# Ou exécuter Prisma seed
npx prisma db seed
```

### 6.2 Configurer les buckets MinIO

Les buckets sont créés automatiquement au premier démarrage, mais vous pouvez vérifier :

```bash
# Accéder à la console MinIO
# https://minio-console.lexdoc.votredomaine.fr

# Ou via CLI
docker exec lexdoc-minio mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD
docker exec lexdoc-minio mc ls local/
```

### 6.3 Configurer les backups automatiques

```bash
# Éditer crontab
crontab -e

# Ajouter (backup quotidien à 3h du matin)
0 3 * * * cd /opt/lexdoc && ./scripts/backup.sh >> /var/log/lexdoc-backup.log 2>&1
```

### 6.4 Configurer le monitoring (optionnel)

Si Uptime Kuma est installé sur le serveur :

1. Ajouter un monitor HTTP pour `https://health.lexdoc.votredomaine.fr/health`
2. Configurer les alertes

---

## 7. Maintenance

### 7.1 Mise à jour

```bash
cd /opt/lexdoc

# Arrêter les services
docker-compose down

# Pull les nouvelles images / rebuild
docker-compose pull
docker-compose build

# Relancer
docker-compose up -d

# Migrations (si nécessaire)
docker exec lexdoc-backend npx prisma migrate deploy
```

### 7.2 Backup manuel

```bash
./scripts/backup.sh
```

### 7.3 Restauration

```bash
# Lister les backups disponibles
ls -la backups/

# Restaurer
./scripts/restore.sh 20260128_143000
```

### 7.4 Logs

```bash
# Logs récents
docker-compose logs --tail=100

# Logs avec timestamp
docker-compose logs -t -f
```

---

## 8. Troubleshooting

### Problème : Container ne démarre pas

```bash
# Vérifier les logs détaillés
docker-compose logs <service>

# Vérifier les ressources
docker stats
df -h
free -m
```

### Problème : Certificat SSL non généré

1. Vérifier que DNS pointe vers le serveur
2. Vérifier les logs Traefik :
   ```bash
   docker logs cap_traefik | grep -i "lexdoc"
   ```
3. Vérifier que les ports 80/443 sont accessibles

### Problème : Connexion database échoue

```bash
# Vérifier que dcf-postgres est accessible
docker exec dcf-postgres psql -U postgres -c "SELECT 1"

# Vérifier l'utilisateur/database existe
docker exec dcf-postgres psql -U postgres -c "\du"
docker exec dcf-postgres psql -U postgres -c "\l"

# Tester la connexion depuis le container backend
docker exec lexdoc-backend sh -c 'npx prisma db pull'
```

### Problème : MinIO inaccessible

```bash
# Vérifier le container
docker logs lexdoc-minio

# Vérifier la santé
docker exec lexdoc-minio curl -s http://localhost:9000/minio/health/live
```

### Problème : Réseau Docker

```bash
# Vérifier que le réseau existe
docker network ls | grep cap-navigator

# Vérifier les containers connectés
docker network inspect cap-navigator_cap_network
```

---

## Contacts

Pour toute assistance technique, contacter l'équipe de développement.
