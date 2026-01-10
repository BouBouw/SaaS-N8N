import { EmbedBuilder } from 'discord.js';

export class Logger {
    constructor(client) {
        this.client = client;
        this.channelId = process.env.LOG_CHANNEL_ID;
    }

    async sendLog(type, data) {
        try {
            const channel = await this.client.channels.fetch(this.channelId);
            if (!channel) return;

            const embed = this.createEmbed(type, data);
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending log:', error);
        }
    }

    createEmbed(type, data) {
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setFooter({ text: 'SaaS N8N Logs' });

        switch (type) {
            case 'login':
                embed.setColor('#05F26C')
                    .setTitle('🔓 Connexion')
                    .setDescription(`**${data.username}** s'est connecté`)
                    .addFields(
                        { name: 'Email', value: data.email, inline: true },
                        { name: 'IP', value: data.ip || 'N/A', inline: true }
                    );
                break;

            case 'register':
                embed.setColor('#00D9FF')
                    .setTitle('✨ Nouveau compte')
                    .setDescription(`**${data.username}** a créé son compte`)
                    .addFields(
                        { name: 'Email', value: data.email, inline: true },
                        { name: 'User ID', value: data.userId, inline: true }
                    );
                break;

            case 'discord_link':
                embed.setColor('#5865F2')
                    .setTitle('🔗 Affiliation Discord')
                    .setDescription(`**${data.username}** a affilié son compte Discord`)
                    .addFields(
                        { name: 'Discord', value: `<@${data.discordId}>`, inline: true },
                        { name: 'Email', value: data.email, inline: true }
                    );
                break;

            case 'instance_create':
                embed.setColor('#05F26C')
                    .setTitle('🚀 Nouvelle instance')
                    .setDescription(`**${data.username}** a créé une nouvelle instance`)
                    .addFields(
                        { name: 'ID', value: data.instanceId, inline: true },
                        { name: 'Sous-domaine', value: data.subdomain, inline: true },
                        { name: 'Lien', value: data.url, inline: false }
                    );
                break;

            case 'instance_delete':
                embed.setColor('#FF4444')
                    .setTitle('🗑️ Instance supprimée')
                    .setDescription(`**${data.username}** a supprimé une instance`)
                    .addFields(
                        { name: 'ID', value: data.instanceId, inline: true },
                        { name: 'Sous-domaine', value: data.subdomain, inline: true }
                    );
                break;

            case 'instance_start':
                embed.setColor('#05F26C')
                    .setTitle('▶️ Instance démarrée')
                    .setDescription(`**${data.username}** a démarré une instance`)
                    .addFields(
                        { name: 'Instance', value: data.subdomain, inline: true },
                        { name: 'Lien', value: data.url, inline: false }
                    );
                break;

            case 'instance_stop':
                embed.setColor('#FF9900')
                    .setTitle('⏸️ Instance arrêtée')
                    .setDescription(`**${data.username}** a arrêté une instance`)
                    .addFields(
                        { name: 'Instance', value: data.subdomain, inline: true }
                    );
                break;

            case 'workflow_publish':
                embed.setColor('#00D9FF')
                    .setTitle('📢 Nouveau workflow public')
                    .setDescription(`**${data.username}** a publié un workflow`)
                    .addFields(
                        { name: 'Nom', value: data.workflowName, inline: true },
                        { name: 'Description', value: data.description || 'Aucune description', inline: false }
                    );
                break;

            case 'account_delete':
                embed.setColor('#FF0000')
                    .setTitle('⚠️ Compte supprimé')
                    .setDescription(`Le compte de **${data.username}** a été supprimé`)
                    .addFields(
                        { name: 'Email', value: data.email, inline: true },
                        { name: 'User ID', value: data.userId, inline: true }
                    );
                break;

            default:
                embed.setColor('#CCCCCC')
                    .setTitle('📝 Log')
                    .setDescription(JSON.stringify(data, null, 2));
        }

        return embed;
    }
}
