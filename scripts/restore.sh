#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_date>"
    echo "Example: ./restore.sh 20260203_120000"
    echo ""
    echo "Available backups:"
    ls -la /home/lexdoc-dev/backups/db_*.sql.gz 2>/dev/null
    exit 1
fi

DATE=$1
BACKUP_DIR="/home/lexdoc-dev/backups"

# Restore database
echo "🔄 Restoring database from db_$DATE.sql.gz..."
gunzip -c $BACKUP_DIR/db_$DATE.sql.gz | docker exec -i lexdoc-dev-postgres psql -U lexdoc_user lexdoc_dev

# Restore MinIO
if [ -f "$BACKUP_DIR/minio_$DATE.tar.gz" ]; then
    echo "🔄 Restoring MinIO from minio_$DATE.tar.gz..."
    docker run --rm -v /home/lexdoc-dev/data/minio:/data -v $BACKUP_DIR:/backup alpine sh -c "cd / && tar xzf /backup/minio_$DATE.tar.gz"
fi

echo "✅ Restore completed"
