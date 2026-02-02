#!/bin/bash

# SCRIPT DE VÉRIFICATION COMPLÈTE LEXDOC
# Vérifie toutes les modifications et ajouts des 2 derniers jours
# Exécution : bash verify-lexdoc-complete.sh

# set -e  # Désactivé pour continuer malgré les erreurs

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Fonction pour afficher les résultats
check_item() {
    local description=$1
    local command=$2

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    echo -n "[$TOTAL_CHECKS] Vérification: $description... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗ ÉCHEC${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_file_exists() {
    local description=$1
    local filepath=$2

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "[$TOTAL_CHECKS] Fichier: $description... "

    if [ -f "$filepath" ]; then
        echo -e "${GREEN}✓ Présent${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗ Manquant${NC} ($filepath)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_dir_exists() {
    local description=$1
    local dirpath=$2

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "[$TOTAL_CHECKS] Répertoire: $description... "

    if [ -d "$dirpath" ]; then
        echo -e "${GREEN}✓ Présent${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗ Manquant${NC} ($dirpath)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_string_in_file() {
    local description=$1
    local filepath=$2
    local search_string=$3

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "[$TOTAL_CHECKS] Contenu: $description... "

    if [ -f "$filepath" ] && grep -q "$search_string" "$filepath"; then
        echo -e "${GREEN}✓ Trouvé${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗ Non trouvé${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════"
echo "  VÉRIFICATION COMPLÈTE LEXDOC - MODIFICATIONS 2 JOURS"
echo "═══════════════════════════════════════════════════════"
echo -e "${NC}"

# ==================================================
# PHASE 1 : STRUCTURE PROJET
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 1 : STRUCTURE PROJET ═══${NC}\n"

check_dir_exists "Répertoire principal /opt/lexdoc" "/opt/lexdoc"
check_dir_exists "Backend" "/opt/lexdoc/backend"
check_dir_exists "Frontend Avocat" "/opt/lexdoc/frontend"
check_dir_exists "Frontend Client (Extranet)" "/opt/lexdoc/frontend-client"

check_dir_exists "Backend/src" "/opt/lexdoc/backend/src"
check_dir_exists "Backend/prisma" "/opt/lexdoc/backend/prisma"
check_dir_exists "Backend/tests" "/opt/lexdoc/backend/tests"
check_dir_exists "Backend/scripts" "/opt/lexdoc/backend/scripts"

# ==================================================
# PHASE 2 : FICHIERS CONFIGURATION
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 2 : FICHIERS CONFIGURATION ═══${NC}\n"

check_file_exists "package.json Backend" "/opt/lexdoc/backend/package.json"
check_file_exists "tsconfig.json Backend" "/opt/lexdoc/backend/tsconfig.json"
check_file_exists "jest.config.js Backend" "/opt/lexdoc/backend/jest.config.js"
check_file_exists "Prisma Schema" "/opt/lexdoc/backend/prisma/schema.prisma"
check_file_exists "Docker Compose" "/opt/lexdoc/docker-compose.yml"
check_file_exists ".env.example" "/opt/lexdoc/.env.example"
check_file_exists "README.md" "/opt/lexdoc/README.md"

# ==================================================
# PHASE 3 : MODÈLES PRISMA (Instructions 1-18)
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 3 : MODÈLES PRISMA ═══${NC}\n"

PRISMA_SCHEMA="/opt/lexdoc/backend/prisma/schema.prisma"

# Modèles de base
check_string_in_file "Model User" "$PRISMA_SCHEMA" "model User"
check_string_in_file "Model Cabinet" "$PRISMA_SCHEMA" "model Cabinet"
check_string_in_file "Model Folder" "$PRISMA_SCHEMA" "model Folder"
check_string_in_file "Model Document" "$PRISMA_SCHEMA" "model Document"

# Instruction #3 : Profil Légal Avocat
check_string_in_file "Model AvocatLegalInfo" "$PRISMA_SCHEMA" "model AvocatLegalInfo"
check_string_in_file "Field barreau" "$PRISMA_SCHEMA" "barreau"
check_string_in_file "Field numeroToque" "$PRISMA_SCHEMA" "numeroToque"

# Instruction #14 : Arborescence Templates
check_string_in_file "Model BuilderTemplate" "$PRISMA_SCHEMA" "model BuilderTemplate"
check_string_in_file "Field category" "$PRISMA_SCHEMA" "category"
check_string_in_file "Field isSystem" "$PRISMA_SCHEMA" "isSystem"

# Instruction #7 : Métadonnées Auto-fill
check_string_in_file "Field metadataCession (Folder)" "$PRISMA_SCHEMA" "metadataCession"

# Instruction #13 : Backup Google Drive
check_string_in_file "Model BackupLog" "$PRISMA_SCHEMA" "model BackupLog"

# Instruction #16 : Tracking + Relances
check_string_in_file "Model DocumentTracking" "$PRISMA_SCHEMA" "model DocumentTracking"
check_string_in_file "Model ReminderLog" "$PRISMA_SCHEMA" "model ReminderLog"
check_string_in_file "Field reminderCount" "$PRISMA_SCHEMA" "reminderCount"
check_string_in_file "Field nextReminderAt" "$PRISMA_SCHEMA" "nextReminderAt"
check_string_in_file "Field autoRemindersEnabled" "$PRISMA_SCHEMA" "autoRemindersEnabled"

# Instruction #17 : Extranet Client
check_string_in_file "Model ClientAccess" "$PRISMA_SCHEMA" "model ClientAccess"
check_string_in_file "Model ClientAccessLog" "$PRISMA_SCHEMA" "model ClientAccessLog"
check_string_in_file "Field activationToken" "$PRISMA_SCHEMA" "activationToken"
check_string_in_file "Field passwordHash" "$PRISMA_SCHEMA" "passwordHash"

# Instruction #18 : PWA Push Notifications
check_string_in_file "Model PushSubscription" "$PRISMA_SCHEMA" "model PushSubscription"

# ==================================================
# PHASE 4 : BACKEND - MODULES PRINCIPAUX
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 4 : BACKEND - MODULES ═══${NC}\n"

check_dir_exists "Modules Auth" "/opt/lexdoc/backend/src/modules/auth"
check_dir_exists "Modules Documents" "/opt/lexdoc/backend/src/modules/documents"
check_dir_exists "Modules Templates" "/opt/lexdoc/backend/src/modules/templates"
check_dir_exists "Modules Clients" "/opt/lexdoc/backend/src/modules/clients"
check_dir_exists "Modules Signatures" "/opt/lexdoc/backend/src/modules/signatures"
check_dir_exists "Modules LRAR" "/opt/lexdoc/backend/src/modules/lrar"

# Instruction #17 : Extranet Client Controllers
check_file_exists "Clients Controller" "/opt/lexdoc/backend/src/modules/clients/clients.controller.ts"
check_file_exists "Activation Controller" "/opt/lexdoc/backend/src/modules/clients/activation.controller.ts"
check_file_exists "Extranet Controller" "/opt/lexdoc/backend/src/modules/clients/extranet.controller.ts"

# ==================================================
# PHASE 5 : BACKEND - SERVICES
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 5 : BACKEND - SERVICES ═══${NC}\n"

check_dir_exists "Services" "/opt/lexdoc/backend/src/services"
check_file_exists "Email Service" "/opt/lexdoc/backend/src/services/email.service.ts"
check_file_exists "MinIO Service" "/opt/lexdoc/backend/src/services/minio.service.ts"

# Instruction #16 : Signature Reminders Job
check_file_exists "Signature Reminders Job" "/opt/lexdoc/backend/src/jobs/signature-reminders.job.ts"

# Instruction #17 : Push Notifications
check_file_exists "Push Notification Service" "/opt/lexdoc/backend/src/services/push-notification.service.ts"

# Instruction #13 : Backup Service
check_file_exists "Backup Service" "/opt/lexdoc/backend/src/services/backup.service.ts"

# ==================================================
# PHASE 6 : BACKEND - EMAIL TEMPLATES
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 6 : EMAIL TEMPLATES ═══${NC}\n"

check_dir_exists "Email Templates" "/opt/lexdoc/backend/src/templates/emails"

# Instruction #17 : Email Invitation Client
check_file_exists "Client Invitation Email" "/opt/lexdoc/backend/src/templates/emails/client-invitation.html"

# Instruction #16 : Email Relance Signature
check_file_exists "Signature Reminder Email" "/opt/lexdoc/backend/src/templates/emails/signature-reminder.html"

# ==================================================
# PHASE 7 : FRONTEND AVOCAT
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 7 : FRONTEND AVOCAT ═══${NC}\n"

check_dir_exists "Frontend Pages" "/opt/lexdoc/frontend/src/pages"
check_dir_exists "Frontend Components" "/opt/lexdoc/frontend/src/components"
check_dir_exists "Frontend Services" "/opt/lexdoc/frontend/src/services"

# Instruction #14 : Templates Arborescence
check_file_exists "Templates Tree Page" "/opt/lexdoc/frontend/src/pages/templates/TemplatesTree.tsx"
check_file_exists "Template Category Component" "/opt/lexdoc/frontend/src/components/templates/CategoryNode.tsx"

# Instruction #16 : Envoi Signatures + LRAR
check_file_exists "Send Signature Modal" "/opt/lexdoc/frontend/src/components/documents/SendSignatureModal.tsx"
check_file_exists "Send LRAR Modal" "/opt/lexdoc/frontend/src/components/documents/SendLRARModal.tsx"
check_file_exists "Document Status Badge" "/opt/lexdoc/frontend/src/components/documents/DocumentStatusBadge.tsx"
check_file_exists "Document Tracking Card" "/opt/lexdoc/frontend/src/components/documents/DocumentTrackingCard.tsx"

# Instruction #17 : Gestion Clients (Avocat side)
check_file_exists "Clients Management Page" "/opt/lexdoc/frontend/src/pages/clients/ClientsPage.tsx"
check_file_exists "Invite Client Modal" "/opt/lexdoc/frontend/src/components/clients/InviteClientModal.tsx"

# ==================================================
# PHASE 8 : FRONTEND CLIENT (EXTRANET PWA)
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 8 : FRONTEND CLIENT (EXTRANET) ═══${NC}\n"

check_dir_exists "Frontend Client" "/opt/lexdoc/frontend-client"
check_dir_exists "Client Pages" "/opt/lexdoc/frontend-client/src/pages"
check_dir_exists "Client Components" "/opt/lexdoc/frontend-client/src/components"

# Instruction #17 : Pages Extranet
check_file_exists "Client Login Page" "/opt/lexdoc/frontend-client/src/pages/LoginPage.tsx"
check_file_exists "Client Activate Account Page" "/opt/lexdoc/frontend-client/src/pages/ActivateAccountPage.tsx"
check_file_exists "Client Dashboard Page" "/opt/lexdoc/frontend-client/src/pages/DashboardPage.tsx"
check_file_exists "Client Offline Page" "/opt/lexdoc/frontend-client/src/pages/OfflinePage.tsx"

# Instruction #17 : Composants Extranet
check_file_exists "Reminder Indicator Component" "/opt/lexdoc/frontend-client/src/components/ReminderIndicator.tsx"
check_file_exists "Document Table Component" "/opt/lexdoc/frontend-client/src/components/DocumentTable.tsx"

# ==================================================
# PHASE 9 : PWA (Instruction #18)
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 9 : PWA CONFIGURATION ═══${NC}\n"

# Fichiers PWA
check_file_exists "PWA Manifest" "/opt/lexdoc/frontend-client/public/manifest.json"
check_file_exists "Service Worker" "/opt/lexdoc/frontend-client/public/service-worker.js"
check_file_exists "Register Service Worker" "/opt/lexdoc/frontend-client/src/registerServiceWorker.ts"
check_file_exists "Install Button Component" "/opt/lexdoc/frontend-client/src/components/InstallButton.tsx"
check_file_exists "Push Service" "/opt/lexdoc/frontend-client/src/services/push.service.ts"

# Icônes PWA
check_dir_exists "PWA Icons Directory" "/opt/lexdoc/frontend-client/public/icons"
check_file_exists "Icon 192x192" "/opt/lexdoc/frontend-client/public/icons/icon-192x192.png"
check_file_exists "Icon 512x512" "/opt/lexdoc/frontend-client/public/icons/icon-512x512.png"

# Vérification contenu manifest.json
MANIFEST_FILE="/opt/lexdoc/frontend-client/public/manifest.json"
if [ -f "$MANIFEST_FILE" ]; then
    check_string_in_file "Manifest: display standalone" "$MANIFEST_FILE" "standalone"
    check_string_in_file "Manifest: start_url" "$MANIFEST_FILE" "start_url"
    check_string_in_file "Manifest: icons array" "$MANIFEST_FILE" "icons"
fi

# ==================================================
# PHASE 10 : TESTS
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 10 : INFRASTRUCTURE TESTS ═══${NC}\n"

check_dir_exists "Tests Unit" "/opt/lexdoc/backend/tests/unit"
check_dir_exists "Tests Integration" "/opt/lexdoc/backend/tests/integration"
check_dir_exists "Tests E2E" "/opt/lexdoc/backend/tests/e2e"

check_file_exists "Test Setup" "/opt/lexdoc/backend/tests/setup.ts"
check_file_exists "Infrastructure Test" "/opt/lexdoc/backend/tests/unit/00-infrastructure.test.ts"

# Instruction #15 : Tests Complets
check_file_exists "Auth Tests" "/opt/lexdoc/backend/tests/unit/01-auth.test.ts"
check_file_exists "Avocat Legal Info Tests" "/opt/lexdoc/backend/tests/unit/02-avocat-legal-info.test.ts"
check_file_exists "Templates Tree Tests" "/opt/lexdoc/backend/tests/unit/03-templates-tree.test.ts"
check_file_exists "Metadata Autofill Tests" "/opt/lexdoc/backend/tests/unit/04-metadata-autofill.test.ts"
check_file_exists "PDF Generation Tests" "/opt/lexdoc/backend/tests/unit/05-pdf-generation.test.ts"
check_file_exists "Client Forms Tests" "/opt/lexdoc/backend/tests/unit/06-client-forms.test.ts"
check_file_exists "RGPD Tests" "/opt/lexdoc/backend/tests/unit/07-rgpd.test.ts"

# Instruction #16 : Tests Envois + Tracking
check_file_exists "Envois Tracking Tests" "/opt/lexdoc/backend/tests/unit/10-envois-tracking.test.ts"

check_file_exists "Performance Tests" "/opt/lexdoc/backend/tests/performance.test.ts"
check_file_exists "Security Tests" "/opt/lexdoc/backend/tests/security.test.ts"

# Script génération rapport
check_file_exists "Test Report Generator" "/opt/lexdoc/backend/scripts/generate-test-report.js"

# ==================================================
# PHASE 11 : DOCKER & INFRASTRUCTURE
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 11 : DOCKER & INFRASTRUCTURE ═══${NC}\n"

# Vérification Docker Compose
DOCKER_COMPOSE="/opt/lexdoc/docker-compose.yml"
if [ -f "$DOCKER_COMPOSE" ]; then
    check_string_in_file "Docker: PostgreSQL service" "$DOCKER_COMPOSE" "postgres:"
    check_string_in_file "Docker: MinIO service" "$DOCKER_COMPOSE" "minio:"
    check_string_in_file "Docker: Redis service" "$DOCKER_COMPOSE" "redis:"
fi

# Vérifier si Docker est installé
check_item "Docker installé" "which docker"
check_item "Docker Compose installé" "which docker-compose"

# Vérifier services Docker (si running)
if docker ps > /dev/null 2>&1; then
    check_item "Service PostgreSQL actif" "docker ps | grep -q postgres"
    check_item "Service MinIO actif" "docker ps | grep -q minio"
    check_item "Service Redis actif" "docker ps | grep -q redis"
else
    echo -e "${YELLOW}[INFO] Docker daemon non démarré - services non vérifiés${NC}"
fi

# ==================================================
# PHASE 12 : DÉPENDANCES NPM
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 12 : DÉPENDANCES NPM ═══${NC}\n"

# Backend dependencies
if [ -f "/opt/lexdoc/backend/package.json" ]; then
    check_string_in_file "Dep: @prisma/client" "/opt/lexdoc/backend/package.json" "@prisma/client"
    check_string_in_file "Dep: express" "/opt/lexdoc/backend/package.json" "express"
    check_string_in_file "Dep: jsonwebtoken" "/opt/lexdoc/backend/package.json" "jsonwebtoken"
    check_string_in_file "Dep: bcrypt" "/opt/lexdoc/backend/package.json" "bcrypt"
    check_string_in_file "Dep: minio" "/opt/lexdoc/backend/package.json" "minio"
    check_string_in_file "Dep: nodemailer" "/opt/lexdoc/backend/package.json" "nodemailer"
    check_string_in_file "Dep: web-push" "/opt/lexdoc/backend/package.json" "web-push"
    check_string_in_file "Dep: node-cron" "/opt/lexdoc/backend/package.json" "node-cron"
    check_string_in_file "DevDep: jest" "/opt/lexdoc/backend/package.json" "jest"
    check_string_in_file "DevDep: ts-jest" "/opt/lexdoc/backend/package.json" "ts-jest"
    check_string_in_file "DevDep: supertest" "/opt/lexdoc/backend/package.json" "supertest"
fi

# Vérifier node_modules installés
if [ -d "/opt/lexdoc/backend" ]; then
    check_dir_exists "Backend node_modules" "/opt/lexdoc/backend/node_modules"
fi

# ==================================================
# PHASE 13 : INSTRUCTIONS CRÉÉES (Documentation)
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 13 : DOCUMENTATION INSTRUCTIONS ═══${NC}\n"

DOCS_DIR="/opt/lexdoc/docs/instructions"
mkdir -p "$DOCS_DIR" 2>/dev/null || true

check_file_exists "Instruction #0 Initialisation" "$DOCS_DIR/instruction-00-initialisation-projet.md"
check_file_exists "Instruction #1-2 Blocs + Templates" "$DOCS_DIR/instruction-01-02-blocs-templates.md"
check_file_exists "Instruction #3 Profil Légal" "$DOCS_DIR/instruction-03-profil-legal-avocat.md"
check_file_exists "Instruction #4 Droit Affaires" "$DOCS_DIR/instruction-04-droit-affaires.md"
check_file_exists "Instruction #6 Bloc Saisie Libre" "$DOCS_DIR/instruction-06-bloc-saisie-libre.md"
check_file_exists "Instruction #7 Métadonnées" "$DOCS_DIR/instruction-07-metadata-autofill.md"
check_file_exists "Instruction #9 Formulaire Client" "$DOCS_DIR/instruction-09-formulaire-client.md"
check_file_exists "Instruction #10 RGPD" "$DOCS_DIR/instruction-10-rgpd.md"
check_file_exists "Instruction #11 Wizards" "$DOCS_DIR/instruction-11-wizards.md"
check_file_exists "Instruction #12 PDF Pro" "$DOCS_DIR/instruction-12-pdf-generation.md"
check_file_exists "Instruction #13 Backup" "$DOCS_DIR/instruction-13-backup-google-drive.md"
check_file_exists "Instruction #14 Arborescence" "$DOCS_DIR/instruction-14-arborescence-templates.md"
check_file_exists "Instruction #15 Tests" "$DOCS_DIR/instruction-15-tests-ultra-complets.md"
check_file_exists "Instruction #16 Envois + Tracking" "$DOCS_DIR/instruction-16-envois-tracking-relances.md"
check_file_exists "Instruction #17 Extranet Client" "$DOCS_DIR/instruction-17-extranet-client.md"
check_file_exists "Instruction #18 PWA" "$DOCS_DIR/instruction-18-pwa-installation-bureau.md"

# ==================================================
# PHASE 14 : MAQUETTES HTML
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 14 : MAQUETTES HTML ═══${NC}\n"

MAQUETTES_DIR="/opt/lexdoc/docs/maquettes"
mkdir -p "$MAQUETTES_DIR" 2>/dev/null || true

check_file_exists "Maquette Arborescence Templates" "$MAQUETTES_DIR/maquette-lexdoc-templates.html"
check_file_exists "Maquette Extranet Client" "$MAQUETTES_DIR/maquette-extranet-client.html"

# ==================================================
# PHASE 15 : CONFIGURATION ENVIRONNEMENT
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 15 : CONFIGURATION ═══${NC}\n"

ENV_EXAMPLE="/opt/lexdoc/.env.example"
if [ -f "$ENV_EXAMPLE" ]; then
    check_string_in_file "Env: DATABASE_URL" "$ENV_EXAMPLE" "DATABASE_URL"
    check_string_in_file "Env: JWT_SECRET" "$ENV_EXAMPLE" "JWT_SECRET"
    check_string_in_file "Env: MINIO_" "$ENV_EXAMPLE" "MINIO_"
    check_string_in_file "Env: SMTP_" "$ENV_EXAMPLE" "SMTP_"
    check_string_in_file "Env: UNIVERSIGN" "$ENV_EXAMPLE" "UNIVERSIGN"
    check_string_in_file "Env: SENDINGBOX" "$ENV_EXAMPLE" "SENDINGBOX"
    check_string_in_file "Env: VAPID (PWA)" "$ENV_EXAMPLE" "VAPID"
    check_string_in_file "Env: CLIENT_EXTRANET_URL" "$ENV_EXAMPLE" "CLIENT_EXTRANET_URL"
fi

# ==================================================
# PHASE 16 : MIDDLEWARES & UTILS
# ==================================================
echo -e "\n${YELLOW}═══ PHASE 16 : MIDDLEWARES & UTILS ═══${NC}\n"

check_dir_exists "Middlewares" "/opt/lexdoc/backend/src/middlewares"
check_dir_exists "Utils" "/opt/lexdoc/backend/src/utils"

check_file_exists "Auth Middleware" "/opt/lexdoc/backend/src/middlewares/auth.ts"
check_file_exists "Client Auth Middleware" "/opt/lexdoc/backend/src/middlewares/client-auth.ts"
check_file_exists "Error Handler Middleware" "/opt/lexdoc/backend/src/middlewares/error-handler.ts"

check_file_exists "Logger Utility" "/opt/lexdoc/backend/src/utils/logger.ts"
check_file_exists "Crypto Utility" "/opt/lexdoc/backend/src/utils/crypto.ts"

# ==================================================
# RAPPORT FINAL
# ==================================================
echo -e "\n${BLUE}"
echo "═══════════════════════════════════════════════════════"
echo "  RAPPORT FINAL - VÉRIFICATION LEXDOC"
echo "═══════════════════════════════════════════════════════"
echo -e "${NC}"

PASS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASSED_CHECKS / $TOTAL_CHECKS) * 100}")

