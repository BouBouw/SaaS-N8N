import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const createUser = async (email, hashedPassword, name) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO users (id, email, password, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `;
  await query(sql, [id, email, hashedPassword, name]);
  return id;
};

export const findUserByEmail = async (email) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const results = await query(sql, [email]);
  return results[0] || null;
};

export const findUserById = async (id) => {
  const sql = 'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?';
  const results = await query(sql, [id]);
  return results[0] || null;
};

export const findAllUsers = async () => {
  const sql = `
    SELECT 
      u.id, 
      u.email, 
      u.name,
      u.role,
      u.created_at,
      i.subdomain,
      i.status as instance_status,
      (SELECT COUNT(*) FROM api_keys WHERE user_id = u.id) as api_keys_count
    FROM users u
    LEFT JOIN instances i ON u.id = i.user_id
    ORDER BY u.created_at DESC
  `;
  const results = await query(sql);
  return results;
};

export const updateUserRole = async (id, role) => {
  if (!['user', 'admin'].includes(role)) {
    throw new Error('Rôle invalide');
  }
  const sql = 'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?';
  await query(sql, [role, id]);
};

export const updateUser = async (id, updates) => {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  const sql = `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = ?`;
  await query(sql, values);
};

export const deleteUser = async (id) => {
  const sql = 'DELETE FROM users WHERE id = ?';
  await query(sql, [id]);
};

export default {
  createUser,
  findUserByEmail,
  findUserById,
  findAllUsers,
  updateUser,
  updateUserRole,
  deleteUser
};
