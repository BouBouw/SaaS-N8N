import * as ApiKey from '../models/ApiKey.js';
import { generateApiKey } from '../utils/apiKey.js';

export const createApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'API key name is required'
      });
    }

    // Check if user already has an API key (limit to 1)
    const existingKeys = await ApiKey.findApiKeyByUserId(userId);
    if (existingKeys.length >= 1) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez atteint la limite d\'1 clé API par utilisateur. Supprimez votre clé existante pour en créer une nouvelle.'
      });
    }

    const result = await ApiKey.createApiKey(userId, name);

    res.status(201).json({
      success: true,
      message: 'API key created successfully. Save this key securely, it will not be shown again.',
      data: {
        id: result.id,
        name: result.name,
        apiKey: result.apiKey
      }
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key'
    });
  }
};

export const getApiKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const apiKeys = await ApiKey.findApiKeyByUserId(userId);

    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys'
    });
  }
};

export const deleteApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    await ApiKey.deleteApiKey(keyId, userId);

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete API key'
    });
  }
};

export const revealApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    const apiKey = await ApiKey.revealApiKey(keyId, userId);

    res.json({
      success: true,
      data: { apiKey }
    });
  } catch (error) {
    console.error('Error revealing API key:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reveal API key'
    });
  }
};

export default {
  createApiKey,
  getApiKeys,
  deleteApiKey,
  revealApiKey
};