echo -e "${YELLOW}Résumé Global :${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Total vérifications  : ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "✓ Passées           : ${GREEN}$PASSED_CHECKS${NC}"
echo -e "✗ Échouées          : ${RED}$FAILED_CHECKS${NC}"
echo -e "Taux de réussite    : ${GREEN}$PASS_RATE%${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
if (( $(echo "$PASS_RATE >= 95.0" | bc -l) )); then
    echo -e "${GREEN}🎉 EXCELLENT !${NC}"
    echo "L'application LexDoc est complète et prête pour le développement."
    echo "Tous les composants majeurs sont en place."
elif (( $(echo "$PASS_RATE >= 80.0" | bc -l) )); then
    echo -e "${YELLOW}⚠️  BON${NC}"
    echo "La majorité des composants sont en place."
    echo "Quelques éléments manquants ou à compléter."
elif (( $(echo "$PASS_RATE >= 50.0" | bc -l) )); then
    echo -e "${YELLOW}🚧 EN COURS${NC}"
    echo "Structure de base présente mais incomplète."
    echo "Continuer l'implémentation des instructions."
else
    echo -e "${RED}🚨 CRITIQUE${NC}"
    echo "L'application est largement incomplète."
    echo "Exécuter l'Instruction #0 pour initialiser le projet."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Recommandations
