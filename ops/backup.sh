#!/bin/bash
#
# LexDoc — Backup nocturne BDD + .env
#
# Déployé à : /opt/backups/lexdoc/backup.sh (crontab root, 0 3 * * *)
# Rétention : 7 jours via find -mtime +7 -delete
# Sorties   : db_YYYYMMDD_HHMM.backup (pg_dump -F c)
#             env_YYYYMMDD_HHMM.backup (chmod 600, secrets DATABASE_URL/MINIO)
#
# Ce fichier est la version versionnée. Le déploiement réel se fait à la main :
#   sudo cp ops/backup.sh /opt/backups/lexdoc/backup.sh
#   sudo chmod +x /opt/backups/lexdoc/backup.sh
#
# Historique :
#   2026-05-19 — chmod 600 sur env_$D.backup (était 644 = secrets lisibles par tout user local)
#
D=$(date +%Y%m%d_%H%M)
docker exec postgres-lexdoc pg_dump -U lexdoc_user -d lexdoc_dev -F c -b -f /tmp/bk.dump
docker cp postgres-lexdoc:/tmp/bk.dump /opt/backups/lexdoc/db_$D.backup
cp /home/lexdoc-dev/backend/.env /opt/backups/lexdoc/env_$D.backup
chmod 600 /opt/backups/lexdoc/env_$D.backup
find /opt/backups/lexdoc -name "db_*.backup" -mtime +7 -delete
find /opt/backups/lexdoc -name "env_*.backup" -mtime +7 -delete
echo "$(date) — OK" >> /opt/backups/lexdoc/backup.log
