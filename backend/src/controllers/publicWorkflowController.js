import * as PublicWorkflow from '../models/PublicWorkflow.js';
import { importWorkflow as importToN8N } from './workflowController.js';

export const createPublicWorkflow = async (req, res) => {
  try {
    const { name, description, workflow } = req.body;
    const userId = req.user.id;

    if (!name || !workflow) {
      return res.status(400).json({
        success: false,
        message: 'Name and workflow are required'
      });
    }

    const workflowId = await PublicWorkflow.create(
      userId,
      name,
      description || '',
      workflow
    );

    res.status(201).json({
      success: true,
      data: {
        id: workflowId,
        message: 'Workflow published successfully'
      }
    });

  } catch (error) {
    console.error('Error creating public workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing workflow'
    });
  }
};

export const getPublicWorkflows = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const userId = req.user?.id; // Get user ID if authenticated

    const workflows = await PublicWorkflow.findAll(limit, offset, userId);

    res.json({
      success: true,
      data: workflows
    });

  } catch (error) {
    console.error('Error fetching public workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflows'
    });
  }
};

export const getPublicWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await PublicWorkflow.findById(id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('Error fetching public workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflow'
    });
  }
};

export const usePublicWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await PublicWorkflow.findById(id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    // Import the workflow to user's instance
    req.body.workflow = workflow.workflow_json;
    await importToN8N(req, res);

    // Increment download counter
    await PublicWorkflow.incrementDownloads(id);

  } catch (error) {
    console.error('Error using public workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing workflow'
    });
  }
};

export const deletePublicWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await PublicWorkflow.deleteWorkflow(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found or you are not authorized to delete it'
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting public workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting workflow'
    });
  }
};

export default {
  createPublicWorkflow,
  getPublicWorkflows,
  getPublicWorkflow,
  usePublicWorkflow,
  deletePublicWorkflow
};
