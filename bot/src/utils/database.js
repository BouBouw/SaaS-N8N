import { v4 as uuidv4 } from 'uuid';

export class Database {
    constructor(pool) {
        this.pool = pool;
    }

    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    // Vérifier si un Discord ID est déjà lié
    async isDiscordLinked(discordId) {
        const rows = await this.query(
            'SELECT * FROM discord_links WHERE discord_id = ?',
            [discordId]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    // Lier un compte Discord à un compte utilisateur
    async linkDiscordAccount(userId, discordId, discordUsername) {
        const id = uuidv4();
        await this.query(
            'INSERT INTO discord_links (id, user_id, discord_id, discord_username) VALUES (?, ?, ?, ?)',
            [id, userId, discordId, discordUsername]
        );
        return id;
    }

    // Obtenir l'utilisateur lié à un Discord ID
    async getUserByDiscordId(discordId) {
        const rows = await this.query(`
            SELECT u.*, dl.discord_username 
            FROM users u
            INNER JOIN discord_links dl ON u.id = dl.user_id
            WHERE dl.discord_id = ?
        `, [discordId]);
        return rows.length > 0 ? rows[0] : null;
    }

    // Obtenir les workflows d'un utilisateur
    async getUserWorkflows(userId, limit = 1, offset = 0) {
        const rows = await this.query(`
            SELECT * FROM public_workflows
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `, [userId]);
        return rows;
    }

    // Compter les workflows d'un utilisateur
    async countUserWorkflows(userId) {
        const rows = await this.query(
            'SELECT COUNT(*) as count FROM public_workflows WHERE user_id = ?',
            [userId]
        );
        return rows[0].count;
    }

    // Obtenir les workflows favoris d'un utilisateur
    async getUserFavorites(userId, limit = 1, offset = 0) {
        const rows = await this.query(`
            SELECT pw.* FROM public_workflows pw
            INNER JOIN favorites f ON pw.id = f.workflow_id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `, [userId]);
        return rows;
    }

    // Compter les favoris d'un utilisateur
    async countUserFavorites(userId) {
        const rows = await this.query(`
            SELECT COUNT(*) as count FROM favorites WHERE user_id = ?
        `, [userId]);
        return rows[0].count;
    }

    // Obtenir les instances d'un utilisateur
    async getUserInstances(userId) {
        const rows = await this.query(`
            SELECT * FROM instances
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);
        return rows;
    }

    // Vérifier si un token de liaison est valide
    async validateLinkToken(token) {
        const rows = await this.query(
            'SELECT * FROM users WHERE email = ?',
            [token]
        );
        return rows.length > 0 ? rows[0] : null;
    }
}
