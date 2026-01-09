import * as instanceService from '../services/instanceService.js';

// Store SSE clients
const provisioningClients = new Map();

export const getProvisioningProgress = async (req, res) => {
  // Extract user from JWT token in Authorization header or cookie
  let userId;
  
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwt = await import('jsonwebtoken');
      const config = await import('../config/index.js');
      const decoded = jwt.default.verify(token, config.default.jwt.secret);
      userId = decoded.id;
    }
  } catch (error) {
    console.error('Auth error in SSE:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to provisioning stream' })}\n\n`);

  // Store client connection
  provisioningClients.set(userId, res);

  // Clean up on client disconnect
  req.on('close', () => {
    provisioningClients.delete(userId);
  });
};

// Helper to send progress updates
export const sendProvisioningUpdate = (userId, type, message, progress = null) => {
  const client = provisioningClients.get(userId);
  if (client) {
    const data = { type, message, progress, timestamp: new Date().toISOString() };
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
};

export const getMyInstance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const instance = await instanceService.getInstanceStatus(userId);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'No instance found. Instance may still be provisioning.'
      });
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('Error getting instance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const createInstance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // Check if instance already exists
    const existingInstance = await instanceService.getInstanceStatus(userId);
    if (existingInstance) {
      return res.status(400).json({
        success: false,
        error: 'Instance already exists'
      });
    }
    
    // Get Socket.IO instance
    const io = req.app.get('io');
    
    // Provision a new N8N instance (async - don't wait) with WebSocket callback
    const progressCallback = (userId, type, message, progress) => {
      io.emit(`provisioning:${userId}`, { type, message, progress });
    };
    
    instanceService.provisionInstance(userId, userEmail, progressCallback)
      .catch(error => {
        console.error('Error provisioning N8N instance:', error);
        io.emit(`provisioning:${userId}`, { 
          type: 'error', 
          message: error.message, 
          progress: 0 
        });
      });
    
    res.json({
      success: true,
      message: 'Instance provisioning started'
    });
  } catch (error) {
    console.error('Error creating instance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const startInstance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await instanceService.startInstance(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error starting instance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const stopInstance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await instanceService.stopInstance(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error stopping instance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const restartInstance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await instanceService.restartInstance(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error restarting instance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteInstance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // Delete the instance
    const result = await instanceService.deleteInstance(userId);
    
    // Get Socket.IO instance
    const io = req.app.get('io');
    
    // Provision a new N8N instance automatically (async - don't wait) with WebSocket callback
    const progressCallback = (userId, type, message, progress) => {
      io.emit(`provisioning:${userId}`, { type, message, progress });
    };
    
    instanceService.provisionInstance(userId, userEmail, progressCallback)
      .catch(error => {
        console.error('Error provisioning new N8N instance after deletion:', error);
        io.emit(`provisioning:${userId}`, { 
          type: 'error', 
          message: error.message, 
          progress: 0 
        });
      });
    
    res.json({
      success: true,
      data: result,
      message: 'Instance deleted successfully. A new instance is being provisioned.'
    });
  } catch (error) {
    console.error('Error deleting instance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  getMyInstance,
  createInstance,
  startInstance,
  stopInstance,
  restartInstance,
  deleteInstance
};
