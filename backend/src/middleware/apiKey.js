import * as ApiKey from '../models/ApiKey.js';

export const verifyApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const user = await ApiKey.findUserByApiKey(apiKey);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('API key verification error:', error);
    return res.status(401).json({ error: 'Invalid API key' });
  }
};

export default {
  verifyApiKey
};
