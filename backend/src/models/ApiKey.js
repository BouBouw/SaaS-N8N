import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { hashApiKey, encryptApiKey, decryptApiKey } from '../utils/apiKey.js';
import crypto from 'crypto';

export const createApiKey = async (userId, name) => {
  const id = uuidv4();
  const apiKey = crypto.randomBytes(32).toString('hex');
  const hashedKey = hashApiKey(apiKey);
  const encryptedKey = encryptApiKey(apiKey);
  
  const sql = `
    INSERT INTO api_keys (id, user_id, name, api_key, encrypted_key, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  await query(sql, [id, userId, name, hashedKey, encryptedKey]);
  
  // Return the plain API key only once (it won't be stored)
  return { id, apiKey, name };
};

export const findApiKeyByUserId = async (userId) => {
  const sql = 'SELECT id, user_id, name, created_at FROM api_keys WHERE user_id = ?';
  const results = await query(sql, [userId]);
  return results;
};

export const findApiKeyById = async (id, userId) => {
  const sql = 'SELECT id, user_id, name, encrypted_key, created_at FROM api_keys WHERE id = ? AND user_id = ?';
  const results = await query(sql, [id, userId]);
  return results[0] || null;
};

export const revealApiKey = async (id, userId) => {
  const apiKeyRecord = await findApiKeyById(id, userId);
  if (!apiKeyRecord) {
    throw new Error('API key not found');
  }
  const decryptedKey = decryptApiKey(apiKeyRecord.encrypted_key);
  return decryptedKey;
};

export const findUserByApiKey = async (apiKey) => {
  const hashedKey = hashApiKey(apiKey);
  const sql = `
    SELECT u.* FROM users u
    JOIN api_keys a ON u.id = a.user_id
    WHERE a.api_key = ?
  `;
  const results = await query(sql, [hashedKey]);
  return results[0] || null;
};

export const deleteApiKey = async (id, userId) => {
  const sql = 'DELETE FROM api_keys WHERE id = ? AND user_id = ?';
  await query(sql, [id, userId]);
};

export default {
  createApiKey,
  findApiKeyByUserId,
  findApiKeyById,
  revealApiKey,
  findUserByApiKey,
  deleteApiKey
};
