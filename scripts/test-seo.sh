#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# 创建临时目录存储响应
TEMP_DIR="test_responses"
mkdir -p $TEMP_DIR

echo -e "${GREEN}Testing SEO responses...${NC}\n"

# 1. 测试爬虫访问中文主页
echo "1. Testing Googlebot Chinese homepage..."
curl -s -A "Googlebot" https://photosong.com/zh/ > "$TEMP_DIR/zh_home.html"
grep "<title>" "$TEMP_DIR/zh_home.html"

# 2. 测试爬虫访问英文主页
echo -e "\n2. Testing Googlebot English homepage..."
curl -s -A "Googlebot" https://photosong.com/en/ > "$TEMP_DIR/en_home.html"
grep -E "<title>|<meta.*description|<meta.*keywords" "$TEMP_DIR/en_home.html"

# 3. 测试爬虫访问作品页
echo -e "\n3. Testing Googlebot work page..."
curl -s -A "Googlebot" https://photosong.com/zh/work/456 > "$TEMP_DIR/zh_work.html"
grep "<title>" "$TEMP_DIR/zh_work.html"
grep "<div class=\"work-content\">" "$TEMP_DIR/zh_work.html" -A 5

# 4. 测试普通用户访问
echo -e "\n4. Testing normal user access..."
curl -s -A "Mozilla/5.0" https://photosong.com/zh/ > "$TEMP_DIR/normal_user.html"
grep "<title>" "$TEMP_DIR/normal_user.html"

# 5. 测试百度爬虫
echo -e "\n5. Testing Baiduspider..."
curl -s -A "Baiduspider" https://photosong.com/zh/ > "$TEMP_DIR/baidu.html"
grep "<title>" "$TEMP_DIR/baidu.html"

echo -e "\n${GREEN}All tests completed! Response files saved in $TEMP_DIR${NC}"
echo "You can check the full responses in the $TEMP_DIR directory" 