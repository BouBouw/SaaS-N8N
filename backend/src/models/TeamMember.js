import { query } from '../config/database.js';

/**
 * Add a team member to an instance
 */
export const addTeamMember = async (instanceId, userId, role, invitedBy) => {
  const result = await query(
    `INSERT INTO team_members (instance_id, user_id, role, invited_by, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [instanceId, userId, role, invitedBy]
  );
  return result.insertId;
};

/**
 * Get all team members for an instance
 */
export const getTeamMembers = async (instanceId) => {
  const rows = await query(
    `SELECT 
      tm.id,
      tm.role,
      tm.status,
      tm.invited_at,
      tm.joined_at,
      u.id as user_id,
      u.name as user_name,
      u.email as user_email,
      inviter.name as invited_by_name
     FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     JOIN users inviter ON tm.invited_by = inviter.id
     WHERE tm.instance_id = ?
     ORDER BY tm.joined_at DESC, tm.invited_at DESC`,
    [instanceId]
  );
  return rows;
};

/**
 * Get user's role in an instance
 */
export const getUserRole = async (instanceId, userId) => {
  const rows = await query(
    `SELECT role FROM team_members 
     WHERE instance_id = ? AND user_id = ? AND status = 'active'`,
    [instanceId, userId]
  );
  return rows[0]?.role || null;
};

/**
 * Check if user has access to instance
 */
export const hasAccess = async (instanceId, userId) => {
  const rows = await query(
    `SELECT COUNT(*) as count FROM team_members 
     WHERE instance_id = ? AND user_id = ? AND status = 'active'`,
    [instanceId, userId]
  );
  return rows[0].count > 0;
};

/**
 * Check if user is owner of instance
 */
export const isOwner = async (instanceId, userId) => {
  const role = await getUserRole(instanceId, userId);
  return role === 'owner';
};

/**
 * Check if user can manage team (owner or admin)
 */
export const canManageTeam = async (instanceId, userId) => {
  const role = await getUserRole(instanceId, userId);
  return role === 'owner' || role === 'admin';
};

/**
 * Update team member role
 */
export const updateMemberRole = async (memberId, role) => {
  await query(
    `UPDATE team_members SET role = ? WHERE id = ?`,
    [role, memberId]
  );
};

/**
 * Accept invitation
 */
export const acceptInvitation = async (memberId) => {
  await query(
    `UPDATE team_members SET status = 'active', joined_at = NOW() WHERE id = ?`,
    [memberId]
  );
};

/**
 * Decline invitation
 */
export const declineInvitation = async (memberId) => {
  await query(
    `UPDATE team_members SET status = 'declined' WHERE id = ?`,
    [memberId]
  );
};

/**
 * Remove team member
 */
export const removeMember = async (memberId) => {
  await query(
    `DELETE FROM team_members WHERE id = ?`,
    [memberId]
  );
};

/**
 * Get pending invitations for a user
 */
export const getPendingInvitations = async (userId) => {
  const rows = await query(
    `SELECT 
      tm.id,
      tm.role,
      tm.invited_at,
      i.subdomain,
      i.port,
      inviter.name as invited_by_name,
      inviter.email as invited_by_email
     FROM team_members tm
     JOIN instances i ON tm.instance_id = i.id
     JOIN users inviter ON tm.invited_by = inviter.id
     WHERE tm.user_id = ? AND tm.status = 'pending'
     ORDER BY tm.invited_at DESC`,
    [userId]
  );
  return rows;
};

/**
 * Get instances where user is a team member
 */
export const getUserInstances = async (userId) => {
  const rows = await query(
    `SELECT 
      i.id,
      i.subdomain,
      i.port,
      i.status,
      i.created_at,
      tm.role,
      tm.joined_at
     FROM team_members tm
     JOIN instances i ON tm.instance_id = i.id
     WHERE tm.user_id = ? AND tm.status = 'active'
     ORDER BY tm.joined_at DESC`,
    [userId]
  );
  return rows;
};

export default {
  addTeamMember,
  getTeamMembers,
  getUserRole,
  hasAccess,
  isOwner,
  canManageTeam,
  updateMemberRole,
  acceptInvitation,
  declineInvitation,
  removeMember,
  getPendingInvitations,
  getUserInstances
};
