#!/bin/bash

# Blog CMS 静默启动脚本
# 后台运行，不显示终端，不显示通知

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

LOG_FILE="$SCRIPT_DIR/.cms-server.log"
PID_FILE="$SCRIPT_DIR/.cms-server.pid"
PORT=3000
ADMIN_URL="http://127.0.0.1:${PORT}/admin"
LAUNCH_LABEL="com.taffy.blogcms.server"
LAUNCH_DOMAIN="gui/$(id -u)"
PLIST_PATH="$HOME/Library/LaunchAgents/${LAUNCH_LABEL}.plist"

open_admin_url() {
    if open "$ADMIN_URL" >> "$LOG_FILE" 2>&1; then
        return 0
    fi

    for BROWSER in "Google Chrome" "Safari" "Microsoft Edge" "Arc"; do
        if open -a "$BROWSER" "$ADMIN_URL" >> "$LOG_FILE" 2>&1; then
            return 0
        fi
    done

    echo "CMS 已启动，但无法自动打开浏览器。请手动访问：$ADMIN_URL" | tee -a "$LOG_FILE"
    return 1
}

prewarm_admin_url() {
    curl -s -o /dev/null --max-time 30 "$ADMIN_URL" >/dev/null 2>&1
}

# 检查端口 3000 是否已被占用
if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    prewarm_admin_url
    open_admin_url
    exit $?
fi

# 清理旧 PID 文件；现在服务由 LaunchAgent 托管，PID 文件只作为兼容标记。
if [ -f "$PID_FILE" ]; then
    rm "$PID_FILE"
fi

# 后台启动服务器。GUI app 直接后台运行 Node 会被 macOS System Policy
# 限制访问 Downloads；交给已安装的用户级 LaunchAgent 托管更稳定。
launchctl kickstart -k "${LAUNCH_DOMAIN}/${LAUNCH_LABEL}" >/dev/null 2>&1
if [ $? -ne 0 ] && [ -f "$PLIST_PATH" ]; then
    launchctl bootstrap "$LAUNCH_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1
    launchctl kickstart -k "${LAUNCH_DOMAIN}/${LAUNCH_LABEL}" >/dev/null 2>&1
fi
echo "$LAUNCH_LABEL" > "$PID_FILE"

# 等待服务器启动（最多等待 15 秒）
MAX_WAIT=30
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        prewarm_admin_url
        open_admin_url
        exit $?
    fi
    sleep 0.5
    COUNTER=$((COUNTER + 1))
done

# 超时，但还是尝试打开浏览器
echo "CMS 启动超时。最近日志如下：" | tee -a "$LOG_FILE"
tail -n 20 "$LOG_FILE"
open_admin_url
exit 1
