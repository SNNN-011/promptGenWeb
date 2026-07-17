# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:
- **Do NOT** open a public GitHub issue for security bugs
- Email the maintainer directly or use GitHub's private vulnerability reporting

## Environment Variables

- **NEVER** commit `.env` files to version control
- `.gitignore` is configured to exclude all `.env*` files (except `.env.example`)
- Use environment variable injection at deployment time (e.g., Cloud Run environment variables, Secret Manager)
- Rotate API keys immediately if accidentally exposed

## Input Validation

All user-supplied inputs are validated and sanitized:
- **URL inputs**: Validated against SSRF (private IP blocking, redirect blocking, timeout)
- **AI prompt inputs**: Allowlist validation on enumerated fields, injection pattern stripping on free text
- **Error responses**: Generic messages only; internal details logged server-side
