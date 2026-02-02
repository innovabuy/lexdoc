#!/bin/bash

#############################################
# LexDoc - Deployment Validation Script
#
# Validates all components are operational:
# - Docker services
# - Backend API
# - Frontend
# - PostgreSQL
# - MinIO
# - System blocks & templates
# - Key pages
#
# Usage: ./scripts/validate-deployment.sh
#############################################

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3005}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:8081}"
MINIO_CONSOLE_URL="${MINIO_CONSOLE_URL:-http://localhost:9003}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-lexdoc-postgres}"
POSTGRES_USER="${POSTGRES_USER:-lexdoc_user}"
POSTGRES_DB="${POSTGRES_DB:-lexdoc_production}"

# Expected counts
MIN_BLOCKS=145
MIN_TEMPLATES=50

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
PASSED=0

# Log file
LOG_DIR="/opt/lexdoc/logs"
LOG_FILE="$LOG_DIR/tests-results.log"
mkdir -p "$LOG_DIR"

# Functions
log_header() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo "=== $1 ===" >> "$LOG_FILE"
}

log_pass() {
    echo -e "${GREEN}✓${NC} $1"
    echo "[PASS] $1" >> "$LOG_FILE"
    PASSED=$((PASSED+1))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    echo "[FAIL] $1" >> "$LOG_FILE"
    ERRORS=$((ERRORS+1))
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    echo "[WARN] $1" >> "$LOG_FILE"
    WARNINGS=$((WARNINGS+1))
}

log_info() {
    echo -e "  $1"
    echo "[INFO] $1" >> "$LOG_FILE"
}

check_http() {
    local url=$1
    local expected_codes=${2:-"200"}
    local description=$3

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null || echo "000")

    if echo "$expected_codes" | grep -q "$HTTP_CODE"; then
        log_pass "$description (HTTP $HTTP_CODE)"
        return 0
    else
        log_fail "$description (HTTP $HTTP_CODE, expected $expected_codes)"
        return 1
    fi
}

check_json_count() {
    local url=$1
    local jq_path=$2
    local min_count=$3
    local description=$4
    local token=$5

    if [ -n "$token" ]; then
        RESPONSE=$(curl -s -H "Authorization: Bearer $token" "$url" 2>/dev/null)
    else
        RESPONSE=$(curl -s "$url" 2>/dev/null)
    fi

    COUNT=$(echo "$RESPONSE" | jq -r "$jq_path" 2>/dev/null || echo "0")

    if [ "$COUNT" -ge "$min_count" ] 2>/dev/null; then
        log_pass "$description ($COUNT items, min $min_count)"
        return 0
    else
        log_fail "$description ($COUNT items, expected >= $min_count)"
        return 1
    fi
}

# Start logging
echo "=== LEXDOC DEPLOYMENT VALIDATION ===" > "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           LEXDOC DEPLOYMENT VALIDATION                       ║${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}║  Backend:  $BACKEND_URL                              ║${NC}"
echo -e "${BLUE}║  Frontend: $FRONTEND_URL                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

#############################################
# 1. Docker Services
#############################################
log_header "1. Docker Services"

# Check if docker is available
if command -v docker &> /dev/null; then
    # Check each lexdoc container
    for container in lexdoc-backend lexdoc-frontend lexdoc-postgres lexdoc-minio; do
        STATUS=$(docker ps --filter "name=$container" --format "{{.Status}}" 2>/dev/null | head -1)
        if echo "$STATUS" | grep -q "Up"; then
            if echo "$STATUS" | grep -q "healthy"; then
                log_pass "$container is running (healthy)"
            elif echo "$STATUS" | grep -q "unhealthy"; then
                log_warn "$container is running but unhealthy"
            else
                log_pass "$container is running"
            fi
        else
            log_fail "$container is not running"
        fi
    done
else
    log_warn "Docker command not available, skipping container checks"
fi

#############################################
# 2. Backend API Health
#############################################
log_header "2. Backend API"

check_http "$BACKEND_URL/api/health" "200" "Backend health endpoint"

# Check API documentation
check_http "$BACKEND_URL/api/docs" "200 301" "Swagger documentation"

#############################################
# 3. Frontend
#############################################
log_header "3. Frontend"

