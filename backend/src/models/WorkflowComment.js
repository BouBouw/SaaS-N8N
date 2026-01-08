import pool from '../config/database.js';

/**
 * Add a comment to a workflow
 */
export const addComment = async (instanceId, workflowId, workflowName, userId, comment, parentId = null) => {
  const [result] = await pool.execute(
    `INSERT INTO workflow_comments (instance_id, workflow_id, workflow_name, user_id, comment, parent_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [instanceId, workflowId, workflowName, userId, comment, parentId]
  );
  return result.insertId;
};

/**
 * Get comments for a workflow
 */
export const getWorkflowComments = async (instanceId, workflowId) => {
  const [rows] = await pool.execute(
    `SELECT 
      wc.id,
      wc.workflow_id,
      wc.workflow_name,
      wc.comment,
      wc.parent_id,
      wc.created_at,
      wc.updated_at,
      u.id as user_id,
      u.name as user_name,
      u.email as user_email
     FROM workflow_comments wc
     JOIN users u ON wc.user_id = u.id
     WHERE wc.instance_id = ? AND wc.workflow_id = ?
     ORDER BY wc.created_at ASC`,
    [instanceId, workflowId]
  );
  return rows;
};

/**
 * Get all comments for an instance (grouped by workflow)
 */
export const getInstanceComments = async (instanceId) => {
  const [rows] = await pool.execute(
    `SELECT 
      wc.id,
      wc.workflow_id,
      wc.workflow_name,
      wc.comment,
      wc.parent_id,
      wc.created_at,
      wc.updated_at,
      u.id as user_id,
      u.name as user_name,
      u.email as user_email
     FROM workflow_comments wc
     JOIN users u ON wc.user_id = u.id
     WHERE wc.instance_id = ?
     ORDER BY wc.workflow_id, wc.created_at ASC`,
    [instanceId]
  );
  return rows;
};

/**
 * Update a comment
 */
export const updateComment = async (commentId, newComment) => {
  await pool.execute(
    `UPDATE workflow_comments SET comment = ? WHERE id = ?`,
    [newComment, commentId]
  );
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId) => {
  await pool.execute(
    `DELETE FROM workflow_comments WHERE id = ?`,
    [commentId]
  );
};

/**
 * Get comment by ID
 */
export const getCommentById = async (commentId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM workflow_comments WHERE id = ?`,
    [commentId]
  );
  return rows[0];
};

/**
 * Get recent comments for an instance
 */
export const getRecentComments = async (instanceId, limit = 10) => {
  const [rows] = await pool.execute(
    `SELECT 
      wc.id,
      wc.workflow_id,
      wc.workflow_name,
      wc.comment,
      wc.created_at,
      u.name as user_name
     FROM workflow_comments wc
     JOIN users u ON wc.user_id = u.id
     WHERE wc.instance_id = ?
     ORDER BY wc.created_at DESC
     LIMIT ?`,
    [instanceId, limit]
  );
  return rows;
};

export default {
  addComment,
  getWorkflowComments,
  getInstanceComments,
  updateComment,
  deleteComment,
  getCommentById,
  getRecentComments
};
