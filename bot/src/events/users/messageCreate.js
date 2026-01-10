import axios from 'axios';
import { EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export default {
    name: 'messageCreate',
    once: false,
    execute: async (message) => {
        const client = message.client;
        if (message.author.bot) return;
        if (!message.guild) return;

        if (message.channel.id === "1458601352513982779") {
            // Vérifier si le message mentionne le bot
            if (!message.mentions.has(client.user.id)) return;

            // Afficher l'indicateur de saisie
            await message.channel.sendTyping();

            await RequestAtAI(message, client, null);
        }

        // Gérer les réponses dans un thread existant
        if (message.channel.isThread() && message.channel.parentId === "1458601352513982779") {
            // Vérifier si c'est un reply au bot
            const repliedMessage = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
            if (repliedMessage && repliedMessage.author.id === client.user.id) {
                await message.channel.sendTyping();
                await RequestAtAI(message, client, message.channel);
            }
        }
    }
}

async function RequestAtAI(message, client, existingThread = null) {
    try {
        // Construction du prompt système (agent IA)
        const systemPrompt = `Tu es ${client.user.username}, un expert en intelligence artificielle avec plus de 5 ans d'expérience dans la création d'agents IA via des plateformes comme N8N.

Tu es également développeur senior spécialisé dans l'intégration d'IA dans des services front-end et back-end. Tu maîtrises :
- La création d'automatisations et d'agents IA avec N8N et autres plateformes SaaS
- L'intégration d'APIs d'IA (OpenAI, Claude, DeepSeek, etc.)
- L'architecture de solutions IA complètes (workflows, agents conversationnels, RAG)
- Le développement full-stack avec intégration d'IA
- Les meilleures pratiques en prompt engineering et fine-tuning

Tu réponds de manière professionnelle, claire et technique quand nécessaire. Tu partages ton expertise avec des exemples concrets et des conseils pratiques. Tu es sur le serveur Discord "${message.guild.name}" pour aider les membres avec leurs projets IA.

Réponds en français de manière naturelle et experte.`;

        // Construire l'historique de la conversation si on est dans un thread
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            }
        ];

        if (existingThread) {
            // Récupérer l'historique du thread
            const threadMessages = await existingThread.messages.fetch({ limit: 50 });
            const sortedMessages = [...threadMessages.values()].reverse();

            for (const msg of sortedMessages) {
                if (msg.author.bot && msg.author.id === client.user.id) {
                    // Message du bot
                    const content = msg.embeds[0]?.description || msg.content;
                    if (content) {
                        messages.push({
                            role: 'assistant',
                            content: content
                        });
                    }
                } else if (!msg.author.bot) {
                    // Message de l'utilisateur
                    const content = msg.content.replace(`<@${client.user.id}>`, '').trim();
                    if (content && msg.id !== message.id) {
                        messages.push({
                            role: 'user',
                            content: content
                        });
                    }
                }
            }

            // Ajouter le nouveau message de l'utilisateur
            messages.push({
                role: 'user',
                content: message.content
            });
        } else {
            // Première interaction
            messages.push({
                role: 'user',
                content: message.content.replace(`<@${client.user.id}>`, '').trim()
            });
        }

        // Appel à l'API DeepSeek
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const aiResponse = response.data.choices[0].message.content;

        // Utiliser le thread existant ou en créer un nouveau
        let thread = existingThread;
        if (!thread) {
            thread = await message.startThread({
                name: `Discussion avec ${message.author.username}`,
                autoArchiveDuration: 60,
                reason: 'Conversation avec l\'IA'
            });
        }

        // Créer les boutons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('restart')
                    .setLabel('🔄 Recommencer')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('detail')
                    .setLabel('📝 Détailler')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Extraire et gérer les blocs de code longs
        const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
        let processedResponse = aiResponse;
        const attachments = [];
        let match;
        let blockIndex = 0;

        while ((match = codeBlockRegex.exec(aiResponse)) !== null) {
            const language = match[1] || 'txt';
            const codeContent = match[2];
            const fullBlock = match[0]; // Le bloc complet avec les ```

            // Si le bloc de code risque de dépasser un embed (3500 chars = sécurité pour limite 4096)
            // Alors on le met dans un fichier pour éviter qu'il soit coupé en 2 embeds
            if (fullBlock.length > 3500) {
                blockIndex++;
                const extensions = {
                    'javascript': 'js',
                    'typescript': 'ts',
                    'python': 'py',
                    'json': 'json',
                    'html': 'html',
                    'css': 'css',
                    'java': 'java',
                    'cpp': 'cpp',
                    'c': 'c',
                    'go': 'go',
                    'rust': 'rs',
                    'sql': 'sql',
                    'yaml': 'yml',
                    'xml': 'xml',
                    'markdown': 'md',
                    'sh': 'sh',
                    'bash': 'sh'
                };

                const ext = extensions[language.toLowerCase()] || 'txt';
                const fileName = `code_${blockIndex}.${ext}`;

                const attachment = new AttachmentBuilder(Buffer.from(codeContent, 'utf-8'), {
                    name: fileName
                });
                attachments.push(attachment);

                // Remplacer le bloc de code par une référence au fichier
                processedResponse = processedResponse.replace(
                    fullBlock,
                    `📎 **Code complet disponible dans le fichier joint :** \`${fileName}\``
                );
            }
        }

        // Diviser la réponse si elle dépasse 4096 caractères (limite description embed)
        const maxLength = 4096;
        let sentMessage;

        if (processedResponse.length <= maxLength) {
            const embed = new EmbedBuilder()
                .setDescription(processedResponse)
                .setColor(Colors.Blue);

            const messageOptions = { embeds: [embed], components: [row] };
            if (attachments.length > 0) {
                messageOptions.files = attachments;
            }

            sentMessage = await thread.send(messageOptions);
        } else {
            // Découpage intelligent en respectant les blocs de code
            const chunks = [];
            const parts = processedResponse.split(/(```[\s\S]*?```)/g); // Séparer texte et code

            let currentChunk = '';

            for (const part of parts) {
                // C'est un bloc de code
                if (part.startsWith('```')) {
                    // Si le chunk actuel + le code dépasse la limite
                    if (currentChunk && (currentChunk + part).length > maxLength) {
                        // Enregistrer le chunk actuel
                        if (currentChunk.trim()) {
                            chunks.push(currentChunk.trim());
                        }

                        // Le code va dans son propre chunk
                        if (part.length > maxLength) {
                            // Code trop long même pour un seul embed, découper par lignes
                            const codeLines = part.split('\n');
                            let codeChunk = codeLines[0] + '\n'; // Commence avec ```lang

                            for (let i = 1; i < codeLines.length - 1; i++) {
                                if ((codeChunk + codeLines[i] + '\n```').length > maxLength) {
                                    chunks.push(codeChunk + '```');
                                    codeChunk = '```\n' + codeLines[i] + '\n';
                                } else {
                                    codeChunk += codeLines[i] + '\n';
                                }
                            }
                            codeChunk += '```';
                            chunks.push(codeChunk);
                        } else {
                            chunks.push(part);
                        }
                        currentChunk = '';
                    } else {
                        // Ajouter le code au chunk actuel
                        currentChunk += part;
                    }
                } else {
                    // C'est du texte normal
                    const lines = part.split('\n');
                    for (const line of lines) {
                        if ((currentChunk + line + '\n').length > maxLength) {
                            if (currentChunk.trim()) {
                                chunks.push(currentChunk.trim());
                            }
                            currentChunk = line + '\n';
                        } else {
                            currentChunk += line + '\n';
                        }
                    }
                }
            }

            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }

            // Envoyer tous les chunks dans des embeds
            for (let i = 0; i < chunks.length; i++) {
                const embed = new EmbedBuilder()
                    .setDescription(chunks[i])
                    .setColor(Colors.Blue);

                // Ajouter les boutons et fichiers seulement au dernier message
                if (i === chunks.length - 1) {
                    const messageOptions = { embeds: [embed], components: [row] };
                    if (attachments.length > 0) {
                        messageOptions.files = attachments;
                    }
                    sentMessage = await thread.send(messageOptions);
                } else {
                    await thread.send({ embeds: [embed] });
                }
            }
        }

        // Créer le collector pour les boutons (5 minutes)
        const collector = sentMessage.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async i => {
            if (i.customId === 'restart') {
                await i.deferUpdate();
                await thread.sendTyping();

                try {
                    // Refaire la requête à DeepSeek
                    const restartResponse = await axios.post('https://api.deepseek.com/v1/chat/completions', {
                        model: 'deepseek-chat',
                        messages: [
                            {
                                role: 'system',
                                content: systemPrompt
                            },
                            {
                                role: 'user',
                                content: message.content.replace(`<@${client.user.id}>`, '').trim()
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 1000
                    }, {
                        headers: {
                            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const newResponse = restartResponse.data.choices[0].message.content;
                    const newEmbed = new EmbedBuilder()
                        .setDescription(newResponse.length > 4096 ? newResponse.substring(0, 4093) + '...' : newResponse)
                        .setColor(Colors.Blue);

                    await sentMessage.edit({ embeds: [newEmbed], components: [row] });
                } catch (error) {
                    console.error('Erreur lors du recommencement:', error);
                    await i.followUp({ content: '❌ Erreur lors de la régénération.', ephemeral: true });
                }

            } else if (i.customId === 'detail') {
                await i.deferReply();
                await thread.sendTyping();

                try {
                    // Demander plus de détails
                    const detailResponse = await axios.post('https://api.deepseek.com/v1/chat/completions', {
                        model: 'deepseek-chat',
                        messages: [
                            {
                                role: 'system',
                                content: systemPrompt
                            },
                            {
                                role: 'user',
                                content: message.content.replace(`<@${client.user.id}>`, '').trim()
                            },
                            {
                                role: 'assistant',
                                content: aiResponse
                            },
                            {
                                role: 'user',
                                content: 'Peux-tu détailler davantage ta réponse et apporter plus de précisions ?'
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 1500
                    }, {
                        headers: {
                            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const detailedResponse = detailResponse.data.choices[0].message.content;
                    const detailEmbed = new EmbedBuilder()
                        .setDescription(detailedResponse.length > 4096 ? detailedResponse.substring(0, 4093) + '...' : detailedResponse)
                        .setColor(Colors.Blue)
                        .setTitle('📝 Réponse détaillée');

                    await i.editReply({ embeds: [detailEmbed] });
                } catch (error) {
                    console.error('Erreur lors de la demande de détails:', error);
                    await i.editReply({ content: '❌ Erreur lors de la génération des détails.' });
                }
            }
        });

        collector.on('end', () => {
            // Désactiver les boutons après 5 minutes
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('restart')
                        .setLabel('🔄 Recommencer')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('detail')
                        .setLabel('📝 Détailler')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
            sentMessage.edit({ components: [disabledRow] }).catch(() => { });
        });

    } catch (error) {
        console.error('Erreur lors de la requête DeepSeek:', error.response?.data || error.message);
        await message.reply('❌ Une erreur est survenue lors du traitement de votre demande.');
    }
};