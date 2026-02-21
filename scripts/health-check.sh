#!/bin/bash

# Beacon Server Health Monitor
# Checks server health and sends alerts if issues detected

SERVER_URL="${1:-http://localhost:8080}"
WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

echo "🏥 Beacon Health Monitor"
echo "========================"
echo "Server: $SERVER_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check health endpoint
echo -n "Checking /health... "
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$SERVER_URL/health" 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ OK${NC}"
    
    # Parse services status
    POSTGRES=$(echo "$HEALTH_BODY" | grep -o '"postgres":"[^"]*"' | cut -d'"' -f4)
    MONGODB=$(echo "$HEALTH_BODY" | grep -o '"mongodb":"[^"]*"' | cut -d'"' -f4)
    REDIS=$(echo "$HEALTH_BODY" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)
    
    echo "  PostgreSQL: $POSTGRES"
    echo "  MongoDB: $MONGODB"
    echo "  Redis: $REDIS"
else
    echo -e "${RED}✗ FAILED (HTTP $HTTP_CODE)${NC}"
    
    # Send alert if webhook configured
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"content\":\"🚨 Beacon server health check failed! HTTP $HTTP_CODE\"}"
    fi
    exit 1
fi

# Check API version
echo -n "Checking /api/version... "
VERSION_RESPONSE=$(curl -s -w "\n%{http_code}" "$SERVER_URL/api/version" 2>/dev/null)
VERSION_CODE=$(echo "$VERSION_RESPONSE" | tail -n1)

if [ "$VERSION_CODE" = "200" ]; then
    echo -e "${GREEN}✓ OK${NC}"
    VERSION=$(echo "$VERSION_RESPONSE" | head -n-1 | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "  Version: $VERSION"
else
    echo -e "${YELLOW}⚠ WARNING (HTTP $VERSION_CODE)${NC}"
fi

# Check WebSocket gateway
echo -n "Checking WebSocket... "
WS_URL=$(echo "$SERVER_URL" | sed 's/http/ws/')/gateway
WS_CHECK=$(timeout 5 wscat -c "$WS_URL" 2>&1 || echo "failed")

if echo "$WS_CHECK" | grep -q "connected"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ Cannot verify (wscat not installed)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Health check complete!${NC}"
