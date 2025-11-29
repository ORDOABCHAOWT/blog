#!/bin/bash

# 自动创建 Automator 应用的脚本

APP_NAME="博客CMS"
BLOG_DIR="/Users/whitney/Downloads/minimal-blog"
DESKTOP_PATH="$HOME/Desktop"

echo "正在创建 Automator 应用..."

# 创建临时的 Automator workflow 文件
WORKFLOW_FILE="/tmp/blog-cms.workflow"

# 使用 automator 命令行创建应用
cat > /tmp/create-app.scpt <<'EOF'
tell application "Automator"
    set newAction to make new workflow with properties {name:"博客CMS"}
    tell newAction
        set shellAction to make new action with properties {name:"Run Shell Script"}
        tell shellAction
            set value of setting "inputMethod" to 0
            set value of setting "shell" to "/bin/bash"
            set value of setting "source" to "/Users/whitney/Downloads/minimal-blog/start-blog-cms.sh"
        end tell
    end tell
    save newAction in (POSIX file "/Users/whitney/Desktop/博客CMS.app")
    quit
end tell
EOF

osascript /tmp/create-app.scpt 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ 应用创建成功！位置：~/Desktop/博客CMS.app"
    echo "现在可以双击桌面上的「博客CMS」图标启动了！"
else
    echo "⚠️  Automator 自动创建失败，请手动按照 创建启动应用.md 中的步骤操作"
    echo "或者直接使用桌面上的「博客CMS.command」文件（已创建）"
fi

rm -f /tmp/create-app.scpt
