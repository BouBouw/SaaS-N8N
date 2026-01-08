import * as Instance from '../models/Instance.js';
import { getInstanceStats, getInstanceHistory } from '../services/statsService.js';

export const getMyInstanceStats = async (req, res) => {
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
    
    // Get container stats
    const containerName = `n8n-${instance.subdomain}`;
    const stats = await getInstanceStats(containerName);
    
    res.json({
      success: true,
      data: {
        instance: {
          subdomain: instance.subdomain,
          url: instance.url,
          status: instance.status,
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching instance stats:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch instance statistics' 
    });
  }
};

export const getMyInstanceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const hours = parseInt(req.query.hours) || 24;
    
    // Get user's instance
    const instance = await Instance.findInstanceByUserId(userId);
    
    if (!instance) {
      return res.status(404).json({ 
        success: false,
        error: 'No instance found for this user' 
      });
    }
    
    // Get historical stats
    const containerName = `n8n-${instance.subdomain}`;
    const history = await getInstanceHistory(containerName, hours);
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching instance history:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch instance history' 
    });
  }
};
