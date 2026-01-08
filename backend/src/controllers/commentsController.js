import * as WorkflowComment from '../models/WorkflowComment.js';
import * as Instance from '../models/Instance.js';
import * as TeamMember from '../models/TeamMember.js';

/**
 * Add a comment to a workflow
 */
export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workflowId, workflowName, comment, parentId } = req.body;

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

    const commentId = await WorkflowComment.addComment(
      instance.id,
      workflowId,
      workflowName,
      userId,
      comment,
      parentId || null
    );

    res.json({
      success: true,
      data: { commentId }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get comments for a workflow
 */
export const getWorkflowComments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workflowId } = req.params;

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

    const comments = await WorkflowComment.getWorkflowComments(instance.id, workflowId);

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all comments for instance
 */
export const getAllComments = async (req, res) => {
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

    const comments = await WorkflowComment.getInstanceComments(instance.id);

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error getting all comments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update a comment
 */
export const updateComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const { comment } = req.body;

    // Get comment
    const existingComment = await WorkflowComment.getCommentById(commentId);
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (existingComment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own comments'
      });
    }

    await WorkflowComment.updateComment(commentId, comment);

    res.json({
      success: true,
      message: 'Comment updated successfully'
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    // Get comment
    const existingComment = await WorkflowComment.getCommentById(commentId);
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user owns the comment or is admin/owner
    const canManage = await TeamMember.canManageTeam(existingComment.instance_id, userId);
    if (existingComment.user_id !== userId && !canManage) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }

    await WorkflowComment.deleteComment(commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get recent comments
 */
export const getRecentComments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

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

    const comments = await WorkflowComment.getRecentComments(instance.id, parseInt(limit));

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error getting recent comments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  addComment,
  getWorkflowComments,
  getAllComments,
  updateComment,
  deleteComment,
  getRecentComments
};
