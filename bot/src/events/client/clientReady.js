import { ActivityType } from 'discord.js';

export default {
    name: 'clientReady',
    once: false,
    execute: async (client, pool) => {
        console.log('[API] '.green + `Connected to Discord.`.white);

        const keys = [
            `+${client.users.cache.size} membres`,
            "https://boubouw.com",
            "N8N - Plateforme d'automatisation",
        ];

        let i = 0;
        setInterval(() => {
            if (i >= keys.length) i = 0;
            client.user.setActivity(keys[i], { type: ActivityType.Watching });
            i++;
        }, 10 * 1000);

    }
};