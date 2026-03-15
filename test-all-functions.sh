#!/bin/bash

# 漫画上色网站完整功能测试脚本

BASE_URL="http://localhost:3001/api"
FRONTEND_URL="http://localhost:5173"

echo "=========================================="
echo "🧪 漫画上色网站完整功能测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试计数
PASSED=0
FAILED=0
TOTAL=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local auth_header=$6
    
    ((TOTAL++))
    echo -n "[$TOTAL] Testing $name... "
    
    if [ -n "$auth_header" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data" \
                "$BASE_URL$endpoint" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Authorization: Bearer $auth_header" \
                "$BASE_URL$endpoint" 2>/dev/null)
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BASE_URL$endpoint" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "$BASE_URL$endpoint" 2>/dev/null)
        fi
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

echo "📡 一、基础 API 测试"
echo "------------------------------------------"

# 1. 健康检查
test_api "Health Check" "GET" "/health" "" "200"

# 2. 用户注册
test_api "User Register" "POST" "/auth/register" \
    '{"email":"testuser@example.com","username":"testuser123","password":"testpass123"}' \
    "201"

# 3. 用户登录 - 获取 token
echo -n "[4] Testing User Login... "
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"admin123"}' \
    "$BASE_URL/auth/login" 2>/dev/null)

token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
user_id=$(echo "$login_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$token" ]; then
    echo -e "${GREEN}✅ PASS${NC} (got token)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (no token)"
    ((FAILED++))
fi
((TOTAL++))

echo ""
echo "🔐 二、认证后 API 测试"
echo "------------------------------------------"

# 4. 获取当前用户
test_api "Get Current User" "GET" "/auth/me" "" "200" "$token"

# 5. 更新用户资料
test_api "Update Profile" "PUT" "/auth/profile" \
    '{"username":"admin_updated","bio":"Test bio"}' \
    "200" "$token"

# 6. 获取作品列表
test_api "Get Artworks List" "GET" "/artworks" "" "200"

# 7. 获取热门作品
test_api "Get Popular Artworks" "GET" "/artworks/popular" "" "200"

# 8. 获取精选作品
test_api "Get Featured Artworks" "GET" "/artworks/featured" "" "200"

# 9. 获取单个作品详情
echo -n "[10] Testing Get Artwork Detail... "
artwork_response=$(curl -s "$BASE_URL/artworks" 2>/dev/null)
artwork_id=$(echo "$artwork_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$artwork_id" ]; then
    detail_response=$(curl -s "$BASE_URL/artworks/$artwork_id" 2>/dev/null)
    if echo "$detail_response" | grep -q "id"; then
        echo -e "${GREEN}✅ PASS${NC} (got artwork detail)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (no artwork detail)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️ SKIP${NC} (no artwork found)"
fi
((TOTAL++))

echo ""
echo "❤️ 三、收藏功能测试"
echo "------------------------------------------"

# 10. 添加收藏
test_api "Add Collection" "POST" "/collections/$artwork_id" "" "201" "$token"

# 11. 获取收藏列表
test_api "Get Collections" "GET" "/collections" "" "200" "$token"

# 12. 取消收藏
test_api "Remove Collection" "DELETE" "/collections/$artwork_id" "" "200" "$token"

echo ""
echo "👍 四、点赞功能测试"
echo "------------------------------------------"

# 13. 点赞作品
test_api "Like Artwork" "POST" "/artworks/$artwork_id/like" "" "200" "$token"

echo ""
echo "🔍 五、搜索功能测试"
echo "------------------------------------------"

# 14. 搜索作品
test_api "Search Artworks" "GET" "/artworks?query=test" "" "200"

# 15. 按标签筛选
test_api "Filter by Tag" "GET" "/artworks?tag=风景" "" "200"

echo ""
echo "👤 六、用户作品测试"
echo "------------------------------------------"

# 16. 获取我的作品
test_api "Get My Artworks" "GET" "/artworks/user/me" "" "200" "$token"

echo ""
echo "📊 七、管理员功能测试"
echo "------------------------------------------"

# 17. 获取队列统计
test_api "Get Queue Stats" "GET" "/admin/queue/stats" "" "200" "$token"

# 18. 获取用户列表
test_api "Get Users List" "GET" "/admin/users" "" "200" "$token"

echo ""
echo "=========================================="
echo "📊 测试结果汇总"
echo "=========================================="
echo -e "${GREEN}✅ 通过: $PASSED${NC}"
echo -e "${RED}❌ 失败: $FAILED${NC}"
echo -e "📝 总计: $TOTAL"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！功能正常！${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ 部分测试失败，请检查相关功能${NC}"
    exit 1
fi