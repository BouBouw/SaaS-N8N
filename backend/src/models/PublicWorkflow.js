import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const create = async (userId, name, description, workflow) => {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO public_workflows (id, user_id, name, description, workflow_json, created_at) 
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [id, userId, name, description, JSON.stringify(workflow)]
  );
  return id;
};

export const findAll = async (limit = 50, offset = 0, userId = null) => {
  // Ensure limit and offset are valid integers
  const validLimit = Math.max(1, Math.min(parseInt(limit, 10) || 50, 100));
  const validOffset = Math.max(0, parseInt(offset, 10) || 0);
  
  // Use literal values instead of parameters for LIMIT/OFFSET (MySQL 8.0 compatibility)
  let sql = `SELECT 
      pw.*,
      u.name as author_name,
      u.email as author_email,
      (SELECT COUNT(*) FROM favorites WHERE workflow_id = pw.id) as favorites_count`;
  
  if (userId) {
    sql += `,
      CASE WHEN f.workflow_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite`;
  }
  
  sql += `
     FROM public_workflows pw
     JOIN users u ON pw.user_id = u.id`;
  
  if (userId) {
    sql += `
     LEFT JOIN favorites f ON f.workflow_id = pw.id AND f.user_id = '${userId}'`;
  }
  
  sql += `
     ORDER BY pw.created_at DESC
     LIMIT ${validLimit} OFFSET ${validOffset}`;
  
  const workflows = await query(sql, []);
  
  return workflows.map(wf => ({
    ...wf,
    is_favorite: wf.is_favorite === 1,
    workflow_json: typeof wf.workflow_json === 'string' ? JSON.parse(wf.workflow_json) : wf.workflow_json
  }));
};

export const findById = async (id) => {
  const workflows = await query(
    `SELECT 
      pw.*,
      u.name as author_name,
      u.email as author_email
     FROM public_workflows pw
     JOIN users u ON pw.user_id = u.id
     WHERE pw.id = ?`,
    [id]
  );
  
  if (workflows.length === 0) return null;
  
  const workflow = workflows[0];
  return {
    ...workflow,
    workflow_json: typeof workflow.workflow_json === 'string' ? JSON.parse(workflow.workflow_json) : workflow.workflow_json
  };
};

export const incrementDownloads = async (id) => {
  await query(
    'UPDATE public_workflows SET downloads = downloads + 1 WHERE id = ?',
    [id]
  );
};

export const deleteWorkflow = async (id, userId) => {
  const result = await query(
    'DELETE FROM public_workflows WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
};

export const findByUserId = async (userId) => {
  const workflows = await query(
    `SELECT * FROM public_workflows 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [userId]
  );
  
  return workflows.map(wf => ({
    ...wf,
    workflow_json: typeof wf.workflow_json === 'string' ? JSON.parse(wf.workflow_json) : wf.workflow_json
  }));
};

export default {
  create,
  findAll,
  findById,
  incrementDownloads,
  deleteWorkflow,
  findByUserId
};
