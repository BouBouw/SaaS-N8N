import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { Database } from '../../utils/database.js';

export default {
    name: 'interactionCreate',
    once: false,
    execute: async (interaction) => {
        // Gérer les commandes slash
        if (interaction.isChatInputCommand()) {
            const cmd = interaction.client.commands.get(interaction.commandName);
            if (!cmd) {
                return interaction.reply({ 
                    content: `Une erreur est survenue.`, 
                    ephemeral: true 
                });
            }

            console.log(`[SLASH COMMAND] /${cmd.data.name} executed by ${interaction.user.tag}`);
            
            try {
                await cmd.execute(interaction);
            } catch (error) {
                console.error(`Error executing command ${cmd.data.name}:`, error);
                const errorMessage = {
                    content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
                    ephemeral: true
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }

        // Gérer les boutons de pagination
        if (interaction.isButton()) {
            const [type, action, userId, currentPage] = interaction.customId.split('_');

            // Vérifier si c'est l'utilisateur qui a lancé la commande
            if (userId !== interaction.user.id) {
                return interaction.reply({
                    content: '❌ Vous ne pouvez pas utiliser ces boutons.',
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();

            const db = new Database(interaction.client.db);
            const user = await db.getUserByDiscordId(interaction.user.id);

            if (!user) {
                return interaction.editReply({
                    content: '❌ Compte non lié.',
                    components: []
                });
            }

            try {
                if (type === 'workflow') {
                    await handleWorkflowPagination(interaction, db, user, action, parseInt(currentPage));
                } else if (type === 'favorite') {
                    await handleFavoritePagination(interaction, db, user, action, parseInt(currentPage));
                }
            } catch (error) {
                console.error('Pagination error:', error);
            }
        }
    }
};

async function handleWorkflowPagination(interaction, db, user, action, currentPage) {
    const totalWorkflows = await db.countUserWorkflows(user.id);
    let newPage = currentPage;

    if (action === 'next') {
        newPage = currentPage + 1;
    } else if (action === 'prev') {
        newPage = currentPage - 1;
    }

    const workflows = await db.getUserWorkflows(user.id, 1, newPage - 1);
    const workflow = workflows[0];

    const embed = createWorkflowEmbed(workflow, newPage, totalWorkflows, user);
    const buttons = createNavigationButtons('workflow', newPage, totalWorkflows, interaction.user.id);
    
    // Créer le fichier JSON en pièce jointe
    const workflowJson = typeof workflow.workflow_json === 'string' 
        ? workflow.workflow_json 
        : JSON.stringify(workflow.workflow_json, null, 2);
    const attachment = new AttachmentBuilder(Buffer.from(workflowJson, 'utf-8'), { 
        name: `${workflow.name.replace(/[^a-z0-9]/gi, '_')}.json` 
    });

    await interaction.editReply({ embeds: [embed], components: [buttons], files: [attachment] });
}

async function handleFavoritePagination(interaction, db, user, action, currentPage) {
    const totalFavorites = await db.countUserFavorites(user.id);
    let newPage = currentPage;

    if (action === 'next') {
        newPage = currentPage + 1;
    } else if (action === 'prev') {
        newPage = currentPage - 1;
    }

    const favorites = await db.getUserFavorites(user.id, 1, newPage - 1);
    const workflow = favorites[0];

    const embed = createFavoriteEmbed(workflow, newPage, totalFavorites, user);
    const buttons = createNavigationButtons('favorite', newPage, totalFavorites, interaction.user.id);
    
    // Créer le fichier JSON en pièce jointe
    const workflowJson = typeof workflow.workflow_json === 'string' 
        ? workflow.workflow_json 
        : JSON.stringify(workflow.workflow_json, null, 2);
    const attachment = new AttachmentBuilder(Buffer.from(workflowJson, 'utf-8'), { 
        name: `${workflow.name.replace(/[^a-z0-9]/gi, '_')}.json` 
    });

    await interaction.editReply({ embeds: [embed], components: [buttons], files: [attachment] });
}

function createWorkflowEmbed(workflow, currentPage, totalPages, user) {
    return new EmbedBuilder()
        .setColor('#05F26C')
        .setTitle(`📊 ${workflow.name}`)
        .setDescription(workflow.description || 'Aucune description')
        .addFields(
            { name: 'ID', value: String(workflow.id).substring(0, 8) + '...', inline: true },
            { name: 'Téléchargements', value: workflow.downloads?.toString() || '0', inline: true },
            { name: 'Créé le', value: new Date(workflow.created_at).toLocaleDateString('fr-FR'), inline: true }
        )
        .setFooter({ text: `Page ${currentPage}/${totalPages} • ${user.name || user.email}` })
        .setTimestamp(new Date(workflow.created_at));
}

function createFavoriteEmbed(workflow, currentPage, totalPages, user) {
    return new EmbedBuilder()
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
}

function createNavigationButtons(type, currentPage, totalPages, userId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`${type}_prev_${userId}_${currentPage}`)
                .setLabel('◀ Précédent')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1),
            new ButtonBuilder()
                .setCustomId(`${type}_page_${userId}_${currentPage}`)
                .setLabel(`${currentPage}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`${type}_next_${userId}_${currentPage}`)
                .setLabel('Suivant ▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages)
        );
}
