#!/bin/bash
# LexDoc — sauvegarde nocturne (cron root, 0 3 * * *).
# GO-LIVE-2.C : durci — échec BRUYANT (code d'erreur, taille plancher, intégrité),
# + sauvegarde MinIO (les documents n'étaient PAS sauvegardés), + notification.
#
# Déploiement :  sudo cp ops/backup.sh /opt/backups/lexdoc/backup.sh && sudo chmod +x ...
# Restauration : voir ops/RESTORE.md
#
# Historique :
#   2026-05-19 — chmod 600 sur env_$D.backup
#   2026-07-13 — durcissement (2.C) : set -uo pipefail, contrôle taille/intégrité,
#                sauvegarde MinIO, notification d'échec (plus de succès silencieux faux)
set -uo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/lexdoc}"
PG_CONTAINER="postgres-lexdoc"
PG_USER="lexdoc_user"
PG_DB="lexdoc_dev"
ENV_SRC="/home/lexdoc-dev/backend/.env"
MINIO_DATA="/opt/lexdoc-data/minio"
DB_MIN_SIZE=100000      # plancher : un dump valide fait ~330k+ ; < 100k = anormal
MINIO_MIN_SIZE=10000
RETENTION_DAYS=7
D=$(date +%Y%m%d_%H%M)
LOG="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

fail() {
  local msg="$1"
  echo "$(date '+%F %T') — ECHEC : $msg" >> "$LOG"
  logger -t lexdoc-backup "BACKUP FAILED: $msg"
  if command -v mail >/dev/null 2>&1; then
    printf 'Sauvegarde LexDoc echouee le %s\n\n%s\n' "$D" "$msg" | mail -s "[LexDoc] BACKUP ECHEC $D" root 2>/dev/null || true
  fi
  exit 1
}

# 1) Dump PostgreSQL (format custom -Fc, restaurable par pg_restore)
docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" -F c -b -f /tmp/bk.dump \
  || fail "pg_dump (code $?)"
docker cp "$PG_CONTAINER:/tmp/bk.dump" "$BACKUP_DIR/db_$D.backup" || fail "docker cp du dump"
docker exec "$PG_CONTAINER" rm -f /tmp/bk.dump 2>/dev/null || true

DB_SIZE=$(stat -c%s "$BACKUP_DIR/db_$D.backup" 2>/dev/null || echo 0)
[ "$DB_SIZE" -ge "$DB_MIN_SIZE" ] || fail "dump DB anormalement petit ($DB_SIZE o < $DB_MIN_SIZE)"

# 2) Vérif d'INTEGRITE : le dump doit etre lisible par pg_restore -l (table des matieres)
docker cp "$BACKUP_DIR/db_$D.backup" "$PG_CONTAINER:/tmp/verify.backup" || fail "docker cp verif"
docker exec "$PG_CONTAINER" pg_restore -l /tmp/verify.backup >/dev/null 2>&1 || fail "dump DB illisible (pg_restore -l)"
docker exec "$PG_CONTAINER" rm -f /tmp/verify.backup 2>/dev/null || true

# 3) .env (secrets applicatifs)
cp "$ENV_SRC" "$BACKUP_DIR/env_$D.backup" && chmod 600 "$BACKUP_DIR/env_$D.backup" || fail "copie .env"

# 4) MinIO — DOCUMENTS (actes, pieces). Absents des sauvegardes jusqu'a GO-LIVE-2.C.
tar czf "$BACKUP_DIR/minio_$D.tar.gz" -C "$(dirname "$MINIO_DATA")" "$(basename "$MINIO_DATA")" 2>/dev/null \
  || fail "tar MinIO"
MINIO_SIZE=$(stat -c%s "$BACKUP_DIR/minio_$D.tar.gz" 2>/dev/null || echo 0)
[ "$MINIO_SIZE" -ge "$MINIO_MIN_SIZE" ] || fail "backup MinIO anormalement petit ($MINIO_SIZE o)"

# 5) Retention (non destructif sur les backups < RETENTION_DAYS)
find "$BACKUP_DIR" -name "db_*.backup"    -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "env_*.backup"   -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "minio_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "$(date '+%F %T') — OK  db=$DB_SIZE o  minio=$MINIO_SIZE o" >> "$LOG"
