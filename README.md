<p align="center"><img src="docs/store-preview.png" alt="Minimal Blog 功能预览"></p>

<h1 align="center">Minimal Blog</h1>
<p align="center">写作、预览与发布，集中在一个干净的本地 CMS。</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-111111" alt="Next.js 15">
  <img src="https://img.shields.io/badge/Deploy-Vercel-111111" alt="Vercel">
  <img src="https://img.shields.io/badge/Code-MIT-E9781D" alt="MIT License">
</p>

## 亮点

- Markdown 写作、实时预览与图片上传。
- 桌面端和移动端阅读布局。
- 本地 CMS 一键启动，文章保存在 Git 中。
- 发布时提交 GitHub，并由 Vercel 自动部署。
- 管理 API 只面向受信任的本机 CMS，线上部署默认不可访问。

## 本地使用

```bash
npm install
./start-blog-cms.sh
```

打开 `http://localhost:3000/admin` 写作；运行 `./stop-blog-cms.sh` 停止。普通验证不要调用 `/api/deploy`，因为它会真实提交并推送仓库。

## 开发与验证

```bash
npm run check
npm run build
```

环境变量、OSS 凭据、Cookie、CMS 日志和 PID 文件不得提交。文章和上传内容属于网站内容，不应在模板分支中误删或替换。

## License

应用源码使用 [MIT License](LICENSE)。文章、图片、头像和作品集内容不包含在 MIT 授权中，详见 [CONTENT_LICENSE](CONTENT_LICENSE.md)。
