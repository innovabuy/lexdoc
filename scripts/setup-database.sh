#!/bin/bash

# =====================================================
# LEXDOC - Setup base de données dans PostgreSQL existant
# =====================================================
# Ce script crée la database et l'utilisateur LexDoc
# dans le PostgreSQL existant (dcf-postgres)

set -e

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "=================================================="
echo "  LEXDOC - Configuration PostgreSQL"
echo "=================================================="
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "../.env" ] && [ ! -f ".env" ]; then
    echo -e "${RED}Erreur: Fichier .env non trouvé.${NC}"
    echo "Copier .env.example vers .env et le configurer d'abord."
    echo ""
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    exit 1
fi

# Charger variables .env
if [ -f "../.env" ]; then
    source ../.env
elif [ -f ".env" ]; then
    source .env
fi

# Vérifier DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Erreur: DATABASE_URL non défini dans .env${NC}"
    exit 1
fi

# Parser DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -E 's/.*:\/\/([^:]+):.*/\1/')
DB_PASSWORD=$(echo $DATABASE_URL | sed -E 's/.*:\/\/[^:]+:([^@]+)@.*/\1/')
DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')
DB_NAME=$(echo $DATABASE_URL | sed -E 's/.*\/([^?]+).*/\1/')

echo "Configuration detectee:"
echo "  - Host:     $DB_HOST"
echo "  - Port:     $DB_PORT"
echo "  - Database: $DB_NAME"
echo "  - User:     $DB_USER"
echo ""

# Vérifier que dcf-postgres est actif
echo -e "${YELLOW}[1/5]${NC} Verification connexion PostgreSQL (dcf-postgres)..."
if docker ps | grep -q "dcf-postgres"; then
    echo -e "      ${GREEN}Container dcf-postgres actif${NC}"
else
    echo -e "${RED}Erreur: Container dcf-postgres non trouve ou inactif${NC}"
    echo "Verifier avec: docker ps | grep postgres"
    exit 1
fi

# Test connexion
if docker exec dcf-postgres psql -U postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "      ${GREEN}Connexion PostgreSQL OK${NC}"
else
    echo -e "${RED}Erreur: Impossible de se connecter a dcf-postgres${NC}"
    exit 1
fi

# Créer utilisateur
echo ""
echo -e "${YELLOW}[2/5]${NC} Creation utilisateur '$DB_USER'..."
docker exec dcf-postgres psql -U postgres -c "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
        RAISE NOTICE 'Utilisateur $DB_USER cree';
    ELSE
        ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
        RAISE NOTICE 'Utilisateur $DB_USER existe, mot de passe mis a jour';
    END IF;
END
\$\$;
" 2>/dev/null && echo -e "      ${GREEN}Utilisateur configure${NC}" || echo -e "      ${YELLOW}Utilisateur peut-etre deja existant${NC}"

# Créer database
echo ""
echo -e "${YELLOW}[3/5]${NC} Creation database '$DB_NAME'..."
docker exec dcf-postgres psql -U postgres -c "
SELECT 'Database existe deja' WHERE EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME');
" 2>/dev/null | grep -q "existe" && {
    echo -e "      ${YELLOW}Database existe deja${NC}"
} || {
    docker exec dcf-postgres psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null
    echo -e "      ${GREEN}Database creee${NC}"
}

# Accorder privilèges
echo ""
echo -e "${YELLOW}[4/5]${NC} Configuration privileges..."
docker exec dcf-postgres psql -U postgres -c "
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
" 2>/dev/null && echo -e "      ${GREEN}Privileges accordes${NC}"

# Activer extensions
echo ""
echo -e "${YELLOW}[5/5]${NC} Activation extensions PostgreSQL..."
docker exec dcf-postgres psql -U postgres -d $DB_NAME -c "
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";
CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";
" 2>/dev/null && echo -e "      ${GREEN}Extensions activees (uuid-ossp, pgcrypto, pg_trgm)${NC}"

# Résumé
echo ""
echo "=================================================="
echo -e "  ${GREEN}DATABASE CONFIGUREE AVEC SUCCES${NC}"
echo "=================================================="
echo ""
echo "Informations de connexion:"
echo "  DATABASE_URL=$DATABASE_URL"
echo ""
echo "Prochaines etapes:"
echo "  1. Demarrer la stack: docker-compose up -d"
echo "  2. Les migrations Prisma s'executeront au premier demarrage"
echo ""
