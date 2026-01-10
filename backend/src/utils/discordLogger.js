// Exemple d'intégration du système de logs Discord dans le backend

import axios from 'axios';

class DiscordLogger {
    constructor(webhookUrl = null, botEndpoint = null) {
        this.webhookUrl = webhookUrl;
        this.botEndpoint = botEndpoint; // Endpoint du bot pour les logs
    }

    async sendLog(type, data) {
        if (!this.botEndpoint && !this.webhookUrl) {
            console.warn('No Discord logging endpoint configured');
            return;
        }

        try {
            // Méthode 1 : Via endpoint du bot (recommandé)
            if (this.botEndpoint) {
                await axios.post(this.botEndpoint, {
                    type,
                    data,
                    timestamp: new Date().toISOString()
                });
            }

            // Méthode 2 : Via webhook Discord (alternative)
            if (this.webhookUrl) {
                const embed = this.createEmbed(type, data);
                await axios.post(this.webhookUrl, {
                    embeds: [embed]
                });
            }
        } catch (error) {
            console.error('Error sending Discord log:', error.message);
        }
    }

    createEmbed(type, data) {
        const embed = {
            timestamp: new Date().toISOString(),
            footer: { text: 'SaaS N8N Logs' }
        };

        switch (type) {
            case 'login':
                embed.color = 0x05F26C;
                embed.title = '🔓 Connexion';
                embed.description = `**${data.username}** s'est connecté`;
                embed.fields = [
                    { name: 'Email', value: data.email, inline: true },
                    { name: 'IP', value: data.ip || 'N/A', inline: true }
                ];
                break;

            case 'register':
                embed.color = 0x00D9FF;
                embed.title = '✨ Nouveau compte';
                embed.description = `**${data.username}** a créé son compte`;
                embed.fields = [
                    { name: 'Email', value: data.email, inline: true },
                    { name: 'User ID', value: data.userId, inline: true }
                ];
                break;

            case 'instance_create':
                embed.color = 0x05F26C;
                embed.title = '🚀 Nouvelle instance';
                embed.description = `**${data.username}** a créé une nouvelle instance`;
                embed.fields = [
                    { name: 'ID', value: data.instanceId, inline: true },
                    { name: 'Sous-domaine', value: data.subdomain, inline: true },
                    { name: 'Lien', value: data.url, inline: false }
                ];
                break;

            case 'instance_delete':
                embed.color = 0xFF4444;
                embed.title = '🗑️ Instance supprimée';
                embed.description = `**${data.username}** a supprimé une instance`;
                embed.fields = [
                    { name: 'ID', value: data.instanceId, inline: true },
                    { name: 'Sous-domaine', value: data.subdomain, inline: true }
                ];
                break;

            case 'workflow_publish':
                embed.color = 0x00D9FF;
                embed.title = '📢 Nouveau workflow public';
                embed.description = `**${data.username}** a publié un workflow`;
                embed.fields = [
                    { name: 'Nom', value: data.workflowName, inline: true },
                    { name: 'Description', value: data.description || 'Aucune description', inline: false }
                ];
                break;

            default:
                embed.color = 0xCCCCCC;
                embed.title = '📝 Log';
                embed.description = JSON.stringify(data, null, 2);
        }

        return embed;
    }
}

// Utilisation dans le backend
export default DiscordLogger;

/*
EXEMPLE D'UTILISATION DANS LES CONTROLLERS :

// Dans authController.js
import DiscordLogger from '../utils/discordLogger.js';
const discordLogger = new DiscordLogger(process.env.DISCORD_WEBHOOK_URL);

// Lors de la connexion
await discordLogger.sendLog('login', {
    username: user.name,
    email: user.email,
    ip: req.ip
});

// Dans instanceController.js
// Lors de la création d'instance
await discordLogger.sendLog('instance_create', {
    username: user.name,
    instanceId: instance.id,
    subdomain: instance.subdomain,
    url: `https://${instance.subdomain}.boubouw.com`
});

// Lors de la suppression
await discordLogger.sendLog('instance_delete', {
    username: user.name,
    instanceId: instance.id,
    subdomain: instance.subdomain
});

// Dans publicWorkflowController.js
// Lors de la publication d'un workflow
await discordLogger.sendLog('workflow_publish', {
    username: user.name,
    workflowName: workflow.name,
    description: workflow.description
});
*/
