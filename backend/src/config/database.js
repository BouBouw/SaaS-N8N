import mysql from 'mysql2/promise';
import config from './index.js';

let pool = null;

export const createPool = () => {
  if (!pool) {
    pool = mysql.createPool(config.db);
    console.log('✅ MySQL connection pool created');
  }
  return pool;
};

export const getConnection = async () => {
  if (!pool) {
    createPool();
  }
  return await pool.getConnection();
};

export const query = async (sql, params) => {
  if (!pool) {
    createPool();
  }
  const [results] = await pool.execute(sql, params);
  return results;
};

export default {
  createPool,
  getConnection,
  query
};
