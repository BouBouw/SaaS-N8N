# 🚀 Guide Complet de Déploiement - SaaS N8N sur Debian 12

## 📋 Prérequis

- VPS Debian 12
- Accès root SSH
- Domaine configuré (ex: boubouw.com)
- Ports 22, 80, 443 ouverts

---

## 🎯 Installation Rapide (Méthode Automatique)

### 1. Connexion au VPS

```bash
ssh root@VOTRE_IP_SERVEUR
```

### 2. Cloner le projet

```bash
cd /var/www
git clone https://github.com/VOTRE_USERNAME/SaaS-N8N.git
cd SaaS-N8N
```

### 3. Lancer le script d'installation

```bash
chmod +x install.sh
sudo DOMAIN=boubouw.com bash install.sh
```

Le script installe automatiquement :
- Docker & Docker Compose
- Nginx
- Certbot (SSL)
- Fail2Ban
- Firewall UFW
- Configuration Nginx
- Réseau Docker
- Permissions

---

## 🔧 Installation Manuelle (Étape par Étape)

### Étape 1 : Mise à jour du système

```bash
apt update && apt upgrade -y
apt install -y curl wget git nano ufw fail2ban htop
```

### Étape 2 : Installation de Docker

```bash
# Suppression anciennes versions
apt remove -y docker docker-engine docker.io containerd runc

# Dépendances
apt install -y ca-certificates curl gnupg lsb-release

# Clé GPG Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installation
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Démarrage automatique
systemctl enable docker
systemctl start docker

# Vérification
docker --version
docker compose version
```

### Étape 3 : Configuration Firewall

```bash
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status verbose
```

### Étape 4 : Installation Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
systemctl status nginx
```

### Étape 5 : Installation Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Étape 6 : Configuration DNS (OVH)

Connectez-vous à OVH et ajoutez :

```
Type    Sous-domaine    Cible
A       @               VOTRE_IP_SERVEUR
A       *               VOTRE_IP_SERVEUR
```

Vérifiez la propagation :
```bash
nslookup boubouw.com
nslookup test.boubouw.com
```

### Étape 7 : Clonage et Configuration du Projet

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/VOTRE_USERNAME/SaaS-N8N.git
cd SaaS-N8N
```

### Étape 8 : Création du fichier .env

```bash
nano .env
```

```env
# Base de données
DB_NAME=saas_n8n
DB_PASSWORD=VotreMotDePasseSecurise123!

# Sécurité
JWT_SECRET=VotreCleSecreteTresLongueEtAleatoire789!
ENCRYPTION_KEY=VotreCleSecretePourCryptage32!

# Domaine
BASE_DOMAIN=boubouw.com

# Vite (Frontend)
VITE_API_URL=
VITE_BASE_DOMAIN=boubouw.com
```

### Étape 9 : Configuration Nginx Principale

```bash
nano /etc/nginx/sites-available/n8n-saas-main
```

```nginx
# Configuration principale pour boubouw.com
server {
    listen 80;
    listen [::]:80;
    server_name boubouw.com www.boubouw.com;

    # Logs
    access_log /var/log/nginx/n8n-saas-access.log;
    error_log /var/log/nginx/n8n-saas-error.log;

    # Frontend React
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Sécurité
    server_tokens off;
    
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### Étape 10 : Activer le site Nginx

```bash
# Activer le site
ln -s /etc/nginx/sites-available/n8n-saas-main /etc/nginx/sites-enabled/

# Supprimer la config par défaut
rm /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

# Recharger Nginx
systemctl reload nginx
```

### Étape 11 : Permissions pour Nginx

```bash
nano /etc/sudoers.d/n8n-nginx
```

```
# Permettre au backend Node.js de gérer Nginx
www-data ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/bin/systemctl reload nginx
node ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/bin/systemctl reload nginx
```

```bash
chmod 0440 /etc/sudoers.d/n8n-nginx
```

### Étape 12 : Créer le réseau Docker

```bash
docker network create n8n_network
```

### Étape 13 : Build et Démarrage des Conteneurs

```bash
cd /var/www/SaaS-N8N

# Build des images
docker compose build

# Démarrage des conteneurs
docker compose up -d

# Vérifier les logs
docker compose logs -f
```

### Étape 14 : Configuration SSL (Let's Encrypt)

#### Méthode A : SSL Simple (domaine principal)

```bash
certbot --nginx -d boubouw.com -d www.boubouw.com
```

#### Méthode B : SSL Wildcard (domaine + sous-domaines)

```bash
# Obtenir le certificat wildcard
certbot certonly --manual --preferred-challenges dns \
  -d boubouw.com -d *.boubouw.com

# Suivre les instructions pour ajouter le TXT record dans OVH
# Type: TXT
# Sous-domaine: _acme-challenge
# Valeur: [fournie par Certbot]

