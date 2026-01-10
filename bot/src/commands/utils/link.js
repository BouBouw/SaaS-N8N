import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Database } from '../../utils/database.js';
import { Logger } from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Lier votre compte Discord à votre compte SaaS N8N')
        .addStringOption(option =>
            option.setName('email')
                .setDescription('Votre adresse email du compte SaaS N8N')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const db = new Database(interaction.client.db);
        const logger = new Logger(interaction.client);
        const email = interaction.options.getString('email');
        const discordId = interaction.user.id;
        const discordUsername = interaction.user.tag;

        try {
            // Vérifier si le Discord est déjà lié
            const existingLink = await db.isDiscordLinked(discordId);
            if (existingLink) {
                const embed = new EmbedBuilder()
                    .setColor('#FF4444')
                    .setTitle('❌ Compte déjà lié')
                    .setDescription(`Votre compte Discord est déjà lié à un compte SaaS N8N.`)
                    .addFields({ name: 'Email lié', value: existingLink.email || 'N/A' });

                return interaction.editReply({ embeds: [embed] });
            }

            // Vérifier si l'utilisateur existe
            const [users] = await interaction.client.db.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FF4444')
                    .setTitle('❌ Compte introuvable')
                    .setDescription('Aucun compte SaaS N8N n\'existe avec cet email.')
                    .addFields({ name: 'Email recherché', value: email });

                return interaction.editReply({ embeds: [embed] });
            }

            const user = users[0];

            // Vérifier si l'email est déjà lié à un autre Discord
            const [existingLinks] = await interaction.client.db.execute(
                'SELECT * FROM discord_links WHERE user_id = ?',
                [user.id]
            );

            if (existingLinks.length > 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FF4444')
                    .setTitle('❌ Email déjà lié')
                    .setDescription('Cet email est déjà lié à un autre compte Discord.')
                    .addFields({ name: 'Discord lié', value: `<@${existingLinks[0].discord_id}>` });

                return interaction.editReply({ embeds: [embed] });
            }

            // Créer le lien
            await db.linkDiscordAccount(user.id, discordId, discordUsername);

            const embed = new EmbedBuilder()
                .setColor('#05F26C')
                .setTitle('✅ Compte lié avec succès')
                .setDescription('Votre compte Discord est maintenant lié à votre compte SaaS N8N!')
                .addFields(
                    { name: 'Email', value: email, inline: true },
                    { name: 'Utilisateur', value: user.name || 'N/A', inline: true }
                )
                .setFooter({ text: 'Vous pouvez maintenant utiliser les commandes du bot' });

            await interaction.editReply({ embeds: [embed] });

            // Log l'événement
            await logger.sendLog('discord_link', {
                username: user.name || user.email,
                email: email,
                discordId: discordId
            });

        } catch (error) {
            console.error('Error linking Discord account:', error);

            const embed = new EmbedBuilder()
                .setColor('#FF4444')
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de la liaison du compte.')
                .addFields({ name: 'Erreur', value: error.message });

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
