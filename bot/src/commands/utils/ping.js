import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Réponds "Pong!"'),
    category: 'Utils',
    type: ApplicationCommandType.ChatInput,
    execute: async (interaction) => {
        await interaction.reply({ content: `${interaction.member} pong! :ping_pong:` });
    }
};