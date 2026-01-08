import * as instanceService from '../services/instanceService.js';

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
    
    const result = await instanceService.deleteInstance(userId);
    
    res.json({
      success: true,
      data: result
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
  startInstance,
  stopInstance,
  restartInstance,
  deleteInstance
};
