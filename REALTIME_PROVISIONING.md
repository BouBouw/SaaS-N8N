# Système de Provisioning en Temps Réel

## Vue d'ensemble

Le système de provisioning a été amélioré pour afficher la progression en temps réel lors de la création d'une instance N8N. Utilise **Server-Sent Events (SSE)** pour diffuser les mises à jour du backend vers le frontend.

## Fonctionnalités

### 1. Affichage en Temps Réel
- **Barre de progression** : 0% → 100%
- **Messages de statut** : Chaque étape du provisioning est affichée
- **Indicateurs visuels** : 
  - 🔵 Loader animé pendant le provisioning
  - ✅ Icône de succès à la fin
  - ❌ Icône d'erreur en cas d'échec

### 2. Étapes de Provisioning Affichées
1. **10%** : Démarrage du provisioning
2. **20%** : Génération du sous-domaine
3. **30%** : Création du volume Docker
4. **40%** : Configuration des limites de ressources
5. **50%** : Téléchargement de l'image N8N
6. **60%** : Image prête
7. **70%** : Création du conteneur
8. **80%** : Démarrage du conteneur
9. **85%** : Sauvegarde de la configuration
10. **90%** : Configuration HTTPS et domaine
11. **100%** : Instance prête!

### 3. Gestion des Erreurs
- Affichage des erreurs en temps réel
- Bouton "Retry" automatique
- Timeouts gérés

## Architecture Technique

### Backend

#### 1. Endpoint SSE
```javascript
// backend/src/routes/instances.js
router.get('/provision/progress', instanceController.getProvisioningProgress);
```

**Caractéristiques** :
- Authentification via token JWT dans l'URL (EventSource ne supporte pas les headers)
- Headers SSE : `Content-Type: text/event-stream`
- Stockage des connexions clients dans une Map
- Nettoyage automatique à la déconnexion

#### 2. Fonction de Callback
```javascript
// backend/src/controllers/instanceController.js
export const sendProvisioningUpdate = (userId, type, message, progress = null)
```

**Types de messages** :
- `info` : Message informatif
- `success` : Succès final
- `error` : Erreur
- `connected` : Connexion établie

#### 3. Service de Provisioning Modifié
```javascript
// backend/src/services/instanceService.js
export const provisionInstance = async (userId, userEmail, progressCallback = null)
```

Le service appelle `progressCallback(userId, type, message, progress)` à chaque étape.

### Frontend

#### 1. Composant ProvisioningProgress
```typescript
// frontend/src/components/ProvisioningProgress.tsx
<ProvisioningProgress onComplete={handleProvisioningComplete} />
```

**Props** :
- `onComplete` : Callback appelé quand le provisioning est terminé

**État** :
- `messages` : Historique des messages reçus
- `currentProgress` : Progression actuelle (0-100)
- `status` : État actuel (connecting/provisioning/success/error)

#### 2. Dashboard Intégration
```typescript
// frontend/src/pages/Dashboard.tsx
const [showProvisioning, setShowProvisioning] = useState(false);

if (showProvisioning) {
  return <ProvisioningProgress onComplete={handleProvisioningComplete} />;
}
```

**Comportement** :
- Lors de l'inscription : `showProvisioning = true` automatiquement
- Après suppression d'instance : `showProvisioning = true`
- Après provisioning réussi : Rechargement du Dashboard

## Flux de Travail

### Inscription d'un Nouvel Utilisateur
1. User s'inscrit via `/register`
2. Backend crée le user dans la DB
3. Backend démarre le provisioning en arrière-plan
4. Backend envoie les updates via SSE
5. Frontend affiche la progression en temps réel
6. À 100%, redirection vers le Dashboard

### Suppression et Recréation
1. User clique sur "Delete Instance"
2. Confirmation
3. Instance supprimée (container, volume, config, DB)
4. `showProvisioning = true`
5. SSE écoute les updates du nouveau provisioning
6. Affichage temps réel de la recréation

## Sécurité

### Authentification SSE
- Token JWT passé en query parameter (limitation d'EventSource)
- Validation du token côté backend
- Connexion fermée automatiquement si token invalide
- Chaque user ne peut voir que son propre provisioning

### Cleanup
- Map de connexions nettoyée à la déconnexion
- Pas de fuite mémoire
- Timeouts gérés

## Déploiement

### Modifications Nécessaires

1. **Nginx Configuration** (si reverse proxy)
```nginx
location /api/instances/provision/progress {
    proxy_pass http://backend;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding off;
    proxy_buffering off;
    proxy_cache off;
}
```

2. **Variables d'Environnement**
Aucune nouvelle variable nécessaire.

## Tests

### Test Manuel
1. S'inscrire avec un nouveau compte
2. Observer l'écran de provisioning
3. Vérifier que les messages s'affichent progressivement
4. Vérifier la barre de progression
5. À 100%, vérifier la redirection vers le Dashboard

### Test de Suppression
1. Dashboard → Delete Instance
2. Confirmer
3. Observer le retour à l'écran de provisioning
4. Vérifier la création de la nouvelle instance

## Limitations

### 1. EventSource vs WebSocket
- **EventSource** : Unidirectionnel (serveur → client), parfait pour notre cas
- Pas de support des headers Authorization (contournement via query param)
- Pas de reconnexion automatique après 100% (volontaire)

### 2. Délai de Reload Nginx
- Le provisioning peut se terminer à 100%
- Mais Nginx reload peut prendre jusqu'à 60 secondes (cron job)
- L'instance n'est accessible qu'après le reload

### 3. Multiples Onglets
- Chaque onglet crée une connexion SSE séparée
- Le Map côté backend gère une seule connexion par userId
- Seul le dernier onglet ouvert reçoit les updates

## Dépannage

### "Connection lost"
- Vérifier que le backend est accessible
- Vérifier les logs backend pour les erreurs
- Vérifier le token JWT (non expiré)

### Progression bloquée
- Vérifier les logs Docker : `docker compose logs backend`
- Vérifier les images Docker : `docker images | grep n8n`
- Vérifier les containers : `docker ps -a`

### Nginx ne reload pas
- Vérifier le cron job : `cat /etc/cron.d/nginx-reload`
- Vérifier les logs cron : `grep CRON /var/log/syslog`
- Vérifier manuellement : `nginx -t && systemctl reload nginx`

## Améliorations Futures

1. **WebSocket** : Communication bidirectionnelle
2. **Notifications Push** : Alertes navigateur
3. **Retry Automatique** : En cas d'échec temporaire
4. **Estimation du Temps** : Affichage du temps restant
5. **Logs Streaming** : Affichage des logs Docker en temps réel
