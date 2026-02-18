#!/bin/bash

API_URL="${API_URL:-http://localhost:4000}"

echo "🔍 Health check LexDoc..."

# Test API health
if curl -sf $API_URL/health > /dev/null 2>&1; then
    echo "✅ API Health OK"
else
    echo "❌ API Health FAILED"
    exit 1
fi

# Test Database
if curl -sf $API_URL/api/health/db > /dev/null 2>&1; then
    echo "✅ Database OK"
else
    echo "❌ Database FAILED"
    exit 1
fi

# Test detailed health
RESPONSE=$(curl -s $API_URL/api/health/detailed)
echo ""
echo "📊 Detailed status:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ All health checks passed"
