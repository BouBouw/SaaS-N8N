# SaaS N8N Platform

Plateforme SaaS permettant à chaque utilisateur de disposer de sa propre instance N8N automatiquement provisionnée.

## 🎯 Fonctionnalités

- ✅ Authentification complète (inscription, connexion)
- ✅ Provisioning automatique d'instances N8N via Docker
- ✅ Sous-domaine unique par utilisateur (ex: xxxxxxxx.boubouw.com)
- ✅ Isolation complète des environnements
- ✅ Architecture multi-tenant scalable

## 🛠️ Stack Technique

### Front-end
- React 18 + TypeScript
- Vite
- TailwindCSS v4
- React Router

### Back-end
- Node.js + Express
- JWT Authentication
- MySQL (mysql2)
- Docker API

### Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy)
- Let's Encrypt (SSL)

## 📁 Structure du Projet

```
SaaS-N8N/
├── backend/           # API Node.js + Express
│   ├── src/
│   │   ├── config/    # Configuration (DB, Docker, etc.)
│   │   ├── controllers/
│   │   ├── services/  # Services métier (auth, docker, instances)
│   │   ├── models/    # Modèles MySQL
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   └── package.json
├── frontend/          # Application React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/  # API calls
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
├── nginx/             # Configuration reverse proxy
├── docker/            # Configurations Docker
└── docker-compose.yml
```

## 🚀 Installation

### Prérequis
- Node.js 18+
- Docker & Docker Compose
- MySQL 8+

### Setup

1. Cloner le projet
```bash
git clone https://github.com/yourusername/SaaS-N8N.git
cd SaaS-N8N
```

2. Configurer les variables d'environnement
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

3. Installer les dépendances
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

4. Initialiser la base de données
```bash
cd backend
npm run db:migrate
```

5. Lancer l'application
```bash
# Avec Docker Compose (recommandé)
docker-compose up -d

# Ou manuellement
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## 🔧 Configuration

### Variables d'environnement Backend

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=saas_n8n

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Docker
DOCKER_SOCKET=/var/run/docker.sock
N8N_BASE_PORT=5678
N8N_NETWORK=n8n_network

# Domain
BASE_DOMAIN=boubouw.com
```

### Variables d'environnement Frontend

```env
VITE_API_URL=http://localhost:3000
VITE_BASE_DOMAIN=boubouw.com
```

## 📊 Schéma Base de Données

### Users
- id (UUID)
- email (unique)
- password (hashed)
- name
- created_at
- updated_at

### Instances
- id (UUID)
- user_id (FK)
- subdomain (unique)
- container_id
- container_name
- port
- status (running, stopped, error)
- created_at
- updated_at

## 🐳 Architecture Docker

Chaque instance N8N est déployée dans un conteneur Docker isolé avec :
- Volume persistant pour les données
- Port interne unique
- Variables d'environnement dédiées
- Réseau Docker isolé

## 🔒 Sécurité

- Authentification JWT
- Mots de passe hashés (bcrypt)
- Isolation des instances par utilisateur
- HTTPS via Let's Encrypt
- Protection CORS
- Rate limiting

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Instances
- `GET /api/instances/my` - Mon instance
- `POST /api/instances/start` - Démarrer l'instance
- `POST /api/instances/stop` - Arrêter l'instance
- `DELETE /api/instances/delete` - Supprimer l'instance

## 🛣️ Roadmap

- [ ] v1.0 - MVP avec provisioning automatique
- [ ] v1.1 - Plans & quotas (Free/Pro)
- [ ] v1.2 - Monitoring & analytics
- [ ] v1.3 - Backup automatique des workflows
- [ ] v2.0 - Multi-région

## 📄 Licence

MIT

## 👤 Auteur

Votre nom
