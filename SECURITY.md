# 🔐 Security Guide

This document outlines the security features and configuration guidelines for this blog CMS.

## Overview

This project implements multiple security layers to protect against common web vulnerabilities:

- ✅ HTTP Basic Authentication for admin endpoints
- ✅ Path traversal attack prevention
- ✅ File upload security with type validation
- ✅ Command injection protection
- ✅ Input validation and sanitization

---

## 🛡️ Security Features

### 1. Authentication Protection

All administrative endpoints (`/admin` and `/api/*`) are protected by HTTP Basic Authentication.

**Setup:**

1. Copy the environment variable template:
   ```bash
   cp .env.example .env.local
   ```

2. Configure credentials in `.env.local`:
   ```env
   ADMIN_USER=your-username
   ADMIN_PASSWORD=your-secure-password
   ```

3. **Password Requirements:**
   - Minimum 16 characters
   - Mix of letters and numbers
   - Avoid special characters like `$`, `#`, `@` in development (they may cause issues with Next.js middleware)
   - Use alphanumeric passwords: e.g., `MyBlog2024SecurePass99`

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
# Admin Authentication
ADMIN_USER=admin
ADMIN_PASSWORD=YourSecurePassword123

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

When deploying to Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add all required variables from `.env.local`
5. Redeploy the project

**Note:** In production (Vercel), you can use complex passwords with special characters safely.

### Security Checklist

Before deploying:

- [ ] Environment variables configured
- [ ] Strong password set (16+ characters)
- [ ] `.env.local` not committed to Git
- [ ] OSS credentials are valid
- [ ] Tested authentication on staging
- [ ] Verified file upload restrictions

---

## 🔒 Best Practices

### 1. Credential Management

- **Development:** Use simple alphanumeric passwords
- **Production:** Use complex passwords with special characters
- **Rotation:** Change passwords every 3 months
- **Storage:** Use password managers for credential storage

### 2. Access Control

- Only share admin credentials with trusted users
- Use separate credentials for different environments
- Monitor access logs regularly

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
   - Change `ADMIN_PASSWORD` in `.env.local`
   - Rotate OSS AccessKey in Alibaba Cloud console
   - Update Vercel environment variables

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
- [HTTP Basic Authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)

---

## 🔄 Changelog

### 2025-12-08 - Security Hardening
- Added HTTP Basic Authentication
- Implemented path traversal protection
- Enhanced file upload validation
- Upgraded Next.js to 16.0.7
- Improved command injection prevention

---

**Last Updated:** 2025-12-08
**Security Audit:** Completed
**Status:** Production Ready
