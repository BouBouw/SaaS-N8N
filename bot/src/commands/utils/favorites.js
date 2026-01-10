import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { Database } from '../../utils/database.js';

export default {
    data: new SlashCommandBuilder()
        .setName('favorites')
        .setDescription('Voir vos workflows favoris'),

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

            // Compter les favoris
            const totalFavorites = await db.countUserFavorites(user.id);

            if (totalFavorites === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FF9900')
                    .setTitle('⭐ Aucun favori')
                    .setDescription('Vous n\'avez pas encore de workflows favoris.');

                return interaction.editReply({ embeds: [embed] });
            }

            // Récupérer le premier favori
            const favorites = await db.getUserFavorites(user.id, 1, 0);
            const workflow = favorites[0];
            const currentPage = 1;
            const totalPages = totalFavorites;

            const embed = createFavoriteEmbed(workflow, currentPage, totalPages, user);
            const buttons = createNavigationButtons(currentPage, totalPages, discordId);
            
            // Créer le fichier JSON en pièce jointe
            const workflowJson = typeof workflow.workflow_json === 'string' 
                ? workflow.workflow_json 
                : JSON.stringify(workflow.workflow_json, null, 2);
            const attachment = new AttachmentBuilder(Buffer.from(workflowJson, 'utf-8'), { 
                name: `${workflow.name.replace(/[^a-z0-9]/gi, '_')}.json` 
            });

            await interaction.editReply({ embeds: [embed], components: [buttons], files: [attachment] });

        } catch (error) {
            console.error('Error fetching favorites:', error);

            const embed = new EmbedBuilder()
                .setColor('#FF4444')
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la récupération des favoris.');

            await interaction.editReply({ embeds: [embed] });
        }
    }
};

function createFavoriteEmbed(workflow, currentPage, totalPages, user) {
    const workflowData = typeof workflow.workflow_json === 'string' 
        ? JSON.parse(workflow.workflow_json) 
        : workflow.workflow_json;

    const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`⭐ ${workflow.name}`)
        .setDescription(workflow.description || 'Aucune description')
        .addFields(
            { name: 'ID', value: String(workflow.id).substring(0, 8) + '...', inline: true },
            { name: 'Téléchargements', value: workflow.downloads?.toString() || '0', inline: true },
            { name: 'Créé le', value: new Date(workflow.created_at).toLocaleDateString('fr-FR'), inline: true }
        )
        .setFooter({ text: `Favori ${currentPage}/${totalPages} • ${user.name || user.email}` })
        .setTimestamp(new Date(workflow.created_at));

    return embed;
}

function createNavigationButtons(currentPage, totalPages, userId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`favorite_prev_${userId}_${currentPage}`)
                .setLabel('◀ Précédent')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1),
            new ButtonBuilder()
                .setCustomId(`favorite_page_${userId}_${currentPage}`)
                .setLabel(`${currentPage}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`favorite_next_${userId}_${currentPage}`)
                .setLabel('Suivant ▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages)
        );
}
