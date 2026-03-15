#!/bin/bash

# 漫画上色网站 API 自动化测试脚本

BASE_URL="http://localhost:3001/api"
FRONTEND_URL="http://localhost:5173"

echo "=========================================="
echo "🧪 漫画上色网站自动化测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing $name... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_status, got $status_code)"
        echo "   Response: $body"
        ((FAILED++))
        return 1
    fi
}

test_frontend() {
    local name=$1
    local path=$2
    
    echo -n "Testing $name... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL$path" 2>/dev/null)
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status_code)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $status_code)"
        ((FAILED++))
    fi
}

echo "📡 后端 API 测试"
echo "------------------------------------------"

# 健康检查
test_api "Health Check" "GET" "/health" "" "200"

# 用户注册
test_api "User Register" "POST" "/auth/register" \
    '{"email":"test@example.com","username":"testuser","password":"test123"}' \
    "201"

# 用户登录 - 获取 token
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"admin123"}' \
    "$BASE_URL/auth/login" 2>/dev/null)

token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$token" ]; then
    echo -e "${GREEN}✅ PASS${NC} User Login (got token)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} User Login (no token)"
    ((FAILED++))
fi

# 获取当前用户
test_api "Get Current User" "GET" "/auth/me" "" "401"

# 获取作品列表
test_api "Get Artworks List" "GET" "/artworks" "" "200"

# 获取热门作品
test_api "Get Popular Artworks" "GET" "/artworks/popular" "" "200"

# 获取精选作品
test_api "Get Featured Artworks" "GET" "/artworks/featured" "" "200"

echo ""
echo "🎨 前端页面测试"
echo "------------------------------------------"

# 测试前端页面
test_frontend "Home Page" "/"
test_frontend "Login Page" "/login"
test_frontend "Register Page" "/register"
test_frontend "Gallery Page" "/gallery"
test_frontend "Upload Page" "/upload"

echo ""
echo "=========================================="
echo "📊 测试结果汇总"
echo "=========================================="
echo -e "${GREEN}✅ 通过: $PASSED${NC}"
echo -e "${RED}❌ 失败: $FAILED${NC}"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ 部分测试失败，请检查服务状态${NC}"
    exit 1
fi