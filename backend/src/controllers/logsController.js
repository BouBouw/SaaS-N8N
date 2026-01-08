import * as logsService from '../services/logsService.js';
import * as Instance from '../models/Instance.js';

export const getMyInstanceLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tail = 500 } = req.query;

    // Get user's instance
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found'
      });
    }

    const logs = await logsService.getContainerLogs(instance.container_name, {
      tail: parseInt(tail)
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error getting instance logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getMyInstanceErrors = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tail = 1000 } = req.query;

    // Get user's instance
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found'
      });
    }

    const errors = await logsService.getWorkflowErrors(instance.container_name, {
      tail: parseInt(tail)
    });

    res.json({
      success: true,
      data: errors
    });
  } catch (error) {
    console.error('Error getting instance errors:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  getMyInstanceLogs,
  getMyInstanceErrors
};
