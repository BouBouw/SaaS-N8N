# 🔌 Guide d'Intégration des Workflows dans un Frontend Externe

## 📋 Vue d'ensemble

Ce guide explique comment intégrer vos workflows N8N dans n'importe quel frontend externe (React, Vue, Angular, HTML/JS, etc.) en utilisant notre API.

## 🔑 Étape 1 : Créer une Clé API

### Via l'API :

```bash
# Obtenir votre JWT token d'abord
TOKEN="votre_jwt_token"

# Créer une clé API
curl -X POST http://localhost:3000/api/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Frontend App"}'
```

**Réponse :**
```json
{
  "success": true,
  "message": "API key created successfully. Save this key securely, it will not be shown again.",
  "data": {
    "id": "abc123...",
    "name": "My Frontend App",
    "apiKey": "e5f8a9b2c4d6e8f0a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7"
  }
}
```

⚠️ **Important** : Sauvegardez cette clé API immédiatement. Elle ne sera plus jamais affichée.

## 📡 Étape 2 : Utiliser l'API

### Endpoints Disponibles

#### 1. **Lister tous les workflows**
```
GET /api/workflows/public
Headers: x-api-key: YOUR_API_KEY
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "1",
        "name": "My Workflow",
        "active": true,
        "nodes": [...],
        "connections": {...},
        "createdAt": "2026-01-08T12:00:00Z",
        "updatedAt": "2026-01-08T12:00:00Z"
      }
    ],
    "instanceUrl": "https://xxxxxxxx.boubouw.com",
    "count": 1
  }
}
```

#### 2. **Récupérer un workflow spécifique**
```
GET /api/workflows/public/:workflowId
Headers: x-api-key: YOUR_API_KEY
```

## 💻 Exemples d'Intégration

### JavaScript Vanilla

```javascript
const API_KEY = 'your_api_key_here';
const API_URL = 'http://localhost:3000/api';

async function getWorkflows() {
  try {
    const response = await fetch(`${API_URL}/workflows/public`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    const data = await response.json();
    console.log('Workflows:', data.data.workflows);
    return data.data.workflows;
  } catch (error) {
    console.error('Error:', error);
  }
}

getWorkflows();
```

### React

```jsx
import { useState, useEffect } from 'react';

const API_KEY = 'your_api_key_here';
const API_URL = 'http://localhost:3000/api';

function WorkflowsList() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkflows() {
      try {
        const response = await fetch(`${API_URL}/workflows/public`, {
          headers: {
            'x-api-key': API_KEY
          }
        });
        const data = await response.json();
        setWorkflows(data.data.workflows);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflows();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Workflows</h1>
      {workflows.map(workflow => (
        <div key={workflow.id}>
          <h3>{workflow.name}</h3>
          <p>Status: {workflow.active ? 'Active' : 'Inactive'}</p>
          <p>Nodes: {workflow.nodes?.length}</p>
        </div>
      ))}
    </div>
  );
}

export default WorkflowsList;
```

### Vue.js

```vue
<template>
  <div>
    <h1>My Workflows</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-for="workflow in workflows" :key="workflow.id">
        <h3>{{ workflow.name }}</h3>
        <p>Status: {{ workflow.active ? 'Active' : 'Inactive' }}</p>
        <p>Nodes: {{ workflow.nodes?.length }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      workflows: [],
      loading: true,
      apiKey: 'your_api_key_here',
      apiUrl: 'http://localhost:3000/api'
    };
  },
  async mounted() {
    await this.fetchWorkflows();
  },
  methods: {
    async fetchWorkflows() {
      try {
        const response = await fetch(`${this.apiUrl}/workflows/public`, {
          headers: {
            'x-api-key': this.apiKey
          }
        });
        const data = await response.json();
        this.workflows = data.data.workflows;
      } catch (error) {
        console.error('Error:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

### Angular

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-workflows',
  template: `
    <h1>My Workflows</h1>
    <div *ngIf="loading">Loading...</div>
    <div *ngFor="let workflow of workflows">
      <h3>{{ workflow.name }}</h3>
      <p>Status: {{ workflow.active ? 'Active' : 'Inactive' }}</p>
      <p>Nodes: {{ workflow.nodes?.length }}</p>
    </div>
  `
})
export class WorkflowsComponent implements OnInit {
  workflows: any[] = [];
  loading = true;
  private apiKey = 'your_api_key_here';
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchWorkflows();
  }

  fetchWorkflows() {
    const headers = new HttpHeaders({
      'x-api-key': this.apiKey
    });

    this.http.get(`${this.apiUrl}/workflows/public`, { headers })
      .subscribe({
        next: (data: any) => {
          this.workflows = data.data.workflows;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
        }
      });
  }
}
```

## 🔒 Sécurité

### ⚠️ Bonnes Pratiques

1. **Ne jamais exposer votre clé API dans le code frontend public**
   - Utilisez des variables d'environnement
   - Passez par un backend proxy si possible

2. **Utilisez HTTPS en production**
   ```javascript
   const API_URL = 'https://your-domain.com/api';
   ```

3. **Gérez les erreurs correctement**
   ```javascript
   try {
     const response = await fetch(url, options);
     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }
   } catch (error) {
     console.error('Error:', error);
   }
   ```

## 🎨 Exemple Complet

Un exemple HTML complet est disponible dans : `examples/workflow-integration.html`

Pour l'utiliser :
1. Ouvrez le fichier dans un navigateur
2. Entrez votre clé API
3. Cliquez sur "Load Workflows"

## 📊 Gestion des Clés API

### Lister vos clés API
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/api-keys
```

### Supprimer une clé API
```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/api-keys/:keyId
```

## 🌐 CORS

Pour utiliser l'API depuis un domaine différent, assurez-vous que CORS est configuré dans le backend.

## 💡 Cas d'Usage

- **Dashboard personnalisé** : Afficher vos workflows dans votre propre interface
- **Documentation** : Intégrer la liste des workflows dans votre documentation
- **Monitoring** : Créer un système de monitoring personnalisé
- **Mobile App** : Utiliser l'API dans une application mobile

## 🆘 Support

Pour toute question, consultez :
- [README.md](../README.md)
- [QUICKSTART.md](../QUICKSTART.md)
- [DEPLOYMENT.md](../DEPLOYMENT.md)
