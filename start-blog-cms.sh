#!/bin/bash

# Blog CMS 静默启动脚本
# 后台运行，不显示终端，不显示通知

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

LOG_FILE="$SCRIPT_DIR/.cms-server.log"
PID_FILE="$SCRIPT_DIR/.cms-server.pid"

# 检查端口 3000 是否已被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    # 端口已被占用，直接打开浏览器
    open "http://localhost:3000/admin"
    exit 0
fi

# 检查是否有 PID 文件且进程还在运行
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p $OLD_PID > /dev/null 2>&1; then
        # 进程还在，直接打开浏览器
        open "http://localhost:3000/admin"
        exit 0
    else
        # 进程不在了，清理 PID 文件
        rm "$PID_FILE"
    fi
fi

# 后台启动服务器
nohup npm run dev > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PID_FILE"

# 等待服务器启动（最多等待 15 秒）
MAX_WAIT=30
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        # 服务器已启动，打开浏览器
        sleep 1  # 再等 1 秒确保完全就绪
        open "http://localhost:3000/admin"
        exit 0
    fi
    sleep 0.5
    COUNTER=$((COUNTER + 1))
done

# 超时，但还是尝试打开浏览器
open "http://localhost:3000/admin"
exit 1
