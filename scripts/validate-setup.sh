#!/bin/bash

echo "Validation de l'environnement LexDoc..."

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

validate() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
  else
    echo -e "${RED}✗${NC} $1"
    exit 1
  fi
}

node --version > /dev/null 2>&1
validate "Node.js installé"

npm --version > /dev/null 2>&1
validate "npm installé"

docker --version > /dev/null 2>&1
validate "Docker installé"

test -d /home/lexdoc-dev/backend
validate "Dossier backend créé"

test -d /home/lexdoc-dev/frontend
validate "Dossier frontend créé"

docker exec lexdoc-dev-postgres pg_isready -U lexdoc_user > /dev/null 2>&1
validate "PostgreSQL opérationnel"

curl -sf http://localhost:9003/minio/health/live > /dev/null 2>&1
validate "MinIO opérationnel"

test -f /home/lexdoc-dev/backend/package.json
validate "Backend package.json créé"

test -d /home/lexdoc-dev/backend/node_modules
validate "Dépendances backend installées"

test -f /home/lexdoc-dev/frontend/package.json
validate "Frontend package.json créé"

test -d /home/lexdoc-dev/frontend/node_modules
validate "Dépendances frontend installées"

test -f /home/lexdoc-dev/backend/.env
validate "Backend .env créé"

test -f /home/lexdoc-dev/frontend/.env
validate "Frontend .env créé"

echo ""
echo -e "${GREEN}✅ Environnement de développement prêt !${NC}"
