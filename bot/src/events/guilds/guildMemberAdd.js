import { AttachmentBuilder, EmbedBuilder, Colors } from 'discord.js';
import Canvas from 'canvas';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    name: 'guildMemberAdd',
    once: false,
    execute: async (member) => {
        const channel = member.guild.channels.cache.get('1458599729729507379');
        if (!channel) return;

        const backgroundPath = join(__dirname, '../../../handlers/assets/welcome_card.png');
        try {
            const background = await Canvas.loadImage(backgroundPath);

            const canvas = Canvas.createCanvas(background.width, background.height);
            const ctx = canvas.getContext('2d');
    
            // Draw background
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
            // Avatar configuration
            const avatarRadius = 80;
            const avatarX = 50; // Avatar à gauche
            const avatarY = (canvas.height / 2) - avatarRadius;
            
            // Text configuration
            const textX = avatarX + (avatarRadius * 2) + 40; // Texte décalé à droite de l'avatar

            // Bienvenue
            ctx.font = 'bold 60px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText('Bienvenue', textX, canvas.height / 2 - 20);
    
            // Username
            ctx.font = 'bold 40px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(member.user.username, textX, canvas.height / 2 + 30);
    
            // Guild name
            ctx.font = '30px sans-serif';
            ctx.fillStyle = '#cccccc';
            ctx.fillText(`Sur ${member.guild.name}`, textX, canvas.height / 2 + 70);
    
            // Avatar Circulaire à gauche
            
            ctx.beginPath();
            ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
    
            const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 512 });
            const avatar = await Canvas.loadImage(avatarURL);
            ctx.drawImage(avatar, avatarX, avatarY, avatarRadius * 2, avatarRadius * 2);
    
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-image.png' });

            const custom = [
                "Oh ! Un nouveau membre !",
                "Un sauvage apparaît !",
                "Faites place, légende en approche !",
                "Hissez les voiles !",
                "Un nouveau challenger entre dans l'arène !",
                "Toc toc ! Qui est là ?",
                "Les renforts sont arrivés !",
                "Quelqu'un a commandé une pizza ?",
                "Glisse dans le serveur avec style.",
                "Préparez les confettis !",
                "Bienvenue dans la matrice.",
                "Un nouvel aventurier rejoint la guilde !",
                "Attention, ça va chauffer !",
                "C'est un oiseau ? C'est un avion ? Non, c'est..."
            ];

            const randomTitle = custom[Math.floor(Math.random() * custom.length)];

            const embed = new EmbedBuilder()
                .setTitle(randomTitle)
                .setImage('attachment://welcome-image.png')
                .setColor(Colors.Default);
    
            channel.send({ 
                content: `Bienvenue ${member} !`, 
                embeds: [embed],
                files: [attachment] 
            });

        } catch (error) {
            console.error('Erreur lors de la création de l\'image de bienvenue :', error);
        }
    }
};