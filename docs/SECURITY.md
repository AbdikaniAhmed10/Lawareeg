# Lawareeg security notes

Built with OWASP-oriented practices for a marketplace that handles accounts and escrow.

## Authentication & sessions

- Passwords hashed with Laravel (`bcrypt` / configured hasher).
- API auth via **Laravel Sanctum** personal access tokens (Bearer) — no secrets in the React app.
- **Email verification required** before dashboard / protected API (`verified` middleware).
- Login / register / password reset throttled.
- Suspended users blocked (`not-suspended`).
- Admin routes require `role === admin`.

## Authorization

- Server-side role checks for admin.
- Conversation parties authorized; support threads admin-accessible.
- Owners cannot purchase their own listings; admins cannot buy as admins.

## Input & uploads

- Form requests validate all mutating endpoints.
- Uploads: mime whitelist + size caps (receipts, IDs, screenshots, message attachments).
- **Sensitive files** (payment proofs, seller ID docs, chat attachments) are stored on the **private** disk and served only via **temporary signed URLs** — not public `/storage/` links.
- Public `/storage/` is limited to marketplace media (avatars, listing screenshots). Nginx denies legacy sensitive prefixes.
- Eloquent / query builder (parameterized) — not raw concatenated SQL.
- Rate limits on auth, withdrawals, order actions, uploads, and messaging.

## XSS / CSRF

- React escapes text by default; avoid `dangerouslySetInnerHTML`.
- Bearer-token API (not cookie SPA session) — CSRF not applicable to token API calls.
- Do not enable Sanctum `statefulApi()` unless switching to cookie auth with CSRF.

## Escrow / fraud controls

- Buyers pay Lawareeg escrow; admin confirms receipts before seller transfer.
- Ownership verification codes reviewed by admin.
- Messaging filter blocks phone/email/WhatsApp in listing chats (support allows order numbers).

## Secrets

- Never put API keys in Vite/`VITE_*` except public API base URL.
- `.env` / `.env.docker` gitignored; use environment variables on the server.
- Database not published publicly in Docker Compose (internal network only).

## Incident response

- Rotate `APP_KEY` and Sanctum tokens if compromised.
- Restore from MySQL + storage backups.
- Review `storage/logs` / container logs.
