#!/bin/bash

# =====================================================
# LEXDOC - Restauration backup
# =====================================================
# Usage: ./restore.sh <backup_date>
# Exemple: ./restore.sh 20260128_143000

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Vérifier argument
if [ -z "$1" ]; then
    echo ""
    echo "Usage: ./restore.sh <backup_date>"
    echo ""
    echo "Exemple: ./restore.sh 20260128_143000"
    echo ""
    echo "Backups disponibles:"
    echo ""
    if ls "$BACKUP_DIR"/lexdoc_db_*.sql.gz 1> /dev/null 2>&1; then
        ls -1 "$BACKUP_DIR"/lexdoc_db_*.sql.gz | sed 's/.*lexdoc_db_\(.*\)\.sql\.gz/  - \1/'
    else
        echo "  (aucun backup trouve)"
    fi
    echo ""
    exit 1
fi

BACKUP_DATE=$1

# Vérifier fichiers backup
BACKUP_DB="$BACKUP_DIR/lexdoc_db_$BACKUP_DATE.sql.gz"
BACKUP_MINIO="$BACKUP_DIR/lexdoc_minio_$BACKUP_DATE.tar.gz"

if [ ! -f "$BACKUP_DB" ]; then
    echo -e "${RED}Erreur: Backup database non trouve: $BACKUP_DB${NC}"
    exit 1
fi

# Charger .env
source "$PROJECT_DIR/.env"
DB_NAME=$(echo $DATABASE_URL | sed -E 's/.*\/([^?]+).*/\1/')

echo ""
echo "=================================================="
echo -e "  ${RED}RESTAURATION BACKUP${NC}"
echo "=================================================="
echo ""
echo -e "${YELLOW}ATTENTION: Cette operation va ECRASER les donnees actuelles!${NC}"
echo ""
echo "Backup a restaurer: $BACKUP_DATE"
echo "Database cible:     $DB_NAME"
echo ""

# Confirmation
read -p "Tapez 'RESTAURER' en majuscules pour confirmer: " confirm
if [ "$confirm" != "RESTAURER" ]; then
    echo ""
    echo -e "${YELLOW}Restauration annulee${NC}"
    exit 0
fi

echo ""

# Arrêter les services LexDoc
echo -e "${YELLOW}[1/4]${NC} Arret des services LexDoc..."
cd "$PROJECT_DIR"
docker-compose stop backend healthcheck 2>/dev/null || true
echo -e "      ${GREEN}Services arretes${NC}"

# Restaurer PostgreSQL
echo ""
echo -e "${YELLOW}[2/4]${NC} Restauration PostgreSQL..."
# Drop et recreate pour éviter conflits
docker exec dcf-postgres psql -U postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
AND pid <> pg_backend_pid();
" 2>/dev/null || true

docker exec dcf-postgres psql -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
docker exec dcf-postgres psql -U postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

gunzip < "$BACKUP_DB" | docker exec -i dcf-postgres psql -U postgres -d "$DB_NAME" 2>/dev/null
echo -e "      ${GREEN}Database restauree${NC}"

# Restaurer MinIO (si backup existe)
echo ""
echo -e "${YELLOW}[3/4]${NC} Restauration MinIO..."
if [ -f "$BACKUP_MINIO" ]; then
    # Vider le volume et restaurer
    docker run --rm \
        -v lexdoc_minio_data:/data \
        -v "$BACKUP_DIR":/backup \
        alpine sh -c "rm -rf /data/* && tar xzf /backup/lexdoc_minio_$BACKUP_DATE.tar.gz -C /data" 2>/dev/null
    echo -e "      ${GREEN}MinIO restaure${NC}"
else
    echo -e "      ${YELLOW}SKIP${NC} - Backup MinIO non trouve"
fi

# Redémarrer les services
echo ""
echo -e "${YELLOW}[4/4]${NC} Redemarrage des services..."
docker-compose up -d
echo -e "      ${GREEN}Services redemarres${NC}"

echo ""
echo "=================================================="
echo -e "  ${GREEN}RESTAURATION TERMINEE${NC}"
echo "=================================================="
echo ""
echo "Verifier les services: docker-compose ps"
echo "Voir les logs:         docker-compose logs -f"
echo ""
