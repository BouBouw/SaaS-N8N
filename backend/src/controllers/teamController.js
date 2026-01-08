import * as TeamMember from '../models/TeamMember.js';
import * as Instance from '../models/Instance.js';
import * as User from '../models/User.js';

/**
 * Invite a team member
 */
export const inviteMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, role = 'viewer' } = req.body;

    // Get user's instance
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found'
      });
    }

    // Check if user can manage team
    const canManage = await TeamMember.canManageTeam(instance.id, userId);
    if (!canManage) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied. Only owners and admins can invite members.'
      });
    }

    // Find user to invite by email
    const userToInvite = await User.findUserByEmail(email);
    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email'
      });
    }

    // Check if already a member
    const hasAccess = await TeamMember.hasAccess(instance.id, userToInvite.id);
    if (hasAccess) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member'
      });
    }

    // Add team member
    const memberId = await TeamMember.addTeamMember(
      instance.id,
      userToInvite.id,
      role,
      userId
    );

    res.json({
      success: true,
      data: { memberId, email, role }
    });
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get team members
 */
export const getMembers = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's instance
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found'
      });
    }

    // Check access
    const hasAccess = await TeamMember.hasAccess(instance.id, userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const members = await TeamMember.getTeamMembers(instance.id);

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error getting members:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update member role
 */
export const updateRole = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.params;
    const { role } = req.body;

    // Get user's instance
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found'
      });
    }

    // Only owner can change roles
    const isOwner = await TeamMember.isOwner(instance.id, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Only the owner can change roles'
      });
    }

    await TeamMember.updateMemberRole(memberId, role);

    res.json({
      success: true,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove team member
 */
export const removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.params;

    // Get user's instance
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found'
      });
    }

    // Check if user can manage team
    const canManage = await TeamMember.canManageTeam(instance.id, userId);
    if (!canManage) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }

    await TeamMember.removeMember(memberId);

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Accept invitation
 */
export const acceptInvitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.params;

    // Verify this invitation is for current user
    const invitations = await TeamMember.getPendingInvitations(userId);
    const invitation = invitations.find(inv => inv.id === parseInt(memberId));

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    await TeamMember.acceptInvitation(memberId);

    res.json({
      success: true,
      message: 'Invitation accepted'
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Decline invitation
 */
export const declineInvitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.params;

    // Verify this invitation is for current user
    const invitations = await TeamMember.getPendingInvitations(userId);
    const invitation = invitations.find(inv => inv.id === parseInt(memberId));

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    await TeamMember.declineInvitation(memberId);

    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get pending invitations
 */
export const getInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    const invitations = await TeamMember.getPendingInvitations(userId);

    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    console.error('Error getting invitations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  inviteMember,
  getMembers,
  updateRole,
  removeMember,
  acceptInvitation,
  declineInvitation,
  getInvitations
};
