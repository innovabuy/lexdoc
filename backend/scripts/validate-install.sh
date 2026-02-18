#!/bin/bash

#######################################################
# LexDoc v2.0 - Installation Validation Script
# Validates that all components are properly installed
# and configured for production deployment.
#######################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Functions
log_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

#######################################################
# System Requirements
#######################################################
log_section "System Requirements"

# Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
        log_pass "Node.js version: $NODE_VERSION (>= 18 required)"
    else
        log_fail "Node.js version: $NODE_VERSION (>= 18 required)"
    fi
else
    log_fail "Node.js not found"
fi

# npm version (quick check)
if command -v npm &> /dev/null; then
    log_pass "npm is available"
else
    log_fail "npm not found"
fi

# PostgreSQL client
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | head -1)
    log_pass "PostgreSQL client: $PSQL_VERSION"
else
    log_warn "PostgreSQL client (psql) not found - needed for backups"
fi

# pg_dump for backups
if command -v pg_dump &> /dev/null; then
    log_pass "pg_dump available for database backups"
else
    log_warn "pg_dump not found - database backups will not work"
fi

#######################################################
# Backend Structure
#######################################################
log_section "Backend Structure"

BACKEND_DIR="$(dirname "$0")/.."

# Check essential directories
REQUIRED_DIRS=(
    "src"
    "src/routes"
    "src/services"
    "src/middlewares"
    "src/config"
    "src/jobs"
    "src/templates"
    "prisma"
    "tests"
    "tests/unit"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$BACKEND_DIR/$dir" ]; then
        log_pass "Directory exists: $dir"
    else
        log_fail "Missing directory: $dir"
    fi
done

#######################################################
# Backend Services
#######################################################
log_section "Backend Services"

REQUIRED_SERVICES=(
    "email.service.js"
    "minio.service.js"
    "backup.service.js"
    "universign.service.js"
    "sendingbox.service.js"
)

for service in "${REQUIRED_SERVICES[@]}"; do
    if [ -f "$BACKEND_DIR/src/services/$service" ]; then
        log_pass "Service exists: $service"
    else
        log_fail "Missing service: $service"
    fi
done

#######################################################
# Backend Routes
#######################################################
log_section "Backend Routes"

REQUIRED_ROUTES=(
    "auth.routes.js"
    "document.routes.js"
    "folder.routes.js"
    "client.routes.js"
    "tracking.routes.js"
    "extranet.routes.js"
    "backup.routes.js"
)

for route in "${REQUIRED_ROUTES[@]}"; do
    if [ -f "$BACKEND_DIR/src/routes/$route" ]; then
        log_pass "Route exists: $route"
    else
        log_fail "Missing route: $route"
    fi
done

#######################################################
# Email Templates
#######################################################
log_section "Email Templates"

REQUIRED_TEMPLATES=(
    "document-notification.html"
    "signature-reminder-1.html"
    "signature-reminder-2.html"
    "signature-reminder-3.html"
    "client-invitation.html"
)

for template in "${REQUIRED_TEMPLATES[@]}"; do
    if [ -f "$BACKEND_DIR/src/templates/$template" ]; then
        log_pass "Template exists: $template"
    else
        log_fail "Missing template: $template"
    fi
done

#######################################################
# Prisma Schema
#######################################################
log_section "Prisma Schema"

if [ -f "$BACKEND_DIR/prisma/schema.prisma" ]; then
    log_pass "Prisma schema exists"

    # Check for required models
    REQUIRED_MODELS=(
        "Tenant"
        "User"
        "Client"
        "Folder"
        "Document"
        "SignatureTracking"
        "ClientAccess"
        "ActivityLog"
        "BackupLog"
    )

    for model in "${REQUIRED_MODELS[@]}"; do
        if grep -q "model $model" "$BACKEND_DIR/prisma/schema.prisma"; then
            log_pass "Model defined: $model"
        else
            log_fail "Missing model: $model"
        fi
    done
else
    log_fail "Prisma schema not found"
fi

#######################################################
# Tests
#######################################################
log_section "Test Files"

if [ -f "$BACKEND_DIR/tests/unit/crypto.test.js" ]; then
    log_pass "Crypto unit tests exist"
else
    log_warn "Missing crypto unit tests"
fi

if [ -f "$BACKEND_DIR/tests/unit/backup.service.test.js" ]; then
    log_pass "Backup service unit tests exist"
else
    log_warn "Missing backup service unit tests"
fi

if [ -f "$BACKEND_DIR/tests/e2e/workflow.test.js" ]; then
    log_pass "E2E workflow tests exist"
else
    log_warn "Missing E2E workflow tests"
fi

#######################################################
# Frontend Client (PWA)
#######################################################
log_section "Frontend Client (PWA)"

FRONTEND_DIR="$BACKEND_DIR/../frontend-client"

if [ -d "$FRONTEND_DIR" ]; then
    log_pass "Frontend client directory exists"

    # Check PWA files
    PWA_FILES=(
        "public/manifest.json"
        "public/service-worker.js"
        "public/offline.html"
        "src/serviceWorkerRegistration.js"
        "src/services/pushNotifications.js"
        "src/components/InstallPrompt.jsx"
    )

    for file in "${PWA_FILES[@]}"; do
        if [ -f "$FRONTEND_DIR/$file" ]; then
            log_pass "PWA file exists: $file"
        else
            log_fail "Missing PWA file: $file"
        fi
    done

    # Check manifest.json content
    if [ -f "$FRONTEND_DIR/public/manifest.json" ]; then
        if grep -q '"name"' "$FRONTEND_DIR/public/manifest.json" && \
           grep -q '"start_url"' "$FRONTEND_DIR/public/manifest.json" && \
           grep -q '"display"' "$FRONTEND_DIR/public/manifest.json"; then
            log_pass "Manifest contains required fields"
        else
            log_warn "Manifest may be missing required fields"
        fi
    fi
else
    log_warn "Frontend client directory not found"
fi

#######################################################
# Environment Configuration
#######################################################
log_section "Environment Configuration"

if [ -f "$BACKEND_DIR/.env" ]; then
    log_pass ".env file exists"

    # Check for required variables (without revealing values)
    REQUIRED_ENV_VARS=(
        "DATABASE_URL"
        "JWT_SECRET"
        "MINIO_ENDPOINT"
        "MINIO_ACCESS_KEY"
        "MINIO_SECRET_KEY"
    )

    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if grep -q "^$var=" "$BACKEND_DIR/.env"; then
            log_pass "Environment variable set: $var"
        else
            log_warn "Missing environment variable: $var"
        fi
    done

    # Check for optional but recommended variables
    OPTIONAL_ENV_VARS=(
        "SMTP_HOST"
        "GOOGLE_DRIVE_FOLDER_ID"
        "UNIVERSIGN_API_KEY"
        "SENDINGBOX_API_KEY"
        "VAPID_PUBLIC_KEY"
        "VAPID_PRIVATE_KEY"
    )

    for var in "${OPTIONAL_ENV_VARS[@]}"; do
        if grep -q "^$var=" "$BACKEND_DIR/.env"; then
            log_pass "Optional variable set: $var"
        else
            log_info "Optional variable not set: $var"
        fi
    done
else
    log_fail ".env file not found"
fi

if [ -f "$BACKEND_DIR/.env.example" ]; then
    log_pass ".env.example template exists"
else
    log_warn ".env.example template not found"
fi

#######################################################
# Dependencies
#######################################################
log_section "Dependencies"

if [ -f "$BACKEND_DIR/package.json" ]; then
    log_pass "package.json exists"

    # Check for required dependencies
    REQUIRED_DEPS=(
        "express"
        "@prisma/client"
        "jsonwebtoken"
        "bcrypt"
        "minio"
        "nodemailer"
        "node-cron"
    )

    for dep in "${REQUIRED_DEPS[@]}"; do
        if grep -q "\"$dep\"" "$BACKEND_DIR/package.json"; then
            log_pass "Dependency listed: $dep"
        else
            log_fail "Missing dependency: $dep"
        fi
    done

    # Check if node_modules exists
    if [ -d "$BACKEND_DIR/node_modules" ]; then
        log_pass "node_modules directory exists"
    else
        log_warn "node_modules not found - run 'npm install'"
    fi
else
    log_fail "package.json not found"
fi

#######################################################
# Security Checks
#######################################################
log_section "Security Checks"

# Check for common security issues
if [ -f "$BACKEND_DIR/.env" ]; then
    # Check if .env is in .gitignore
    if [ -f "$BACKEND_DIR/.gitignore" ] && grep -q "^\.env$" "$BACKEND_DIR/.gitignore"; then
        log_pass ".env is in .gitignore"
    else
        log_warn ".env should be in .gitignore"
    fi
fi

# Check for HTTPS in production URLs
if [ -f "$BACKEND_DIR/.env" ]; then
    if grep -q "http://localhost" "$BACKEND_DIR/.env" || grep -q "http://127.0.0.1" "$BACKEND_DIR/.env"; then
        log_info "Using localhost URLs (OK for development)"
    fi
fi

#######################################################
# Summary
#######################################################
log_section "Validation Summary"

TOTAL=$((PASS + FAIL + WARN))

echo ""
echo -e "  ${GREEN}Passed:${NC}   $PASS"
echo -e "  ${RED}Failed:${NC}   $FAIL"
echo -e "  ${YELLOW}Warnings:${NC} $WARN"
echo -e "  ${BLUE}Total:${NC}    $TOTAL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ All critical checks passed!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}═══════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ $FAIL critical check(s) failed${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════${NC}"
    exit 1
fi