# Attendre la propagation DNS (1-5 minutes)
# Puis appuyez sur Entrée dans Certbot

# Configurer Nginx pour utiliser les certificats
nano /etc/nginx/sites-available/n8n-saas-main
```

Modifiez la configuration pour ajouter HTTPS :

```nginx
# Redirection HTTP -> HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name boubouw.com www.boubouw.com;
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name boubouw.com www.boubouw.com;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/boubouw.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/boubouw.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/boubouw.com/chain.pem;

    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # Logs
    access_log /var/log/nginx/n8n-saas-access.log;
    error_log /var/log/nginx/n8n-saas-error.log;

    # Frontend React
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Sécurité
    server_tokens off;
    
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

```bash
# Tester et recharger
nginx -t
systemctl reload nginx
```

### Étape 15 : Renouvellement Automatique SSL

```bash
# Test du renouvellement
certbot renew --dry-run

# Le renouvellement auto est configuré via systemd timer
systemctl list-timers | grep certbot
```

---

## ✅ Vérifications Finales

### 1. Vérifier les conteneurs

```bash
docker compose ps
```

Résultat attendu :
```
NAME                 STATUS    PORTS
saas-n8n-backend     Up        127.0.0.1:3000->3000/tcp
saas-n8n-frontend    Up        127.0.0.1:5173->80/tcp
saas-n8n-mysql       Up        0.0.0.0:3307->3306/tcp
```

### 2. Vérifier Nginx

```bash
systemctl status nginx
nginx -t
```

### 3. Vérifier les logs

```bash
# Logs backend
docker compose logs -f backend

# Logs frontend  
docker compose logs -f frontend

# Logs Nginx
tail -f /var/log/nginx/n8n-saas-access.log
tail -f /var/log/nginx/n8n-saas-error.log
```

### 4. Tester l'accès

```bash
# Frontend
curl -I https://boubouw.com

# API
curl https://boubouw.com/api/health
```

---

## 🔄 Commandes de Maintenance

### Redémarrer les services

```bash
# Redémarrer tous les conteneurs
docker compose restart

# Redémarrer un service spécifique
docker compose restart backend
docker compose restart frontend

# Redémarrer Nginx
systemctl restart nginx
```

### Mise à jour du code

```bash
cd /var/www/SaaS-N8N
git pull
docker compose build
docker compose down
docker compose up -d
```

### Backup de la base de données

```bash
# Backup
docker compose exec mysql mysqldump -u root -p saas_n8n > backup_$(date +%Y%m%d).sql

# Restaurer
docker compose exec -T mysql mysql -u root -p saas_n8n < backup_20260109.sql
```

### Logs et Monitoring

```bash
# Voir l'utilisation des ressources
docker stats

# Espace disque
df -h

# Logs système
journalctl -u docker.service -f

# Logs Nginx en temps réel
tail -f /var/log/nginx/n8n-saas-access.log
```

---

## 🐛 Dépannage

### Problème : Site inaccessible

```bash
# Vérifier Nginx
systemctl status nginx
nginx -t

# Vérifier les conteneurs
docker compose ps

# Vérifier les ports
netstat -tlnp | grep -E '80|443|3000|5173'
```

### Problème : Erreur 502 Bad Gateway

```bash
# Vérifier que les conteneurs fonctionnent
docker compose logs backend
docker compose logs frontend

# Vérifier les ports internes
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:5173
```

### Problème : Certificat SSL invalide

```bash
# Vérifier les certificats
certbot certificates

# Renouveler manuellement
certbot renew --force-renewal

# Vérifier la config Nginx
nginx -t
systemctl reload nginx
```

---

## 📊 Architecture Finale

```
Internet (Port 443)
         ↓
    Nginx (Reverse Proxy + SSL)
         ↓
    ├─→ Frontend (127.0.0.1:5173) - React App
    ├─→ Backend (127.0.0.1:3000) - API Node.js  
    │        ↓
    │   MySQL (127.0.0.1:3307) - Base de données
    │        ↓
    └─→ N8N Instances (127.0.0.1:5678+) - Conteneurs dynamiques
             ↓
        Nginx Auto-Config (sous-domaines)
```

---

## 🎉 C'est terminé !

Votre plateforme SaaS N8N est maintenant en production !

Accès :
- **Application** : https://boubouw.com
- **API** : https://boubouw.com/api
- **Instances N8N** : https://xxxxxxxx.boubouw.com (créées automatiquement)

---

## 📞 Support

En cas de problème :
1. Vérifier les logs : `docker compose logs -f`
2. Vérifier Nginx : `systemctl status nginx`
3. Vérifier les certificats : `certbot certificates`
4. Vérifier le firewall : `ufw status`
