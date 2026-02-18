#!/bin/bash
set -e

echo "🚀 Déploiement LexDoc Production..."

# Check .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ Fichier .env.prod manquant"
    echo "   Copier .env.prod.example vers .env.prod et configurer les valeurs"
    exit 1
fi

# Load environment
export $(cat .env.prod | grep -v '#' | xargs)

# Build images
echo "📦 Build des images Docker..."
docker compose -f docker-compose.prod.yml build

# Stop old containers
echo "⏹️  Arrêt des anciens conteneurs..."
docker compose -f docker-compose.prod.yml down

# Start new containers
echo "▶️  Démarrage des nouveaux conteneurs..."
docker compose -f docker-compose.prod.yml up -d

# Wait for database
echo "⏳ Attente de la base de données..."
sleep 10

# Run migrations
echo "🔄 Exécution des migrations..."
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo ""
echo "✅ Déploiement terminé"
echo ""
echo "URLs:"
echo "   Frontend: https://app.${DOMAIN}"
echo "   API:      https://api.${DOMAIN}"
