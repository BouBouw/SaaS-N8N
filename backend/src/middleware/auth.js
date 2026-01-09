import * as authService from '../services/authService.js';

export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);
    
    // Get user data
    const user = await authService.getUserById(decoded.userId);
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Optional JWT middleware - sets req.user if token is valid, but doesn't block if missing/invalid
export const optionalJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);
    
    // Get user data
    const user = await authService.getUserById(decoded.userId);
    
    // Attach user to request
    req.user = user;
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export default {
  verifyJWT,
  optionalJWT
};
