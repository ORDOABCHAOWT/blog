#!/bin/bash

# 自动创建 Automator 应用的脚本

APP_NAME="博客CMS"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
START_SCRIPT="$SCRIPT_DIR/start-blog-cms.sh"
DESKTOP_PATH="$HOME/Desktop"
APP_PATH="$DESKTOP_PATH/$APP_NAME.app"
COMMAND_PATH="$DESKTOP_PATH/$APP_NAME.command"

echo "正在创建 Automator 应用..."

# 使用 automator 命令行创建应用
cat > /tmp/create-app.scpt <<EOF
tell application "Automator"
    set newAction to make new workflow with properties {name:"博客CMS"}
    tell newAction
        set shellAction to make new action with properties {name:"Run Shell Script"}
        tell shellAction
            set value of setting "inputMethod" to 0
            set value of setting "shell" to "/bin/bash"
            set value of setting "source" to "$START_SCRIPT"
        end tell
    end tell
    save newAction in (POSIX file "$APP_PATH")
    quit
end tell
EOF

osascript /tmp/create-app.scpt 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ 应用创建成功！位置：$APP_PATH"
    echo "现在可以双击桌面上的「博客CMS」图标启动了！"
else
    cat > "$COMMAND_PATH" <<COMMAND_EOF
#!/bin/bash
"$START_SCRIPT"
COMMAND_EOF
    chmod +x "$COMMAND_PATH"

    echo "⚠️  Automator 自动创建失败，已创建可双击启动文件：$COMMAND_PATH"
fi

rm -f /tmp/create-app.scpt