check_http "$FRONTEND_URL" "200" "Frontend root page"
check_http "$FRONTEND_URL/login" "200" "Login page (SPA routing)"
check_http "$FRONTEND_URL/profile/legal" "200" "Legal profile page (SPA routing)"
check_http "$FRONTEND_URL/document-builder" "200" "Document builder page (SPA routing)"

#############################################
# 4. PostgreSQL Database
#############################################
log_header "4. PostgreSQL Database"

if command -v docker &> /dev/null; then
    # Test database connection
    if docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1" > /dev/null 2>&1; then
        log_pass "PostgreSQL connection OK"

        # Check tables exist
        TABLE_COUNT=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null | tr -d ' ')
        if [ "$TABLE_COUNT" -gt 10 ]; then
            log_pass "Database schema OK ($TABLE_COUNT tables)"
        else
            log_fail "Database schema incomplete ($TABLE_COUNT tables)"
        fi
    else
        log_fail "PostgreSQL connection failed"
    fi
else
    log_warn "Cannot check PostgreSQL (docker not available)"
fi

#############################################
# 5. MinIO Storage
#############################################
log_header "5. MinIO Storage"

# MinIO console returns 403 when not authenticated, which is expected
check_http "$MINIO_CONSOLE_URL" "200 403" "MinIO console accessible"

# Check MinIO API
MINIO_API_URL="${MINIO_API_URL:-http://localhost:9002}"
check_http "$MINIO_API_URL/minio/health/live" "200 403" "MinIO API health"

#############################################
# 6. Authentication
#############################################
log_header "6. Authentication"

# Create temp login file to avoid bash escaping issues
LOGIN_JSON_FILE=$(mktemp)
cat > "$LOGIN_JSON_FILE" << 'JSONEOF'
{"email":"admin@cabinet-demo.fr","password":"Admin123!"}
JSONEOF

# Try to login and get token
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d @"$LOGIN_JSON_FILE" 2>/dev/null)

rm -f "$LOGIN_JSON_FILE"

AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty' 2>/dev/null)

