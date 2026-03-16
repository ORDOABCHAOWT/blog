# 📝 Minimal Blog - 个人博客系统

基于 Next.js 15 的现代化博客系统，配备优雅的 CMS 管理后台。

## ✨ 特性

- 🎨 **Material Design + 毛玻璃效果** - 精美的管理界面
- 🌓 **深色模式优化** - 完美的夜间阅读体验
- 📝 **Markdown 编辑器** - 支持实时预览、全屏写作
- 🚀 **一键发布** - 自动提交到 GitHub 并部署到 Vercel
- 🖼️ **图片上传** - 集成图片管理功能
- ⚡ **快速启动** - macOS 原生应用，双击即用

---

## 🚀 快速开始

### 方式一：macOS 应用启动（推荐）

项目根目录下有启动脚本：
```bash
./start-blog-cms.sh
```

或者双击桌面的 `博客CMS.app`（如果已创建）

### 方式二：命令行启动

```bash
npm install
npm run dev
```

访问：
- **管理后台**：http://localhost:3000/admin
- **前台博客**：http://localhost:3000

---

## 📖 使用指南

### 创建文章

1. 访问管理后台 `/admin`
2. 点击「✏️ 写新文章」
3. 填写文章信息：
   - **标题**：文章显示标题
   - **Slug**：URL 别名（自动生成）
   - **日期**：发布日期
   - **描述**：文章简介
4. 使用 Markdown 编辑器写作
5. 点击「保存文章」

### 编辑/删除文章

- 在文章列表中点击「编辑」进行修改
- 点击「删除」移除文章

### 发布到线上

点击「🚀 一键发布」，系统会自动：
1. 提交更改到 Git
2. 推送到 GitHub
3. 触发 Vercel 自动部署

---

## 🎨 界面特色

### Material Design 风格
- 圆角按钮（border-radius: 24px）
- 多层阴影系统
- 流畅的动画过渡
- 涟漪点击效果

### 毛玻璃效果
- 半透明背景
- 20px 背景模糊
- 彩色光晕装饰
- iOS/macOS 风格

### 深色模式优化
**白天模式：**
- 背景：#f8f9fa
- 主文字：#1a1a1a
- 主色调：Google Blue #1a73e8

**夜间模式：**
- 背景：#1a1a1a
- 主文字：#e8eaed（高对比度）
- 主色调：浅蓝 #8ab4f8

---

## 📝 Markdown 编辑器功能

### 工具栏
- **粗体/斜体**：文字格式化
- **标题**：H1-H6 级别标题
- **引用**：引用块
- **列表**：有序/无序列表
- **链接/图片**：插入媒体内容
- **预览**：实时预览效果
- **全屏**：专注写作模式

### 快捷键
- `⌘/Ctrl + B`：加粗
- `⌘/Ctrl + I`：斜体
- `⌘/Ctrl + K`：插入链接

### 字体优化
- **主字体**：LXGW WenKai (霞鹜文楷)
- **字号**：16px
- **行高**：2.0
- **字间距**：0.5px

---

## 🛠️ 技术栈

- **框架**：Next.js 15 (App Router)
- **样式**：Tailwind CSS + Custom CSS
- **编辑器**：SimpleMDE / EasyMDE
- **字体**：LXGW WenKai
- **部署**：Vercel
- **版本控制**：Git + GitHub

---

## 📁 项目结构

```
minimal-blog/
├── posts/                      # Markdown 文章目录
├── public/
│   └── uploads/               # 上传的图片
├── src/
│   ├── app/
│   │   ├── admin/            # CMS 管理后台
│   │   │   ├── page.tsx      # 文章列表
│   │   │   ├── new/          # 新建文章
│   │   │   └── edit/         # 编辑文章
│   │   ├── api/
│   │   │   ├── posts/        # 文章 API
│   │   │   ├── deploy/       # 部署 API
│   │   │   └── upload/       # 图片上传 API
│   │   ├── posts/            # 前台文章展示
│   │   └── globals.css       # 全局样式（含 Admin 样式）
│   └── components/
│       ├── MarkdownEditor.tsx   # Markdown 编辑器
│       └── ImageUploader.tsx    # 图片上传组件
├── start-blog-cms.sh          # 快速启动脚本
└── README.md                  # 本文件
```

---

## ⚙️ 环境配置

### 前置要求
- Node.js 18+
- npm 或 yarn
- Git

### Git 配置（用于一键发布）
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### Vercel 部署
1. 将项目推送到 GitHub
2. 在 Vercel 导入项目
3. 自动部署完成
4. 每次推送都会触发自动部署

---

## 🎯 启动脚本说明

`start-blog-cms.sh` 功能：
1. 检查端口 3000 是否被占用
2. 如未占用，启动开发服务器
3. 等待服务器就绪
4. 自动打开浏览器访问管理后台

使用方法：
```bash
chmod +x start-blog-cms.sh
./start-blog-cms.sh
```

停止服务器：
```bash
./stop-blog-cms.sh
```
或在 Terminal 中按 `Ctrl + C`

---

## 💡 使用技巧

### 写作技巧
1. **全屏模式**：点击全屏按钮，专注写作
2. **分屏预览**：边写边看，实时预览
3. **图片上传**：拖拽图片到上传区域

### 发布技巧
1. **本地预览**：保存后访问前台查看效果
2. **批量编辑**：编辑多篇后一次性发布
3. **自动备份**：每次发布自动推送到 GitHub

### 效率技巧
1. **键盘操作**：善用 Tab 键切换表单
2. **快捷键**：熟练使用编辑器快捷键
3. **收藏后台**：将 `/admin` 加入书签

---

## 🔧 自定义配置

### 修改端口
编辑 `package.json`：
```json
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

### 自定义样式
主要样式文件：`src/app/globals.css`

管理后台样式使用 CSS 变量，支持：
- `--admin-bg`：背景色
- `--admin-primary`：主色调
- `--admin-text`：文字颜色
- 等等...

---

## 🆘 常见问题

### Q: 启动失败？
A: 检查端口 3000 是否被占用，或修改启动端口

### Q: 一键发布失败？
A: 检查 Git 配置和网络连接，确保有 GitHub 推送权限

### Q: 编辑器字体未生效？
A: CDN 加载需要时间，刷新页面或检查网络

### Q: 图片上传失败？
A: 检查 `public/uploads/` 目录是否有写入权限

### Q: 深色模式文字看不清？
A: 已优化配色方案，使用高对比度颜色确保可读性

---

## 📄 License

MIT

---

## 🎉 开始使用

运行 `./start-blog-cms.sh` 或 `npm run dev`，访问管理后台开始创作！

享受优雅的写作体验 ✍️
