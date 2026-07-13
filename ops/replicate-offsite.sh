#!/bin/bash
# LexDoc — réplication HORS-SITE des sauvegardes (cron root, après backup.sh).
# GO-LIVE-2.E : chiffrement GPG asymétrique AVANT envoi (le serveur ne détient que
# la clé PUBLIQUE → même compromis, il ne peut pas déchiffrer les backups distants),
# upload S3-compatible via rclone, rétention distante, échec BRUYANT.
#
# PRÉ-REQUIS (à faire par Jeff — voir ops/OFFSITE-SETUP.md) :
#   1. Créer un bucket Object Storage UE (Scaleway/OVH/Backblaze B2 EU).
#   2. Installer rclone : curl https://rclone.org/install.sh | sudo bash
#   3. Configurer le remote : rclone config  (nom "offsite", type s3, provider/endpoint UE)
#   4. Cron :  0 4 * * * /home/lexdoc-dev/ops/replicate-offsite.sh
#
# La clé PRIVÉE (déchiffrement) reste HORS du serveur (chez Jeff). Sans elle, les
# backups distants sont indéchiffrables — c'est voulu.
set -uo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/lexdoc}"
PUBKEY="${PUBKEY:-/home/lexdoc-dev/ops/backup-pubkey.asc}"
RCLONE_REMOTE="${RCLONE_REMOTE:-offsite:lexdoc-backups}"   # remote:bucket
REMOTE_RETENTION_DAYS="${REMOTE_RETENTION_DAYS:-30}"
LOG="$BACKUP_DIR/offsite.log"

fail() {
  echo "$(date '+%F %T') — ECHEC offsite : $1" >> "$LOG"
  logger -t lexdoc-offsite "OFFSITE FAILED: $1"
  command -v mail >/dev/null 2>&1 && printf 'Replication hors-site LexDoc echouee\n\n%s\n' "$1" | mail -s "[LexDoc] OFFSITE ECHEC" root 2>/dev/null || true
  exit 1
}

command -v rclone >/dev/null 2>&1 || fail "rclone non installe (voir ops/OFFSITE-SETUP.md)"
command -v gpg    >/dev/null 2>&1 || fail "gpg non installe"
[ -f "$PUBKEY" ] || fail "cle publique absente ($PUBKEY)"
rclone lsf "$RCLONE_REMOTE" >/dev/null 2>&1 || fail "remote inaccessible ($RCLONE_REMOTE) — 'rclone config' fait ? bucket cree ?"

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
existing=$(rclone lsf "$RCLONE_REMOTE" 2>/dev/null || true)
uploaded=0

for f in "$BACKUP_DIR"/db_*.backup "$BACKUP_DIR"/env_*.backup "$BACKUP_DIR"/minio_*.tar.gz; do
  [ -e "$f" ] || continue
  base="$(basename "$f").gpg"
  printf '%s\n' "$existing" | grep -qxF "$base" && continue     # déjà répliqué (idempotent)
  gpg --batch --yes --trust-model always --recipient-file "$PUBKEY" \
      --encrypt --output "$TMP/$base" "$f" || fail "chiffrement gpg de $f"
  rclone copyto "$TMP/$base" "$RCLONE_REMOTE/$base" || fail "upload $base"
  rm -f "$TMP/$base"
  uploaded=$((uploaded + 1))
done

# Rétention distante (supprime le chiffré > N jours)
rclone delete "$RCLONE_REMOTE" --min-age "${REMOTE_RETENTION_DAYS}d" 2>/dev/null || true

echo "$(date '+%F %T') — OK offsite : $uploaded fichier(s) chiffres+uploades, retention ${REMOTE_RETENTION_DAYS}j" >> "$LOG"