if [ -n "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "null" ]; then
    log_pass "Authentication working (got JWT token)"
else
    log_fail "Authentication failed (no token received)"
    log_info "Response: $LOGIN_RESPONSE"
fi

#############################################
# 7. Document Blocks
#############################################
log_header "7. Document Blocks"

if [ -n "$AUTH_TOKEN" ]; then
    # Count system blocks
    BLOCKS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/document-blocks?isSystemBlock=true&limit=1000" 2>/dev/null)

    BLOCK_COUNT=$(echo "$BLOCKS_RESPONSE" | jq -r '.pagination.total // (.data | length) // 0' 2>/dev/null)

    if [ "$BLOCK_COUNT" -ge "$MIN_BLOCKS" ]; then
        log_pass "System blocks OK ($BLOCK_COUNT blocks, min $MIN_BLOCKS)"
    else
        log_fail "System blocks insufficient ($BLOCK_COUNT blocks, expected >= $MIN_BLOCKS)"
    fi

    # Check categories
    CATEGORIES_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/document-blocks/categories" 2>/dev/null)

    if echo "$CATEGORIES_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        log_pass "Block categories endpoint OK"
    else
        log_fail "Block categories endpoint failed"
    fi

    # Check tags
    TAGS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/document-blocks/tags" 2>/dev/null)

    if echo "$TAGS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        log_pass "Block tags endpoint OK"
    else
        log_fail "Block tags endpoint failed"
    fi
else
    log_warn "Skipping block checks (no auth token)"
fi

#############################################
# 8. Builder Templates
#############################################
log_header "8. Builder Templates"

if [ -n "$AUTH_TOKEN" ]; then
    # Count system templates
    TEMPLATES_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/builder-templates?isSystemTemplate=true&limit=1000" 2>/dev/null)

    TEMPLATE_COUNT=$(echo "$TEMPLATES_RESPONSE" | jq -r '.pagination.total // (.data | length) // 0' 2>/dev/null)

    if [ "$TEMPLATE_COUNT" -ge "$MIN_TEMPLATES" ]; then
        log_pass "System templates OK ($TEMPLATE_COUNT templates, min $MIN_TEMPLATES)"
    else
        log_fail "System templates insufficient ($TEMPLATE_COUNT templates, expected >= $MIN_TEMPLATES)"
    fi

    # Check document types
    TYPES_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/builder-templates/document-types" 2>/dev/null)

    if echo "$TYPES_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        log_pass "Document types endpoint OK"
    else
        log_fail "Document types endpoint failed"
    fi
else
    log_warn "Skipping template checks (no auth token)"
fi

#############################################
# 9. Avocat Legal Info Module
#############################################
log_header "9. Avocat Legal Info Module"

if [ -n "$AUTH_TOKEN" ]; then
    LEGAL_INFO_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/avocat-legal-info/me" 2>/dev/null)

    if echo "$LEGAL_INFO_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        log_pass "Legal info endpoint OK"
    else
        log_fail "Legal info endpoint failed"
    fi
else
    log_warn "Skipping legal info checks (no auth token)"
fi

#############################################
# 10. Folders Module
#############################################
log_header "10. Folders Module"

if [ -n "$AUTH_TOKEN" ]; then
    FOLDERS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/folders" 2>/dev/null)

    if echo "$FOLDERS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        log_pass "Folders list endpoint OK"
    else
        log_fail "Folders list endpoint failed"
    fi

    TREE_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/folders/tree" 2>/dev/null)

    if echo "$TREE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        log_pass "Folders tree endpoint OK"
    else
        log_fail "Folders tree endpoint failed"
    fi
else
    log_warn "Skipping folder checks (no auth token)"
fi

#############################################
# 11. Generated Documents Module
#############################################
log_header "11. Generated Documents Module"

if [ -n "$AUTH_TOKEN" ]; then
    GEN_DOCS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/generated-documents" 2>/dev/null)

    if echo "$GEN_DOCS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        log_pass "Generated documents endpoint OK"
    else
        log_fail "Generated documents endpoint failed"
    fi
else
    log_warn "Skipping generated documents checks (no auth token)"
fi

#############################################
# 12. Signatures & LRAR Modules
#############################################
log_header "12. Signatures & LRAR Modules"

if [ -n "$AUTH_TOKEN" ]; then
    # Signatures
    SIG_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/signatures" 2>/dev/null)

    if echo "$SIG_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        log_pass "Signatures endpoint OK"
    else
        log_warn "Signatures endpoint returned error (may not be configured)"
    fi

    # LRAR
    LRAR_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/lrar" 2>/dev/null)

    if echo "$LRAR_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        log_pass "LRAR endpoint OK"
    else
        log_warn "LRAR endpoint returned error (may not be configured)"
    fi
else
    log_warn "Skipping signature/LRAR checks (no auth token)"
fi

#############################################
# 13. Users Module (Admin)
#############################################
log_header "13. Users Module"

if [ -n "$AUTH_TOKEN" ]; then
    USERS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BACKEND_URL/api/users" 2>/dev/null)

    if echo "$USERS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        USER_COUNT=$(echo "$USERS_RESPONSE" | jq -r '.data | length // 0' 2>/dev/null)
        log_pass "Users endpoint OK ($USER_COUNT users)"
    else
        log_fail "Users endpoint failed"
    fi
else
    log_warn "Skipping users checks (no auth token)"
fi

#############################################
# FINAL SUMMARY
#############################################
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     VALIDATION SUMMARY                       ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════════╣${NC}"
printf "${BLUE}║${NC} Tests Passed:   ${GREEN}%-46s${NC} ${BLUE}║${NC}\n" "$PASSED"
printf "${BLUE}║${NC} Warnings:       ${YELLOW}%-46s${NC} ${BLUE}║${NC}\n" "$WARNINGS"
printf "${BLUE}║${NC} Errors:         ${RED}%-46s${NC} ${BLUE}║${NC}\n" "$ERRORS"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

# Write summary to log
echo "" >> "$LOG_FILE"
echo "=== SUMMARY ===" >> "$LOG_FILE"
echo "Passed:   $PASSED" >> "$LOG_FILE"
echo "Warnings: $WARNINGS" >> "$LOG_FILE"
echo "Errors:   $ERRORS" >> "$LOG_FILE"
echo "Date completed: $(date)" >> "$LOG_FILE"

# Exit status
if [ $ERRORS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ DEPLOYMENT VALIDATION SUCCESSFUL${NC}"
    echo ""
    echo "Results logged to: $LOG_FILE"
    exit 0
else
    echo ""
    echo -e "${RED}✗ DEPLOYMENT VALIDATION FAILED ($ERRORS errors)${NC}"
    echo ""
    echo "Results logged to: $LOG_FILE"
    exit 1
fi