echo -e "\n${YELLOW}Recommandations :${NC}"

if [ $FAILED_CHECKS -gt 0 ]; then
    echo ""
    echo "1. Vérifier les éléments manquants ci-dessus"
    echo "2. Exécuter les instructions Claude Code dans l'ordre :"
    echo "   - Instruction #0 : Initialisation projet"
    echo "   - Instructions #1-18 : Features progressives"
    echo "3. Installer les dépendances npm :"
    echo "   cd /opt/lexdoc/backend && npm install"
    echo "4. Démarrer Docker services :"
    echo "   docker-compose up -d"
    echo "5. Migrer la base de données :"
    echo "   npm run prisma:migrate"
fi

# Sauvegarder rapport
REPORT_FILE="/opt/lexdoc/VERIFICATION-REPORT-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "RAPPORT VÉRIFICATION LEXDOC"
    echo "Date: $(date)"
    echo "Total: $TOTAL_CHECKS | Passées: $PASSED_CHECKS | Échouées: $FAILED_CHECKS"
    echo "Taux: $PASS_RATE%"
} > "$REPORT_FILE" 2>/dev/null || true

if [ -f "$REPORT_FILE" ]; then
    echo ""
    echo "📄 Rapport sauvegardé : $REPORT_FILE"
fi

echo ""
echo "═══════════════════════════════════════════════════════"

# Exit code basé sur le taux de réussite
if (( $(echo "$PASS_RATE >= 80.0" | bc -l) )); then
    exit 0
else
    exit 1
fi
