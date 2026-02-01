#!/bin/bash
echo "=== AUDIT LEXDOC ==="
echo ""
echo "1. STRUCTURE PROJET"
find . -type d -maxdepth 2 | grep -v node_modules | sort

echo ""
echo "2. MODULES BACKEND"
ls -1 backend/src/modules/ 2>/dev/null || echo "Aucun module backend"

echo ""
echo "3. PAGES FRONTEND"
ls -1 frontend/src/pages/ 2>/dev/null || echo "Aucune page frontend"

echo ""
echo "4. MODELS PRISMA"
grep "^model " backend/prisma/schema.prisma 2>/dev/null | wc -l
echo "models trouvés"

echo ""
echo "5. CONTAINERS ACTIFS"
docker ps --filter "name=lexdoc" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "6. TAILLE CODE"
find backend/src -name "*.ts" 2>/dev/null | wc -l
echo "fichiers TS backend"
find frontend/src -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l
echo "fichiers TS frontend"

echo ""
echo "7. ROUTES API"
grep -r "router\." backend/src/modules/ 2>/dev/null | grep -v node_modules | wc -l
echo "endpoints API"

echo ""
echo "8. TESTS HEALTH CHECK"
curl -s http://localhost:3005/api/health | jq . 2>/dev/null || echo "Backend pas accessible"
