#!/bin/bash

# Script d'installation automatique pour SaaS N8N sur Debian 12
# Usage: sudo bash install.sh

set -e

echo "🚀 Installation de SaaS N8N sur Debian 12"
echo "=========================================="

# Vérifier que le script est exécuté en root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Ce script doit être exécuté en tant que root (sudo)"
  exit 1
fi

# Variables
DOMAIN=${DOMAIN:-"boubouw.com"}
DB_PASSWORD=${DB_PASSWORD:-"$(openssl rand -base64 32)"}
JWT_SECRET=${JWT_SECRET:-"$(openssl rand -base64 48)"}
ENCRYPTION_KEY=${ENCRYPTION_KEY:-"$(openssl rand -base64 32 | cut -c1-32)"}

echo "📋 Configuration:"
echo "   Domaine: $DOMAIN"
echo "   DB Password: $DB_PASSWORD"
echo "   JWT Secret: [généré]"
echo ""

# 1. Mise à jour du système
echo "📦 Mise à jour du système..."
apt update && apt upgrade -y

# 2. Installation des outils de base
echo "🔧 Installation des outils de base..."
apt install -y curl wget git nano ufw fail2ban htop

# 3. Installation de Docker
echo "🐳 Installation de Docker..."
if ! command -v docker &> /dev/null; then
    # Suppression des anciennes versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

    # Installation des dépendances
    apt install -y ca-certificates curl gnupg lsb-release

    # Ajout de la clé GPG Docker
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Ajout du repository Docker
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Installation de Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Démarrage automatique
    systemctl enable docker
    systemctl start docker

    echo "✅ Docker installé"
else
    echo "✅ Docker déjà installé"
fi

# 4. Configuration du Firewall
echo "🔥 Configuration du firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "✅ Firewall configuré"

# 5. Installation de Nginx
echo "🌐 Installation de Nginx..."

# Vérifier si le port 80 est occupé
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Le port 80 est déjà utilisé"
    
    # Identifier le processus
    PORT_80_PROCESS=$(lsof -Pi :80 -sTCP:LISTEN | grep LISTEN | awk '{print $1}' | head -1)
    echo "   Processus détecté: $PORT_80_PROCESS"
    
    # Arrêter Apache2 s'il est détecté
    if systemctl is-active --quiet apache2; then
        echo "   Arrêt d'Apache2..."
        systemctl stop apache2
        systemctl disable apache2
    fi
    
    # Arrêter tout ancien Nginx
    if systemctl is-active --quiet nginx; then
        echo "   Arrêt de l'ancien Nginx..."
        systemctl stop nginx
    fi
    
    # Tuer les processus restants sur le port 80
    fuser -k 80/tcp 2>/dev/null || true
    sleep 2
fi

if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "✅ Nginx installé"
else
    echo "✅ Nginx déjà installé"
    # S'assurer qu'il démarre
    systemctl enable nginx
    systemctl start nginx 2>/dev/null || echo "   Nginx sera configuré plus tard"
fi

# 6. Installation de Certbot
echo "🔒 Installation de Certbot..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo "✅ Certbot installé"
else
    echo "✅ Certbot déjà installé"
fi

# 7. Configuration de Fail2Ban
echo "🛡️  Configuration de Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban
echo "✅ Fail2Ban configuré"

# 8. Création du réseau Docker
echo "🔗 Création du réseau Docker..."
docker network create n8n_network 2>/dev/null || echo "Réseau n8n_network existe déjà"

# 9. Clonage du projet (si pas déjà fait)
if [ ! -d "/var/www/SaaS-N8N" ]; then
    echo "📥 Clonage du projet..."
    mkdir -p /var/www
    cd /var/www
    # Remplacez par votre URL de repo
    # git clone https://github.com/VOTRE_USERNAME/SaaS-N8N.git
    echo "⚠️  Clonez manuellement votre projet dans /var/www/SaaS-N8N"
else
    echo "✅ Projet déjà présent"
fi

# 10. Configuration des permissions pour Nginx
echo "🔑 Configuration des permissions Nginx..."
cat > /etc/sudoers.d/n8n-nginx << 'EOF'
# Permettre au backend Node.js de gérer Nginx
www-data ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/bin/systemctl reload nginx
node ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/bin/systemctl reload nginx
EOF
chmod 0440 /etc/sudoers.d/n8n-nginx
echo "✅ Permissions configurées"

# 11. Configuration Nginx principale
echo "📝 Configuration Nginx principale..."
cat > /etc/nginx/sites-available/n8n-saas-main << EOF
# Configuration principale pour ${DOMAIN}
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Logs
    access_log /var/log/nginx/n8n-saas-access.log;
    error_log /var/log/nginx/n8n-saas-error.log;

    # Frontend React
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Sécurité
    server_tokens off;
    
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Activer le site
ln -sf /etc/nginx/sites-available/n8n-saas-main /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

# Démarrer Nginx si non actif
if ! systemctl is-active --quiet nginx; then
    echo "   Démarrage de Nginx..."
    systemctl start nginx
fi

# Recharger Nginx
systemctl reload nginx
echo "✅ Configuration Nginx créée"

# 12. Créer le fichier .env
if [ -d "/var/www/SaaS-N8N" ]; then
    echo "📝 Création du fichier .env..."
    cat > /var/www/SaaS-N8N/.env << EOF
# Base de données
DB_NAME=saas_n8n
DB_PASSWORD=${DB_PASSWORD}

# Sécurité
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Domaine
BASE_DOMAIN=${DOMAIN}

# Vite (Frontend)
VITE_API_URL=
VITE_BASE_DOMAIN=${DOMAIN}
EOF
    echo "✅ Fichier .env créé"
fi

# Résumé
echo ""
echo "✅ Installation terminée !"
echo "=========================="
echo ""
echo "📝 Prochaines étapes:"
echo ""
echo "1. Configurez votre DNS chez OVH:"
echo "   - A      ${DOMAIN}        → $(curl -s ifconfig.me)"
echo "   - A      *.${DOMAIN}      → $(curl -s ifconfig.me)"
echo ""
echo "2. Configurez SSL avec Certbot:"
echo "   sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "   Pour wildcard: sudo certbot certonly --manual --preferred-challenges dns -d ${DOMAIN} -d *.${DOMAIN}"
echo ""
echo "3. Démarrez les conteneurs Docker:"
echo "   cd /var/www/SaaS-N8N"
echo "   docker compose build"
echo "   docker compose up -d"
echo ""
echo "4. Vérifiez les logs:"
echo "   docker compose logs -f"
echo ""
echo "📋 Informations importantes:"
echo "   - DB Password: ${DB_PASSWORD}"
echo "   - Fichier .env: /var/www/SaaS-N8N/.env"
echo ""
echo "🎉 Votre serveur est prêt !"
