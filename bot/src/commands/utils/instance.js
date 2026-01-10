import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Database } from '../../utils/database.js';

export default {
    data: new SlashCommandBuilder()
        .setName('instance')
        .setDescription('Voir les informations de vos instances N8N'),

    async execute(interaction) {
        await interaction.deferReply();

        const db = new Database(interaction.client.db);
        const discordId = interaction.user.id;

        try {
            // Vérifier si le compte est lié
            const user = await db.getUserByDiscordId(discordId);
            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('#FF4444')
                    .setTitle('❌ Compte non lié')
                    .setDescription('Vous devez d\'abord lier votre compte Discord avec `/link`');

                return interaction.editReply({ embeds: [embed] });
            }

            // Récupérer les instances
            const instances = await db.getUserInstances(user.id);

            if (instances.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FF9900')
                    .setTitle('🚫 Aucune instance')
                    .setDescription('Vous n\'avez pas encore créé d\'instance N8N.');

                return interaction.editReply({ embeds: [embed] });
            }

            // Créer un embed par instance
            const embeds = instances.map((instance, index) => {
                const statusEmoji = instance.status === 'running' ? '🟢' : '🔴';
                const statusText = instance.status === 'running' ? 'En ligne' : 'Hors ligne';

                return new EmbedBuilder()
                    .setColor(instance.status === 'running' ? '#05F26C' : '#FF4444')
                    .setTitle(`${statusEmoji} Instance N8N ${index + 1}/${instances.length}`)
                    .setDescription(`**${instance.subdomain}**.boubouw.com`)
                    .addFields(
                        { name: 'ID', value: instance.id.substring(0, 8) + '...', inline: true },
                        { name: 'Statut', value: statusText, inline: true },
                        { name: 'Port', value: instance.port?.toString() || 'N/A', inline: true },
                        { name: 'Sous-domaine', value: instance.subdomain, inline: true },
                        { name: 'Conteneur', value: instance.container_name, inline: true },
                        { name: 'Username N8N', value: instance.n8n_username || 'admin', inline: true },
                        { name: '🔗 URL', value: `https://${instance.subdomain}.boubouw.com`, inline: false },
                        { name: 'Créé le', value: new Date(instance.created_at).toLocaleDateString('fr-FR'), inline: true }
                    )
                    .setFooter({ text: `${user.name || user.email} • Instance ${index + 1}/${instances.length}` })
                    .setTimestamp(new Date(instance.created_at));
            });

            // Envoyer tous les embeds (Discord limite à 10)
            if (embeds.length <= 10) {
                await interaction.editReply({ embeds: embeds });
            } else {
                // Envoyer les 10 premiers
                await interaction.editReply({ embeds: embeds.slice(0, 10) });
                
                // Envoyer les suivants en plusieurs messages
                for (let i = 10; i < embeds.length; i += 10) {
                    await interaction.followUp({ 
                        embeds: embeds.slice(i, i + 10),
                        ephemeral: true
                    });
                }
            }

        } catch (error) {
            console.error('Error fetching instances:', error);

            const embed = new EmbedBuilder()
                .setColor('#FF4444')
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la récupération des instances.')
                .addFields({ name: 'Erreur', value: error.message });

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
