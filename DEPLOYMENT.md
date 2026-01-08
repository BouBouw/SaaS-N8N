# 🚀 Guide de Déploiement - SaaS N8N Platform

## 📋 Prérequis

- Serveur Linux (Ubuntu 20.04+ recommandé)
- Docker & Docker Compose installés
- Node.js 18+ (pour développement local)
- MySQL 8+
- Nom de domaine configuré (ex: boubouw.com)

## 🔧 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/yourusername/SaaS-N8N.git
cd SaaS-N8N
```

### 2. Configuration des variables d'environnement

```bash
# Copier les fichiers d'exemple
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Modifier `.env` :
```env
DB_PASSWORD=votre_mot_de_passe_securise
JWT_SECRET=votre_jwt_secret_securise
BASE_DOMAIN=boubouw.com
VITE_API_URL=http://localhost:3000
```

### 3. Configuration DNS

Configurer les enregistrements DNS chez votre fournisseur (OVH) :

```
A     boubouw.com          → IP_DE_VOTRE_SERVEUR
A     www.boubouw.com      → IP_DE_VOTRE_SERVEUR
A     *.boubouw.com        → IP_DE_VOTRE_SERVEUR (wildcard pour les sous-domaines)
```

### 4. Lancer l'application avec Docker

```bash
# Créer le réseau Docker pour les instances N8N
docker network create n8n_network

# Lancer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

### 5. Initialiser la base de données

```bash
# Attendre que MySQL soit prêt (30 secondes environ)
sleep 30

# La base de données est automatiquement initialisée via init.sql
# Vérifier que les tables sont créées
docker-compose exec mysql mysql -u root -p saas_n8n -e "SHOW TABLES;"
```

## 🔒 Configuration SSL (Production)

### Avec Let's Encrypt (Certbot)

```bash
# Installer certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtenir les certificats
sudo certbot certonly --standalone -d boubouw.com -d www.boubouw.com -d *.boubouw.com

# Copier les certificats
sudo cp /etc/letsencrypt/live/boubouw.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/boubouw.com/privkey.pem nginx/ssl/

# Activer la configuration SSL
cp nginx/conf.d/ssl.conf.example nginx/conf.d/ssl.conf
# Décommenter le contenu de ssl.conf

# Redémarrer Nginx
docker-compose restart nginx
```

## 🧪 Test de l'installation

### 1. Vérifier que tous les services sont actifs

```bash
docker-compose ps
```

Tous les services doivent être "Up".

### 2. Tester l'API

```bash
curl http://localhost:3000/api/health
# Devrait retourner: {"status":"ok","timestamp":"..."}
```

### 3. Accéder à l'application

Ouvrir dans un navigateur :
- Frontend: http://localhost:5173 (dev) ou http://boubouw.com (prod)
- API: http://localhost:3000

### 4. Créer un compte de test

1. Aller sur http://localhost:5173/register
2. Créer un compte
3. Attendre 30-60 secondes pour le provisioning
4. Accéder au dashboard pour voir l'instance N8N

## 📊 Monitoring

### Vérifier les logs

```bash
# Tous les services
docker-compose logs -f

# Backend uniquement
docker-compose logs -f backend

# Instances N8N
docker ps | grep n8n-
docker logs n8n-xxxxxxxx
```

### Vérifier l'état des conteneurs N8N

```bash
docker ps -a | grep n8n-
```

## 🛠️ Dépannage

### Problème: L'instance N8N ne se crée pas

```bash
# Vérifier les logs du backend
docker-compose logs backend

# Vérifier que Docker est accessible
docker-compose exec backend docker ps

# Vérifier le réseau
docker network ls | grep n8n
```

### Problème: Impossible d'accéder aux sous-domaines

```bash
# Vérifier la configuration Nginx
docker-compose exec nginx nginx -t

# Vérifier les logs Nginx
docker-compose logs nginx

# Tester la résolution DNS
nslookup xxxxxxxx.boubouw.com
```

### Problème: Erreur de connexion à MySQL

```bash
# Vérifier que MySQL est démarré
docker-compose ps mysql

# Se connecter à MySQL
docker-compose exec mysql mysql -u root -p

# Recréer la base de données
docker-compose exec mysql mysql -u root -p -e "DROP DATABASE IF EXISTS saas_n8n; CREATE DATABASE saas_n8n;"
```

## 🔄 Mise à jour

```bash
# Arrêter les services
docker-compose down

# Récupérer les dernières modifications
git pull

# Reconstruire les images
docker-compose build

# Redémarrer
docker-compose up -d
```

## 🗑️ Nettoyage

```bash
# Arrêter et supprimer tous les conteneurs
docker-compose down -v

# Supprimer toutes les instances N8N
docker ps -a | grep n8n- | awk '{print $1}' | xargs docker rm -f

# Supprimer tous les volumes N8N
docker volume ls | grep n8n-data | awk '{print $2}' | xargs docker volume rm

# Nettoyer le réseau
docker network rm n8n_network
```

## 📈 Optimisations Production

### 1. Augmenter les limites de ressources

Modifier `docker-compose.yml` :

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### 2. Activer le rate limiting

Déjà configuré dans le backend (100 req/15min par IP).

### 3. Sauvegardes automatiques

```bash
# Créer un script de sauvegarde
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mysql mysqldump -u root -p$DB_PASSWORD saas_n8n > backup_$DATE.sql
docker run --rm -v n8n_volumes:/data -v $(pwd):/backup alpine tar czf /backup/n8n_volumes_$DATE.tar.gz /data
EOF

chmod +x backup.sh

# Ajouter à cron (tous les jours à 2h)
crontab -e
# Ajouter: 0 2 * * * /path/to/backup.sh
```

## 🎯 Checklist de mise en production

- [ ] Variables d'environnement configurées
- [ ] DNS configuré avec wildcard
- [ ] SSL/HTTPS activé
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring mis en place
- [ ] Logs rotatifs configurés
- [ ] Firewall configuré (ports 80, 443)
- [ ] Mots de passe sécurisés changés
- [ ] Rate limiting activé
- [ ] Tests de charge effectués

## 📞 Support

Pour tout problème, vérifiez :
1. Les logs: `docker-compose logs`
2. L'état des conteneurs: `docker-compose ps`
3. La connectivité réseau: `docker network inspect n8n_network`
