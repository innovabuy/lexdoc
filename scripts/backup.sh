#!/bin/bash

BACKUP_DIR="/home/lexdoc-dev/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "📦 Backup database..."
docker exec lexdoc-dev-postgres pg_dump -U lexdoc_user --clean --if-exists lexdoc_dev | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# MinIO backup
echo "📦 Backup MinIO..."
docker run --rm -v /home/lexdoc-dev/data/minio:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/minio_$DATE.tar.gz /data

# Retention : garder 30 jours
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete 2>/dev/null
find $BACKUP_DIR -name "minio_*.tar.gz" -mtime +30 -delete 2>/dev/null

echo "✅ Backup completed: $DATE"
ls -la $BACKUP_DIR
