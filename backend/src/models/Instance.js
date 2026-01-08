import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const createInstance = async (userId, subdomain, containerId, containerName, port) => {
  const id = uuidv4();
  const sql = `
    INSERT INTO instances (id, user_id, subdomain, container_id, container_name, port, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'running', NOW(), NOW())
  `;
  await query(sql, [id, userId, subdomain, containerId, containerName, port]);
  return id;
};

export const findInstanceByUserId = async (userId) => {
  const sql = 'SELECT * FROM instances WHERE user_id = ?';
  const results = await query(sql, [userId]);
  return results[0] || null;
};

export const findInstanceById = async (id) => {
  const sql = 'SELECT * FROM instances WHERE id = ?';
  const results = await query(sql, [id]);
  return results[0] || null;
};

export const findInstanceBySubdomain = async (subdomain) => {
  const sql = 'SELECT * FROM instances WHERE subdomain = ?';
  const results = await query(sql, [subdomain]);
  return results[0] || null;
};

export const updateInstanceStatus = async (id, status) => {
  const sql = 'UPDATE instances SET status = ?, updated_at = NOW() WHERE id = ?';
  await query(sql, [status, id]);
};

export const deleteInstance = async (id) => {
  const sql = 'DELETE FROM instances WHERE id = ?';
  await query(sql, [id]);
};

export const getAllInstances = async () => {
  const sql = 'SELECT * FROM instances ORDER BY created_at DESC';
  return await query(sql);
};

export const getNextAvailablePort = async () => {
  const sql = 'SELECT MAX(port) as maxPort FROM instances';
  const results = await query(sql);
  const basePort = parseInt(process.env.N8N_BASE_PORT) || 5678;
  return results[0]?.maxPort ? results[0].maxPort + 1 : basePort;
};

export default {
  createInstance,
  findInstanceByUserId,
  findInstanceById,
  findInstanceBySubdomain,
  updateInstanceStatus,
  deleteInstance,
  getAllInstances,
  getNextAvailablePort
};
