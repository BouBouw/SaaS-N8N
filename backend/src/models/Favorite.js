import { query } from '../config/database.js';

export const addFavorite = async (userId, workflowId) => {
  try {
    await query(
      'INSERT INTO favorites (user_id, workflow_id) VALUES (?, ?)',
      [userId, workflowId]
    );
    return true;
  } catch (error) {
    // Duplicate key error (already favorited)
    if (error.code === 'ER_DUP_ENTRY') {
      return false;
    }
    throw error;
  }
};

export const removeFavorite = async (userId, workflowId) => {
  const result = await query(
    'DELETE FROM favorites WHERE user_id = ? AND workflow_id = ?',
    [userId, workflowId]
  );
  return result.affectedRows > 0;
};

export const isFavorite = async (userId, workflowId) => {
  const results = await query(
    'SELECT 1 FROM favorites WHERE user_id = ? AND workflow_id = ? LIMIT 1',
    [userId, workflowId]
  );
  return results.length > 0;
};

export const getUserFavorites = async (userId) => {
  const favorites = await query(
    `SELECT 
      pw.*,
      u.name as author_name,
      u.email as author_email,
      f.created_at as favorited_at,
      true as is_favorite
     FROM favorites f
     JOIN public_workflows pw ON f.workflow_id = pw.id
     JOIN users u ON pw.user_id = u.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  );
  
  return favorites.map(wf => ({
    ...wf,
    workflow_json: typeof wf.workflow_json === 'string' ? JSON.parse(wf.workflow_json) : wf.workflow_json
  }));
};

export default {
  addFavorite,
  removeFavorite,
  isFavorite,
  getUserFavorites
};
