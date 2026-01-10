# Bot Discord SaaS-N8N

Bot Discord pour gérer et visualiser vos instances et workflows N8N.

## Configuration

1. Copiez `.env.example` vers `.env`
2. Remplissez les variables :
```env
TOKEN=votre_token_discord
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=saas_n8n
DB_PORT=3306
LOG_CHANNEL_ID=1459360962992668826
```

## Installation

```bash
npm install
```

## Migration de la base de données

Exécutez la migration pour créer la table `discord_links` :

```sql
mysql -u root -p saas_n8n < ../docker/mysql/migrations/013_create_discord_links_table.sql
```

Ou via Docker :

```bash
docker exec saas-n8n-mysql mysql -uroot -p'votre_mot_de_passe' saas_n8n < /docker-entrypoint-initdb.d/migrations/013_create_discord_links_table.sql
```

## Démarrage

```bash
node index.js
```

## Commandes Discord

### `/link <email>`
Lie votre compte Discord à votre compte SaaS-N8N.

**Exemple :**
```
/link email:samy74.hamdi@outlook.fr
```

### `/workflows`
Affiche tous vos workflows publics avec pagination.
- Boutons de navigation pour parcourir vos workflows
- Affiche 1 workflow par page

### `/favorites`
Affiche tous vos workflows favoris avec pagination.
- Boutons de navigation pour parcourir vos favoris
- Affiche 1 workflow par page

### `/instance`
Affiche toutes les informations de vos instances N8N :
- Statut (en ligne / hors ligne)
- URL d'accès
- Port
- Sous-domaine
- Date de création

## Logs automatiques

Le bot envoie automatiquement des logs dans le salon Discord (ID: 1459360962992668826) pour les événements suivants :

- 🔓 **Connexion** : Un utilisateur se connecte
- ✨ **Création de compte** : Un nouveau compte est créé
- 🔗 **Affiliation Discord** : Un compte est lié à Discord
- 🚀 **Création d'instance** : Une nouvelle instance N8N est créée
- 🗑️ **Suppression d'instance** : Une instance est supprimée
- ▶️ **Démarrage d'instance** : Une instance est démarrée
- ⏸️ **Arrêt d'instance** : Une instance est arrêtée
- 📢 **Workflow publié** : Un nouveau workflow public est ajouté
- ⚠️ **Suppression de compte** : Un compte utilisateur est supprimé

## Intégration Backend

Pour envoyer des logs depuis le backend Node.js, importez le Logger :

```javascript
import { Logger } from './path/to/logger.js';

const logger = new Logger(client);

// Exemple : Log de connexion
await logger.sendLog('login', {
    username: user.name,
    email: user.email,
    ip: req.ip
});

// Exemple : Log de création d'instance
await logger.sendLog('instance_create', {
    username: user.name,
    instanceId: instance.id,
    subdomain: instance.subdomain,
    url: `https://${instance.subdomain}.boubouw.com`
});
```

## Structure

```
bot/
├── src/
│   ├── commands/
│   │   └── utils/
│   │       ├── link.js         # Commande de liaison
│   │       ├── workflows.js    # Affichage workflows
│   │       ├── favorites.js    # Affichage favoris
│   │       └── instance.js     # Infos instances
│   ├── events/
│   │   └── client/
│   │       └── interactionCreate.js  # Gestion interactions
│   └── utils/
│       ├── database.js         # Requêtes DB
│       └── logger.js           # Système de logs
├── index.js                    # Point d'entrée
└── package.json
```

## Permissions Discord requises

Le bot nécessite les permissions suivantes :
- `Send Messages` - Envoyer des messages
- `Embed Links` - Intégrer des liens
- `Read Message History` - Lire l'historique
- `Use Slash Commands` - Utiliser les commandes slash
