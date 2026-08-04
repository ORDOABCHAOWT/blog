# 🔐 Security Guide

This document outlines the security features and configuration guidelines for this blog CMS.

> **Current implementation note (2026-08-04):** The CMS remains passwordless on the trusted local server, while `/admin` and all CMS APIs return 404 on every Vercel deployment. See `docs/agentic/SECURITY.md` for the operational security contract.

## Overview

This project implements multiple security layers to protect against common web vulnerabilities:

- ✅ Local-only CMS boundary on Vercel deployments
- ✅ Path traversal attack prevention
- ✅ File upload security with type validation
- ✅ Command injection protection
- ✅ Input validation and sanitization

---

## 🛡️ Security Features

### 1. Deployment Boundary Protection

The CMS has two deliberate operating modes:

- On the trusted local server, `/admin` and CMS APIs remain available without a password.
- On every Vercel deployment, `/admin`, `/api/posts`, `/api/upload`, and `/api/deploy` return 404 before reading input or performing work.

Remote CMS access is not supported. Adding it requires a dedicated authenticated design rather than exposing the local routes.

### 2. Path Traversal Protection

All slug parameters are validated against a whitelist pattern:
- **Allowed:** Letters (a-z, A-Z), numbers (0-9), hyphens (-), underscores (_)
- **Blocked:** `../`, special characters, path separators

**Examples:**
```
✅ Valid:   my-first-post, tech_article_2024, travel-blog-1
❌ Invalid: ../etc/passwd, my post, 文章标题, post@123
```

### 3. File Upload Security

**Restrictions:**
- Only image files allowed: JPEG, PNG, GIF, WebP
- SVG files are blocked (XSS prevention)
- Maximum file size: 10MB
- Dual validation: MIME type + file extension

**Why no SVG?**
SVG files can contain embedded JavaScript, which poses XSS risks. For security, SVG support is disabled.

### 4. Command Injection Prevention

All Git commands use parameterized execution via `execFile` instead of string interpolation, preventing command injection attacks.

### 5. Environment Variables

**Required variables in `.env.local`:**

```env
# Alibaba Cloud OSS (for image storage)
OSS_ACCESS_KEY_ID=your-key-id
OSS_ACCESS_KEY_SECRET=your-key-secret
OSS_BUCKET=your-bucket-name
OSS_REGION=oss-region
OSS_ENDPOINT=https://oss-region.aliyuncs.com
OSS_DOMAIN=https://your-bucket.oss-region.aliyuncs.com
```

**Important:**
- Never commit `.env.local` to version control
- `.env.local` is already in `.gitignore`
- Rotate credentials regularly (recommended: every 3 months)

---

## 🚀 Deployment Security

### Vercel Deployment

When deploying the public blog to Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to Settings → Environment Variables
4. Do not add local CMS or OSS write credentials unless a future authenticated remote workflow explicitly requires them
5. Redeploy the project

### Security Checklist

Before deploying:

- [ ] `/admin` and CMS APIs return 404 on Vercel
- [ ] `.env.local` not committed to Git
- [ ] OSS write credentials are absent from Vercel unless explicitly required
- [ ] Verified file upload restrictions

---

## 🔒 Best Practices

### 1. Credential Management

- Use a dedicated, least-privilege RAM identity for OSS uploads.
- Keep OSS write credentials only in the local `.env.local` file.
- Rotate OSS credentials if exposure is suspected.
- Store recovery credentials in a password manager.

### 2. Access Control

- Keep the local CMS bound to `127.0.0.1`.
- Keep all CMS routes unavailable on Vercel.
- Monitor Vercel, GitHub, and OSS access logs regularly.

### 3. Content Security

- Review uploaded images periodically
- Check Git history for unauthorized changes
- Enable two-factor authentication on GitHub

### 4. Backup Strategy

The blog content is stored in the `/posts` directory as Markdown files:

- **Automatic backup:** Git version control
- **Manual backup:** Periodically copy `/posts` to cloud storage
- **Recovery:** Restore from Git history or backup files

---

## 🚨 Security Incident Response

### If You Suspect Unauthorized Access

1. **Immediately rotate credentials:**
   - Rotate OSS AccessKey in Alibaba Cloud console
   - Remove unexpected OSS write credentials from Vercel

2. **Check for unauthorized changes:**
   ```bash
   git log --all --oneline -20  # Review recent commits
   git diff HEAD~10             # Check recent changes
   ```

3. **Review uploaded files:**
   - Check Alibaba Cloud OSS console for suspicious uploads
   - Remove any unauthorized images

4. **Redeploy:**
   ```bash
   git push origin main  # Trigger Vercel redeployment
   ```

### Reporting Security Issues

If you discover a security vulnerability:
- Do NOT publicly disclose the vulnerability
- Contact the project maintainer privately
- Provide detailed reproduction steps

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)

---

## 🔄 Changelog

### 2026-08-04 - Low-risk Security Hardening
- Kept the passwordless CMS local-only and blocked it on Vercel
- Added request bounds, upstream timeouts, and baseline security headers
- Restricted image optimization to the owned OSS bucket
- Refreshed vulnerable dependencies

### 2025-12-08 - Security Hardening
- Added the original authentication guidance, later replaced by the local-only boundary
- Implemented path traversal protection
- Enhanced file upload validation
- Upgraded Next.js to 16.0.7
- Improved command injection prevention

---

**Last Updated:** 2026-08-04
**Security Audit:** In active maintenance
**Status:** Public frontend hardened; CMS local-only
