import axios from 'axios';
import * as Instance from '../models/Instance.js';
import config from '../config/index.js';

// Get N8N API URL for user instance
const getN8nApiUrl = (subdomain, port) => {
  // For local development, use port directly
  return `http://localhost:${port}`;
};

export const getWorkflows = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's instance
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'No instance found for this user'
      });
    }

    if (instance.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: 'Instance is not running'
      });
    }

    // Call N8N API to get workflows
    const n8nUrl = getN8nApiUrl(instance.subdomain, instance.port);
    const response = await axios.get(`${n8nUrl}/api/v1/workflows`, {
      timeout: 5000
    });

    res.json({
      success: true,
      data: {
        workflows: response.data.data || response.data,
        instanceUrl: `https://${instance.subdomain}.${config.domain.base}`,
        count: response.data.data?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Cannot connect to N8N instance. Please ensure your instance is running.'
      });
    }

    res.status(500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch workflows'
    });
  }
};

export const getWorkflow = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workflowId } = req.params;
    
    // Get user's instance
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'No instance found for this user'
      });
    }

    if (instance.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: 'Instance is not running'
      });
    }

    // Call N8N API to get specific workflow
    const n8nUrl = getN8nApiUrl(instance.subdomain, instance.port);
    const response = await axios.get(`${n8nUrl}/api/v1/workflows/${workflowId}`, {
      timeout: 5000
    });

    res.json({
      success: true,
      data: response.data.data || response.data
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Cannot connect to N8N instance'
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch workflow'
    });
  }
};

export const exportWorkflows = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's instance
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'No instance found for this user'
      });
    }

    if (instance.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: 'Instance is not running'
      });
    }

    // Call N8N API to get all workflows
    const n8nUrl = getN8nApiUrl(instance.subdomain, instance.port);
    const response = await axios.get(`${n8nUrl}/api/v1/workflows`, {
      timeout: 5000
    });

    const workflows = response.data.data || response.data;

    // Create export data
    const exportData = {
      exportDate: new Date().toISOString(),
      instanceUrl: `https://${instance.subdomain}.${config.domain.base}`,
      workflowsCount: workflows.length,
      workflows: workflows
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="n8n-workflows-export-${Date.now()}.json"`);
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting workflows:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Cannot connect to N8N instance'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to export workflows'
    });
  }
};

export default {
  getWorkflows,
  getWorkflow,
  exportWorkflows
};
