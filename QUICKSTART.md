# 🚀 Quick Start Guide - SaaS N8N Platform

## Développement Local

### 1. Installation des dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configuration

```bash
# Copier les fichiers d'environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Modifier `backend/.env` :
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=saas_n8n
JWT_SECRET=your_secret_key
DOCKER_SOCKET=/var/run/docker.sock
N8N_BASE_PORT=5678
N8N_NETWORK=n8n_network
BASE_DOMAIN=boubouw.com
```

### 3. Base de données MySQL

```bash
# Créer la base de données
mysql -u root -p

CREATE DATABASE saas_n8n;
USE saas_n8n;
SOURCE docker/mysql/init.sql;
```

Ou avec Docker :
```bash
docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=saas_n8n -p 3306:3306 -d mysql:8.0
```

### 4. Créer le réseau Docker pour N8N

```bash
docker network create n8n_network
```

### 5. Lancer l'application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Accès

- Frontend: http://localhost:5173
- API: http://localhost:3000
- Health Check: http://localhost:3000/api/health

## Avec Docker Compose (Recommandé)

```bash
# Créer le réseau
docker network create n8n_network

# Copier la configuration
cp .env.example .env

# Modifier .env avec vos valeurs

# Lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

## Test de l'application

1. Créer un compte sur http://localhost:5173/register
2. Attendre 30-60 secondes (provisioning de l'instance N8N)
3. Actualiser le dashboard
4. Cliquer sur "Open" pour accéder à votre instance N8N

## Structure API

### Authentification

**POST /api/auth/register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**POST /api/auth/login**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**GET /api/auth/me** (Protected)
Headers: `Authorization: Bearer <token>`

### Instances

**GET /api/instances/my** (Protected)

**POST /api/instances/start** (Protected)

**POST /api/instances/stop** (Protected)

**DELETE /api/instances/delete** (Protected)

## Commandes utiles

```bash
# Voir toutes les instances N8N
docker ps | grep n8n-

# Voir les logs d'une instance
docker logs n8n-xxxxxxxx

# Arrêter tous les services
docker-compose down

# Rebuild
docker-compose build
docker-compose up -d

# Supprimer toutes les instances N8N
docker ps -a | grep n8n- | awk '{print $1}' | xargs docker rm -f

# Nettoyer les volumes
docker volume prune
```

## Variables d'environnement

### Backend (.env)
- `PORT` - Port du serveur (default: 3000)
- `DB_HOST` - Hôte MySQL
- `DB_PORT` - Port MySQL (default: 3306)
- `DB_USER` - Utilisateur MySQL
- `DB_PASSWORD` - Mot de passe MySQL
- `DB_NAME` - Nom de la base de données
- `JWT_SECRET` - Clé secrète JWT
- `JWT_EXPIRES_IN` - Durée de validité du token (default: 7d)
- `DOCKER_SOCKET` - Socket Docker (default: /var/run/docker.sock)
- `N8N_BASE_PORT` - Port de base pour N8N (default: 5678)
- `N8N_NETWORK` - Réseau Docker pour N8N
- `BASE_DOMAIN` - Domaine de base (ex: boubouw.com)

### Frontend (.env)
- `VITE_API_URL` - URL de l'API backend
- `VITE_BASE_DOMAIN` - Domaine de base

## Troubleshooting

### Erreur: Cannot connect to MySQL
```bash
# Vérifier que MySQL est actif
docker ps | grep mysql
# ou
mysql -u root -p -e "SELECT 1"
```

### Erreur: Cannot connect to Docker daemon
```bash
# Vérifier que Docker est actif
docker ps

# Vérifier les permissions
sudo usermod -aG docker $USER
```

### Instance N8N ne démarre pas
```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier que le réseau existe
docker network ls | grep n8n_network

# Recréer le réseau si nécessaire
docker network create n8n_network
```

### Port déjà utilisé
```bash
# Trouver le processus utilisant le port
lsof -i :3000
# ou
netstat -ano | findstr :3000

# Changer le port dans .env
PORT=3001
```

## Prochaines étapes

1. ✅ Application fonctionnelle
2. 🔒 Ajouter SSL/HTTPS en production
3. 📊 Implémenter monitoring et analytics
4. 💳 Ajouter système de plans/quotas
5. 📧 Ajouter notifications par email
6. 🔄 Ajouter système de backup automatique
7. 🌍 Support multi-région

## Support

Pour plus d'informations, consultez :
- [README.md](README.md) - Vue d'ensemble du projet
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guide de déploiement production
