# Lawareeg on Contabo VPS (alongside another app)

This stack is designed to **coexist** with systems already running on your VPS.
Docker binds Lawareeg only to `127.0.0.1:8088` (configurable). Your host Nginx/Caddy
terminates HTTPS and proxies a **subdomain** to that port.

## Recommended topology

| Host | Role |
|------|------|
| `existing.yourdomain.com` | Your current app (unchanged) |
| `lawareeg.yourdomain.com` | This marketplace → `http://127.0.0.1:8088` |

Do **not** put Lawareeg on a path under another app (`/lawareeg`) — SPA + `/api` routing conflicts.

## 1. DNS

Create an A record:

```
lawareeg.yourdomain.com  →  YOUR_CONTABO_IP
```

## 2. Server hardening (do this once on the VPS)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw fail2ban docker.io docker-compose-v2 git

# Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# SSH: prefer keys, disable password/root (edit /etc/ssh/sshd_config)
# PermitRootLogin no
# PasswordAuthentication no
sudo systemctl restart ssh

# Fail2Ban is installed above — enable default sshd jail
sudo systemctl enable --now fail2ban
```

Install Docker Compose plugin if needed (`docker compose version`).

## 3. Clone & configure

```bash
cd /var/www
sudo git clone https://github.com/AbdikaniAhmed10/Lawareeg.git lawareeg
cd lawareeg
cp .env.docker.example .env.docker
nano .env.docker
```

Set at least:

- Strong `DB_PASSWORD` / `MYSQL_ROOT_PASSWORD`
- `APP_KEY` — generate with `openssl rand -base64 32` then prefix `base64:`
- `APP_URL` / `FRONTEND_URL` / `VITE_API_URL` to `https://lawareeg.yourdomain.com` (API URL ends with `/api`)
- Real SMTP (`MAIL_*`) so email verification works

```bash
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker exec backend php artisan db:seed --force   # optional demo
```

## 4. Host Nginx (TLS) in front of Docker

Example `/etc/nginx/sites-available/lawareeg`:

```nginx
server {
    listen 80;
    server_name lawareeg.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lawareeg.yourdomain.com;

    # certbot will fill these:
    # ssl_certificate     /etc/letsencrypt/live/lawareeg.yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/lawareeg.yourdomain.com/privkey.pem;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/lawareeg /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d lawareeg.yourdomain.com
```

## 5. Email verification

Users cannot open the dashboard until they verify email.
Configure SMTP in `.env.docker` (Mailgun, Postmark, SES, etc.).
Local/dev can use `MAIL_MAILER=log` and read `storage/logs`. Production needs real SMTP (e.g. Gmail App Password) so the 6-digit verification code email is delivered.

## 6. Backups

```bash
# MySQL dump
docker compose --env-file .env.docker exec -T mysql \
  mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" lawareeg > backup-$(date +%F).sql

# Uploads volume
docker run --rm -v lawareeg_lawareeg_storage:/data -v $(pwd):/backup alpine \
  tar czf /backup/storage-$(date +%F).tgz -C /data .
```

Schedule with cron. Keep backups off-server.

## 7. Updates

```bash
cd /var/www/lawareeg
git pull
docker compose --env-file .env.docker up -d --build
```

## Security checklist (Lawareeg)

- [x] HTTPS via host reverse proxy
- [x] Passwords hashed (Laravel)
- [x] Sanctum Bearer tokens
- [x] Email verification before dashboard
- [x] Role middleware (`admin`, `verified`, `not-suspended`)
- [x] Request validation + upload mime limits
- [x] Manual escrow (no direct buyer→seller payout)
- [x] Contact sharing blocked in listing chats
- [ ] Strong unique DB passwords in `.env.docker`
- [ ] Fail2Ban + UFW on host
- [ ] Regular backups
- [ ] Never commit `.env` / `.env.docker`
