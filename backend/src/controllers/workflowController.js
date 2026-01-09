import axios from 'axios';
import pool from '../config/database.js';

export const importWorkflow = async (req, res) => {
  try {
    const { workflow } = req.body;
    const userId = req.user.id;

    if (!workflow || !workflow.nodes) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow structure'
      });
    }

    // Get user's N8N instance
    const instances = await pool.query(
      'SELECT * FROM instances WHERE user_id = ? AND status = "running"',
      [userId]
    );

    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active N8N instance found'
      });
    }

    const instance = instances[0];
    // Use container name since we're on the same Docker network
    // N8N containers listen on port 5678 internally
    const n8nApiUrl = `http://${instance.container_name}:5678/api/v1/workflows`;

    // Import workflow to N8N instance with basic auth
    const response = await axios.post(
      n8nApiUrl,
      workflow,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          username: instance.n8n_username || 'admin',
          password: instance.n8n_password
        },
        timeout: 10000 // 10 seconds timeout
      }
    );

    const importedWorkflow = response.data;

    // Build the public N8N URL for the editor
    const n8nPublicUrl = `https://${instance.subdomain}.${process.env.BASE_DOMAIN}`;

    res.json({
      success: true,
      data: {
        workflowId: importedWorkflow.id,
        workflowName: importedWorkflow.name,
        editorUrl: `${n8nPublicUrl}/workflow/${importedWorkflow.id}`
      }
    });

  } catch (error) {
    console.error('Error importing workflow:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error importing workflow to N8N',
      error: error.response?.data || error.message
    });
  }
};

export const getInstanceWorkflows = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's N8N instance
    const instances = await pool.query(
      'SELECT * FROM instances WHERE user_id = ? AND status = "running"',
      [userId]
    );

    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active N8N instance found'
      });
    }

    const instance = instances[0];
    // Use container name since we're on the same Docker network
    // N8N containers listen on port 5678 internally
    const n8nApiUrl = `http://${instance.container_name}:5678/api/v1/workflows`;

    // Fetch workflows from N8N instance with basic auth
    const response = await axios.get(n8nApiUrl, {
      auth: {
        username: instance.n8n_username || 'admin',
        password: instance.n8n_password
      },
      timeout: 10000 // 10 seconds timeout
    });

    const workflows = response.data.data || response.data;

    res.json({
      success: true,
      data: workflows.map(wf => ({
        id: wf.id,
        name: wf.name,
        active: wf.active,
        nodes: wf.nodes,
        connections: wf.connections,
        settings: wf.settings,
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt,
        workflow_json: wf
      }))
    });

  } catch (error) {
    console.error('Error fetching workflows:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflows from N8N',
      error: error.response?.data || error.message
    });
  }
};

export default {
  importWorkflow,
  getInstanceWorkflows
};
