# Guide d'installation complet du Bot Discord SaaS-N8N

## Prérequis

- Node.js 18+ installé
- Bot Discord créé sur https://discord.com/developers
- Accès à la base de données MySQL du backend SaaS-N8N

## Étape 1 : Créer le bot Discord

1. Allez sur https://discord.com/developers/applications
2. Cliquez sur "New Application"
3. Donnez un nom à votre bot (ex: "SaaS N8N Manager")
4. Allez dans l'onglet "Bot"
5. Cliquez sur "Add Bot"
6. Copiez le **Token** (gardez-le secret !)
7. Activez les intents suivants :
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent

## Étape 2 : Inviter le bot sur votre serveur

1. Allez dans l'onglet "OAuth2" > "URL Generator"
2. Cochez les scopes :
   - ✅ `bot`
   - ✅ `applications.commands`
3. Cochez les permissions :
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Use Slash Commands
4. Copiez l'URL générée et ouvrez-la dans votre navigateur
5. Sélectionnez votre serveur et autorisez le bot

## Étape 3 : Configuration du bot

1. Naviguez vers le dossier du bot :
```bash
cd bot
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez le fichier `.env` :
```env
TOKEN=votre_token_discord_ici
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=G3TU^j57z:@.
DB_NAME=saas_n8n
DB_PORT=3306
LOG_CHANNEL_ID=1459360962992668826
```

## Étape 4 : Migration de la base de données

Exécutez la migration pour créer la table de liaison Discord :

**Option A - Directement sur le serveur MySQL :**
```bash
mysql -u root -p'G3TU^j57z:@.' saas_n8n < ../docker/mysql/migrations/013_create_discord_links_table.sql
```

**Option B - Via Docker (sur le VPS) :**
```bash
docker exec -i saas-n8n-mysql mysql -uroot -p'G3TU^j57z:@.' saas_n8n < /docker-entrypoint-initdb.d/migrations/013_create_discord_links_table.sql
```

**Option C - Manuellement via MySQL :**
```sql
CREATE TABLE IF NOT EXISTS discord_links (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    discord_id VARCHAR(20) NOT NULL UNIQUE,
    discord_username VARCHAR(100) NOT NULL,
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_discord_id (discord_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Étape 5 : Démarrer le bot

```bash
node index.js
```

Vous devriez voir :
```
✅ Connected to SaaS-N8N database
[Bot Name] is online!
```

## Étape 6 : Tester les commandes

Dans votre serveur Discord, tapez `/` et vous devriez voir les commandes du bot :

1. **Lier votre compte :**
```
/link email:votre@email.com
```

2. **Voir vos workflows :**
```
/workflows
```

3. **Voir vos favoris :**
```
/favorites
```

4. **Voir vos instances :**
```
/instance
```

## Étape 7 : Intégrer les logs dans le backend (optionnel)

Pour que le backend envoie automatiquement des logs au bot Discord :

1. Copiez le fichier `discordLogger.js` dans `backend/src/utils/`
2. Créez un webhook Discord :
   - Allez dans les paramètres du salon de logs
   - Intégrations > Webhooks > Nouveau Webhook
   - Copiez l'URL du webhook
3. Ajoutez dans `backend/.env` :
```env
DISCORD_WEBHOOK_URL=votre_webhook_url
```

4. Importez et utilisez dans les controllers :
```javascript
import DiscordLogger from '../utils/discordLogger.js';
const discordLogger = new DiscordLogger(process.env.DISCORD_WEBHOOK_URL);

// Exemple d'utilisation
await discordLogger.sendLog('login', {
    username: user.name,
    email: user.email,
    ip: req.ip
});
```

## Déploiement en production (VPS)

1. **Installer PM2 pour maintenir le bot en ligne :**
```bash
npm install -g pm2
```

2. **Créer un fichier ecosystem.config.js :**
```javascript
module.exports = {
  apps: [{
    name: 'saas-n8n-bot',
    script: './index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

3. **Démarrer avec PM2 :**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. **Commandes PM2 utiles :**
```bash
pm2 list              # Voir les processus
pm2 logs saas-n8n-bot # Voir les logs
pm2 restart saas-n8n-bot # Redémarrer
pm2 stop saas-n8n-bot    # Arrêter
```

## Dépannage

### Le bot ne se connecte pas à la base de données
- Vérifiez les identifiants dans `.env`
- Vérifiez que MySQL est accessible depuis l'emplacement du bot
- Si sur VPS différent : autorisez les connexions externes dans MySQL

### Les commandes n'apparaissent pas
- Attendez quelques minutes (les commandes slash peuvent prendre du temps à se synchroniser)
- Vérifiez que le bot a les permissions `applications.commands`
- Redémarrez le bot

### Erreur "Compte non lié"
- Utilisez d'abord `/link email:votre@email.com`
- Vérifiez que l'email existe dans la table `users`
- Vérifiez que la table `discord_links` existe

### Les logs ne s'affichent pas
- Vérifiez que `LOG_CHANNEL_ID` est correct
- Vérifiez que le bot a accès à ce salon
- Vérifiez que le bot peut envoyer des messages et des embeds

## Support

Pour toute question ou problème, vérifiez :
1. Les logs du bot (`pm2 logs` ou console)
2. Les logs du backend
3. La connexion à la base de données
4. Les permissions Discord du bot
