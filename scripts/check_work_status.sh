#!/bin/bash

# 设置脚本目录为工作目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# 确保日志目录存在
LOG_DIR="logs"
mkdir -p "$LOG_DIR"

# 设置日志文件
LOG_FILE="$LOG_DIR/check_work_status.log"
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

# 导出环境变量（从宝塔面板环境变量中获取）
source /etc/profile
source ~/.bashrc

# 记录开始时间
echo "$(date '+%Y-%m-%d %H:%M:%S') Starting work status check..." | tee -a "$LOG_FILE"

# 运行 Node.js 脚本
node "$SCRIPT_DIR/check_work_status.js" 2>&1 | tee -a "$LOG_FILE"

# 记录结束时间和退出码
EXIT_CODE=$?
echo "$(date '+%Y-%m-%d %H:%M:%S') Script finished with exit code: $EXIT_CODE" | tee -a "$LOG_FILE"

# 如果日志文件过大，进行轮转
MAX_LOG_SIZE=$((10 * 1024 * 1024)) # 10MB
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
  mv "$LOG_FILE" "$LOG_FILE.old"
  touch "$LOG_FILE"
  chmod 644 "$LOG_FILE"
fi

exit $EXIT_CODE
