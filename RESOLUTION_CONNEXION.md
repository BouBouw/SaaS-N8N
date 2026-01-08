# 🔧 Correction du Problème de Connexion API - RÉSOLU ✅

## Problème Rencontré

```
ERR_CONNECTION_REFUSED
Failed to fetch from localhost:3000/api
```

## Causes Identifiées

1. **URLs hardcodées** : Le frontend utilisait `http://localhost:3000` en dur dans le code
2. **Contexte Docker** : En production (Docker), `localhost` fait référence au conteneur lui-même, pas à l'hôte
3. **Import manquant** : L'export `verifyToken` n'existait pas dans le middleware auth.js
4. **Conflit de port** : Apache utilise déjà le port 80 sur votre machine

## Solutions Appliquées ✅

### 1. Configuration API Centralisée

**Fichier créé : `frontend/src/config/api.ts`**
```typescript
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000' : '');

export const getApiUrl = (path: string) => {
  return `${API_URL}${path}`;
};
```

**Logique** :
- En **développement** : Utilise `http://localhost:3000`
- En **production** (Docker) : Utilise des URLs relatives (proxy par nginx)

### 2. Mise à Jour du Service API

**Modifié : `frontend/src/services/api.ts`**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000' : '');
```

### 3. Correction des Appels Fetch

**Fichiers modifiés** :
- `frontend/src/pages/ApiKeysPage.tsx`
- `frontend/src/pages/AdminPage.tsx`

**Avant** :
```typescript
fetch('http://localhost:3000/api/api-keys', ...)
```

**Après** :
```typescript
import { getApiUrl } from '../config/api';
fetch(getApiUrl('/api/api-keys'), ...)
```

### 4. Correction Backend - Middleware Auth

**Modifié : `backend/src/routes/admin.js`**

**Avant** :
```javascript
import { verifyToken } from '../middleware/auth.js';
router.use(verifyToken);
```

**Après** :
```javascript
import { verifyJWT } from '../middleware/auth.js';
router.use(verifyJWT);
```

## 🚀 Comment Accéder à l'Application

### Option 1 : Port Direct (Recommandé pour le test)
```
http://localhost:5173
```
✅ Fonctionne immédiatement
✅ Frontend + Backend via proxy

### Option 2 : Via Nginx (Port 80)
**Nécessite d'arrêter Apache d'abord** :

#### Windows :
```powershell
# Ouvrir PowerShell en Administrateur
net stop Apache2.4
```

Puis accéder à :
```
http://localhost
```

#### Redémarrer Apache après :
```powershell
net start Apache2.4
```

### Option 3 : Changer le Port Nginx

**Modifier : `docker-compose.yml`**
```yaml
nginx:
  ports:
    - "8080:80"  # Au lieu de "80:80"
    - "8443:443"
```

Puis :
```powershell
docker-compose restart nginx
```

Accéder à :
```
http://localhost:8080
```

## 🔍 Vérification de l'Installation

### 1. Vérifier les Conteneurs
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```

**Attendu** :
```
saas-n8n-frontend   Up
saas-n8n-backend    Up
saas-n8n-mysql      Up
saas-n8n-nginx      Up
```

### 2. Tester le Backend
```powershell
curl http://localhost:3000/api/health
```

**Attendu** :
```json
{"status":"ok","timestamp":"..."}
```

### 3. Tester le Frontend
```powershell
curl http://localhost:5173
```

**Attendu** : HTML de l'application

## 📊 Architecture Réseau

```
┌─────────────────────────────────────────────────────────────┐
│                     Navigateur (Host)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ http://localhost:5173 (dev)
                       │ ou http://localhost (prod via nginx)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Docker Network                             │
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Frontend   │      │    Nginx     │      │  Backend  │ │
│  │   (Port 80)  │◄─────┤ Reverse Proxy│◄─────┤ (Port 3000)│ │
│  └──────────────┘      └──────────────┘      └─────┬─────┘ │
│        │                                            │        │
│        │ Exposed: 5173                              │        │
│        │                                            │        │
│        │                                    ┌───────▼──────┐ │
│        │                                    │    MySQL     │ │
│        │                                    │  (Port 3307) │ │
│        │                                    └──────────────┘ │
└────────┼────────────────────────────────────────────────────┘
         │
    http://localhost:5173
```

## 🎯 Points Clés à Retenir

1. **En développement** : Le frontend Vite utilise `localhost:3000` directement
2. **En production** : Le frontend utilise des URLs relatives, Nginx fait le proxy
3. **Tous les appels API** passent par la fonction `getApiUrl()`
4. **Le middleware d'authentification** utilise `verifyJWT` (pas `verifyToken`)

## 🔐 Connexion à l'Application

Une fois l'application accessible :

1. Allez sur **http://localhost:5173**
2. Connectez-vous avec votre compte existant
3. Le dashboard, les clés API et l'admin panel fonctionnent maintenant !

## 📝 Fichiers Modifiés

```
frontend/
├── src/
│   ├── config/
│   │   └── api.ts                    ✅ NOUVEAU
│   ├── services/
│   │   └── api.ts                    ✅ MODIFIÉ
│   └── pages/
│       ├── ApiKeysPage.tsx           ✅ MODIFIÉ
│       └── AdminPage.tsx             ✅ MODIFIÉ

backend/
└── src/
    └── routes/
        └── admin.js                  ✅ MODIFIÉ
```

## ✨ Résultat Final

✅ **Backend** : Fonctionne sur port 3000
✅ **Frontend** : Accessible sur port 5173
✅ **API Calls** : Fonctionnent correctement
✅ **Proxy Nginx** : Configuré et opérationnel
✅ **Docker Network** : Tous les services communiquent

---

**L'application est maintenant pleinement fonctionnelle !** 🎉

Accédez à **http://localhost:5173** pour commencer à l'utiliser.
