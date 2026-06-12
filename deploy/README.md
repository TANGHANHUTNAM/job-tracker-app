# Deployment Guide

## Overview

```
GitHub Push → GitHub Actions → SSH to Server → Docker Build & Deploy
                                                          ↓
                                          Nginx ← Cloudflare DNS
                                           ↓
                                   job-app-tracker.nit.software → Docker Container (:3000)
```

## Folder Structure

```
deploy/
├── docker/
│   ├── Dockerfile                  # Multi-stage Next.js build
│   ├── docker-compose.prod.yml     # Production compose
│   └── .dockerignore
├── nginx/
│   └── job-app-tracker.nit.software.conf   # Nginx reverse proxy
├── scripts/
│   ├── deploy.sh                   # Server deploy script (backup/manual)
│   └── health-check.sh             # Quick health check
├── .env.production.example         # Env template
└── README.md                       # This file
```

---

## First-Time Server Setup

### 1. Install Docker & Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
docker --version
```

### 2. Clone & Setup Project on Server

```bash
# Clone the repo
cd /opt
sudo git clone git@github.com:YOUR_USER/job-tracker.git job-app-tracker
cd job-app-tracker

# Create production env file
cp deploy/.env.production.example .env.production
nano .env.production   # Fill in real values
```

### 3. Initial Build & Run

```bash
cd /opt/job-app-tracker
docker compose -f deploy/docker/docker-compose.prod.yml up -d --build
docker logs job-app-tracker -f   # Watch logs
curl http://127.0.0.1:3000/api/health   # Verify
```

### 4. Setup Nginx

```bash
# Install nginx
sudo apt install nginx -y

# Copy config
sudo cp deploy/nginx/job-app-tracker.nit.software.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/job-app-tracker.nit.software.conf /etc/nginx/sites-enabled/

# Get SSL cert (Cloudflare Origin Certificate)
# → Go to Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
# → Save cert to /etc/nginx/ssl/nit.software-origin.pem
# → Save key to /etc/nginx/ssl/nit.software-origin-key.pem

# Test & reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Cloudflare DNS

```
Type: A
Name: job-app-tracker
Content: YOUR_SERVER_IP
Proxy: Proxied (orange cloud)
```

SSL/TLS mode: **Full (Strict)**

### 6. GitHub Secrets

Go to repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret              | Value                          |
|---------------------|--------------------------------|
| `SERVER_HOST`       | `YOUR_SERVER_IP`              |
| `SERVER_USER`       | `root` (or deploy user)       |
| `SSH_PRIVATE_KEY`   | Private SSH key content       |

### 7. SSH Key Setup (if not exists)

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f deploy_key
ssh-copy-id -i deploy_key root@YOUR_SERVER_IP

# Copy deploy_key content to GitHub secret SSH_PRIVATE_KEY
cat deploy_key
```

---

## How Deploys Work

1. **Push to `main`** → GitHub Actions triggers
2. Actions runs **lint + type check + build**
3. On success, Actions **SSHs into server**
4. Server pulls latest code from `main`
5. Server runs `docker compose build --no-cache` + `up -d`
6. Health check verifies the app is responding
7. Done!

---

## Manual Deploy (Backup)

If GitHub Actions is down, deploy manually:

```bash
# On the server
cd /opt/job-app-tracker
bash deploy/scripts/deploy.sh $(git rev-parse HEAD)
```

---

## Common Commands

```bash
# View logs
docker logs job-app-tracker -f

# Restart container
docker compose -f deploy/docker/docker-compose.prod.yml restart app

# Rebuild from scratch
docker compose -f deploy/docker/docker-compose.prod.yml up -d --build --force-recreate

# Stop everything
docker compose -f deploy/docker/docker-compose.prod.yml down

# Check health
bash deploy/scripts/health-check.sh

# Enter container
docker exec -it job-app-tracker sh
```

---

## Rollback

```bash
# See available images
docker images | grep job-app-tracker

# Rollback to previous version
docker compose -f deploy/docker/docker-compose.prod.yml up -d --no-deps app
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Container won't start | `docker logs job-app-tracker` — check env vars |
| Health check fails | Ensure `.env.production` exists and has correct values |
| 502 Bad Gateway | Container not running or wrong port mapping |
| SSL errors | Verify Cloudflare origin cert in `/etc/nginx/ssl/` |
| Build fails | Check GitHub Actions logs, ensure secrets are set |
