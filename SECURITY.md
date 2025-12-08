# 🔐 安全配置指南

本文档说明如何正确配置博客 CMS 以确保安全运行。

## ⚠️ 重要安全提示

该项目已实施以下安全加固措施：

### 1. 身份认证保护

所有管理端点（`/admin` 和 `/api/*`）现在都需要 HTTP Basic Authentication。

**配置步骤：**

1. 复制环境变量示例文件：
   ```bash
   cp .env.example .env.local
   ```

2. 编辑 `.env.local`，设置强密码：
   ```env
   ADMIN_USER=admin
   ADMIN_PASSWORD=your-very-strong-password-123!@#
   ```

3. **密码要求：**
   - 至少 16 位字符
   - 包含大小写字母、数字和特殊字符
   - 不要使用常见词汇或个人信息

4. 重启开发服务器：
   ```bash
   npm run dev
   ```

5. 访问管理界面时，浏览器会提示输入用户名和密码

### 2. 阿里云 OSS 密钥管理

**当前状态检查：**

⚠️ 如果您的 OSS 密钥曾经泄露（例如提交到 Git 或公开分享），请立即执行以下步骤：

**密钥轮换步骤：**

1. 登录[阿里云 RAM 控制台](https://ram.console.aliyun.com/manage/ak)

2. 创建新的 AccessKey：
   - 点击「创建 AccessKey」
   - 记录新的 AccessKeyId 和 AccessKeySecret

3. 更新 `.env.local` 文件：
   ```env
   OSS_ACCESS_KEY_ID=新的AccessKeyId
   OSS_ACCESS_KEY_SECRET=新的AccessKeySecret
   ```

4. 删除旧的 AccessKey：
   - 返回 RAM 控制台
   - 找到旧的 AccessKey
   - 点击「删除」

5. 验证配置：
   ```bash
   npm run dev
   # 访问 http://localhost:3000/admin
   # 尝试上传图片，确认 OSS 配置正常
   ```

### 3. Vercel 部署配置

在 Vercel 部署时，不要使用 `.env.local` 文件，而应使用 Vercel 的环境变量管理：

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入「Settings」→「Environment Variables」
4. 添加以下变量：
   - `ADMIN_USER`
   - `ADMIN_PASSWORD`
   - `OSS_ACCESS_KEY_ID`
   - `OSS_ACCESS_KEY_SECRET`
   - `OSS_BUCKET`
   - `OSS_REGION`
   - `OSS_ENDPOINT`
   - `OSS_DOMAIN`

5. 重新部署项目

### 4. Git 仓库安全检查

**确保敏感文件不被提交：**

```bash
# 检查 .gitignore 是否包含
cat .gitignore | grep -E '\.env'

# 检查历史记录中是否有 .env 文件
git log --all --full-history -- .env.local

# 如果发现 .env.local 在历史中，需要清理 Git 历史（谨慎操作）
# 建议：轮换所有密钥后再清理
```

## 🛡️ 已实施的安全措施

### 路径遍历防护
- 所有 `slug` 参数都经过严格验证
- 只允许字母、数字、连字符和下划线
- 阻止 `../` 等路径遍历攻击

### 文件上传安全
- 移除了 SVG 文件支持（防止 XSS 攻击）
- 双重验证：MIME 类型 + 文件扩展名
- 文件大小限制：10MB
- 支持的格式：JPEG, PNG, GIF, WebP

### 命令注入防护
- Git 命令使用参数化执行（`execFile` 替代 `exec`）
- Commit message 作为独立参数传递，防止命令注入

### Slug 格式限制
- **允许的字符：**`a-z`, `A-Z`, `0-9`, `-`, `_`
- **不允许的字符：**空格、中文、特殊符号、路径分隔符

**示例：**
```
✅ 有效 slug: "my-first-post", "travel_2024", "tech-article-1"
❌ 无效 slug: "我的文章", "my post", "../etc/passwd", "post@123"
```

## 📋 安全检查清单

部署前请确认：

- [ ] 已配置 `ADMIN_USER` 和 `ADMIN_PASSWORD`
- [ ] 密码强度符合要求（至少 16 位）
- [ ] OSS 密钥已配置且未泄露
- [ ] `.env.local` 已添加到 `.gitignore`
- [ ] `.env.local` 从未被提交到 Git 仓库
- [ ] Vercel 环境变量已正确配置
- [ ] 已测试管理界面需要认证才能访问
- [ ] 已测试文件上传功能正常
- [ ] 已测试部署功能正常

## 🚨 应急响应

### 如果发现未经授权的访问

1. **立即轮换所有密钥：**
   - 更改 `ADMIN_PASSWORD`
   - 轮换 OSS AccessKey

2. **检查博客内容：**
   ```bash
   git log --all --oneline -20  # 查看最近的提交
   git diff HEAD~10  # 检查最近的更改
   ```

3. **检查 OSS 存储：**
   - 登录阿里云 OSS 控制台
   - 检查是否有异常上传的文件

4. **重新部署：**
   ```bash
   git push origin main  # 触发 Vercel 重新部署
   ```

### 报告安全问题

如果发现安全漏洞，请通过以下方式报告：
- 不要公开披露漏洞
- 联系项目维护者
- 提供详细的漏洞复现步骤

## 📚 相关资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [阿里云 OSS 安全最佳实践](https://help.aliyun.com/document_detail/31867.html)
- [Next.js 安全指南](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [HTTP Basic Authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)

---

**最后更新：** 2025-12-08
**安全审计：** Palantir Security Review
