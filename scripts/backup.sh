#!/bin/bash

# =====================================================
# LEXDOC - Backup base de données + MinIO
# =====================================================
# Usage: ./backup.sh
# Cron recommandé: 0 3 * * * cd /opt/lexdoc && ./scripts/backup.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "=================================================="
echo "  LEXDOC - BACKUP $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="
echo ""

# Charger .env
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
else
    echo -e "${RED}Erreur: .env non trouve${NC}"
    exit 1
fi

# Créer dossier backups
mkdir -p "$BACKUP_DIR"

# Parser DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -E 's/.*\/([^?]+).*/\1/')

# Backup PostgreSQL
echo -e "${YELLOW}[1/3]${NC} Backup PostgreSQL ($DB_NAME)..."
BACKUP_DB="$BACKUP_DIR/lexdoc_db_$DATE.sql.gz"

if docker exec dcf-postgres pg_dump -U postgres -d "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_DB"; then
    SIZE=$(du -h "$BACKUP_DB" | cut -f1)
    echo -e "      ${GREEN}OK${NC} - $BACKUP_DB ($SIZE)"
else
    echo -e "      ${RED}ERREUR${NC} - Backup database echoue"
    rm -f "$BACKUP_DB"
fi

# Backup MinIO
echo ""
echo -e "${YELLOW}[2/3]${NC} Backup MinIO (volumes Docker)..."
BACKUP_MINIO="$BACKUP_DIR/lexdoc_minio_$DATE.tar.gz"

# Vérifier si le volume existe
if docker volume ls | grep -q "lexdoc_minio_data"; then
    if docker run --rm \
        -v lexdoc_minio_data:/data:ro \
        -v "$BACKUP_DIR":/backup \
        alpine tar czf "/backup/lexdoc_minio_$DATE.tar.gz" -C /data . 2>/dev/null; then
        SIZE=$(du -h "$BACKUP_MINIO" | cut -f1)
        echo -e "      ${GREEN}OK${NC} - $BACKUP_MINIO ($SIZE)"
    else
        echo -e "      ${RED}ERREUR${NC} - Backup MinIO echoue"
        rm -f "$BACKUP_MINIO"
    fi
else
    echo -e "      ${YELLOW}SKIP${NC} - Volume lexdoc_minio_data non trouve (premier deploiement?)"
fi

# Nettoyage anciens backups
echo ""
echo -e "${YELLOW}[3/3]${NC} Nettoyage backups > $RETENTION_DAYS jours..."
DELETED=$(find "$BACKUP_DIR" -name "lexdoc_*" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo -e "      ${GREEN}$DELETED fichier(s) supprime(s)${NC}"

# Résumé
echo ""
echo "=================================================="
echo -e "  ${GREEN}BACKUP TERMINE${NC}"
echo "=================================================="
echo ""
echo "Fichiers crees:"
ls -lh "$BACKUP_DIR"/lexdoc_*_$DATE* 2>/dev/null || echo "  (aucun nouveau fichier)"
echo ""
echo "Espace utilise par les backups:"
du -sh "$BACKUP_DIR" 2>/dev/null || echo "  0"
echo ""
