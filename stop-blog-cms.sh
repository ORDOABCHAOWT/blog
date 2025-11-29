#!/bin/bash

# Blog CMS 停止脚本

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PID_FILE="$SCRIPT_DIR/.cms-server.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "正在停止服务器 (PID: $PID)..."
        kill $PID
        rm "$PID_FILE"
        echo "✅ 服务器已停止"
    else
        echo "⚠️  服务器未在运行"
        rm "$PID_FILE"
    fi
else
    echo "⚠️  未找到运行中的服务器"
fi

# 额外检查并清理 3000 端口
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "检测到端口 3000 仍被占用，正在清理..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    echo "✅ 端口已清理"
fi
