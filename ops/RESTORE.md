# LexDoc — Procédure de restauration (à 3h du matin, sous stress)

> Sauvegardes : `/opt/backups/lexdoc/` — `db_*.backup` (PostgreSQL `-Fc`),
> `minio_*.tar.gz` (documents), `env_*.backup` (secrets, chmod 600). Rétention 7 j.
> Script : `ops/backup.sh` (cron root `0 3 * * *`).

## 0. Choisir la sauvegarde
```bash
ls -lt /opt/backups/lexdoc/db_*.backup      # la plus récente en haut
D=20260713_0300                             # ← timestamp choisi (adapter)
```
Vérifier que le trio existe : `db_$D.backup`, `minio_$D.tar.gz`, `env_$D.backup`.

## 1. Restaurer la BASE PostgreSQL

### 1a. Vérifier que le dump est lisible (AVANT de toucher au live)
```bash
docker cp /opt/backups/lexdoc/db_$D.backup postgres-lexdoc:/tmp/r.backup
docker exec postgres-lexdoc pg_restore -l /tmp/r.backup | head    # doit lister les tables
```

### 1b. Restaurer dans une base JETABLE d'abord (validation)
```bash
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c "DROP DATABASE IF EXISTS lexdoc_restore;"
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c "CREATE DATABASE lexdoc_restore;"
docker exec postgres-lexdoc pg_restore -U lexdoc_user -d lexdoc_restore /tmp/r.backup
docker exec postgres-lexdoc psql -U lexdoc_user -d lexdoc_restore -c \
  "select count(*) clients from clients; select count(*) documents from documents;"
```
Si les comptes sont cohérents → passer au live.

### 1c. Restaurer sur le LIVE (⚠️ écrase les données actuelles)
```bash
# Arrêter l'app pour éviter les écritures concurrentes
pm2 stop lexdoc-api
# Recréer la base cible proprement
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='lexdoc_dev';"
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c "DROP DATABASE lexdoc_dev;"
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c "CREATE DATABASE lexdoc_dev OWNER lexdoc_user;"
docker exec postgres-lexdoc pg_restore -U lexdoc_user -d lexdoc_dev /tmp/r.backup
pm2 start lexdoc-api
curl -s http://127.0.0.1:4000/api/health          # doit renvoyer status ok
```

## 2. Restaurer les DOCUMENTS (MinIO)
```bash
# Le tar contient le dossier `minio/` (= le volume monté sur /data du conteneur).
pm2 stop lexdoc-api                                # optionnel, évite les lectures pendant la restauration
docker stop minio-lexdoc
# Sauvegarder l'état actuel avant d'écraser
mv /opt/lexdoc-data/minio /opt/lexdoc-data/minio.avant-restore.$(date +%s)
tar xzf /opt/backups/lexdoc/minio_$D.tar.gz -C /opt/lexdoc-data     # recrée /opt/lexdoc-data/minio
docker start minio-lexdoc
pm2 start lexdoc-api
```
Vérifier : générer/télécharger un document via l'app.

## 3. Restaurer les SECRETS (.env) — si perdu
```bash
sudo cp /opt/backups/lexdoc/env_$D.backup /home/lexdoc-dev/backend/.env
sudo chmod 600 /home/lexdoc-dev/backend/.env
pm2 restart lexdoc-api
```

## 4. Reconstruction complète (serveur perdu)
Ordre : (a) réinstaller Docker + conteneurs `postgres-lexdoc` / `minio-lexdoc`
(**publier en `127.0.0.1` — cf. SESSION_REPRISE, Docker bypasse UFW**),
(b) restaurer `.env` (§3), (c) base (§1c), (d) documents (§2), (e) `pm2 start`,
(f) nginx + health.

## Nettoyage
```bash
docker exec postgres-lexdoc rm -f /tmp/r.backup
docker exec postgres-lexdoc psql -U lexdoc_user -d postgres -c "DROP DATABASE IF EXISTS lexdoc_restore;"
```

## ⚠️ Limite actuelle (DR)
Les sauvegardes sont **sur le même serveur** que la production. Une perte du serveur
(disque, incendie, suppression) les emporte avec. **Réplication hors-site requise avant
go-live** (voir proposition dans le rapport 2.C) — non encore en place.
