import axios from 'axios';
import pool from '../config/database.js';

export const importWorkflow = async (req, res) => {
  try {
    const { workflow } = req.body;
    const userId = req.user.id;

    console.log('🔄 Import workflow request received for user:', userId);
    console.log('📦 Workflow data:', JSON.stringify(workflow).substring(0, 200));

    if (!workflow || !workflow.nodes) {
      console.error('❌ Invalid workflow structure - missing nodes');
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow structure - workflow must have nodes'
      });
    }

    // Get user's N8N instance
    const instances = await pool.query(
      'SELECT * FROM instances WHERE user_id = ? AND status = "running"',
      [userId]
    );

    if (instances.length === 0) {
      console.error('❌ No active N8N instance found for user:', userId);
      return res.status(404).json({
        success: false,
        message: 'No active N8N instance found. Please create an instance first.'
      });
    }

    const instance = instances[0];
    console.log('✅ Found instance:', instance.container_name);
    console.log('🔐 N8N credentials - Username:', instance.n8n_username, 'Password exists:', !!instance.n8n_password);

    // Get user's API key for N8N authentication
    const apiKeys = await pool.query(
      'SELECT api_key FROM api_keys WHERE user_id = ? AND instance_id = ? LIMIT 1',
      [userId, instance.id]
    );

    if (apiKeys.length === 0) {
      console.error('❌ No API key found for this instance');
      return res.status(404).json({
        success: false,
        message: 'No API key found for your N8N instance. Please create one in the API Keys page.'
      });
    }

    const apiKey = apiKeys[0].api_key;
    console.log('🔑 Using API key for authentication');

    // Use container name since we're on the same Docker network
    // N8N containers listen on port 5678 internally
    const n8nApiUrl = `http://${instance.container_name}:5678/api/v1/workflows`;
    console.log('🌐 N8N API URL:', n8nApiUrl);

    // Import workflow to N8N instance with API key
    const response = await axios.post(
      n8nApiUrl,
      workflow,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': apiKey
        },
        timeout: 10000 // 10 seconds timeout
      }
    );

    const importedWorkflow = response.data;
    console.log('✅ Workflow imported successfully:', importedWorkflow.id);

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
    console.error('❌ Error importing workflow:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    
    let errorMessage = 'Error importing workflow to N8N';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to N8N instance - container may not be running';
    } else if (error.response?.status === 401) {
      errorMessage = 'N8N authentication failed - invalid credentials';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid workflow format - ' + (error.response?.data?.message || 'check workflow structure');
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      details: error.response?.data || error.message
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
    
    // Get user's API key for N8N authentication
    const apiKeys = await pool.query(
      'SELECT api_key FROM api_keys WHERE user_id = ? AND instance_id = ? LIMIT 1',
      [userId, instance.id]
    );

    if (apiKeys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No API key found for your N8N instance'
      });
    }

    const apiKey = apiKeys[0].api_key;
    
    // Use container name since we're on the same Docker network
    // N8N containers listen on port 5678 internally
    const n8nApiUrl = `http://${instance.container_name}:5678/api/v1/workflows`;

    // Fetch workflows from N8N instance with API key
    const response = await axios.get(n8nApiUrl, {
      headers: {
        'X-N8N-API-KEY': apiKey
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
