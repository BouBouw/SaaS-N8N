import express from 'express';
import { getUsers, updateRole, deleteUserById, getUserStats, getUserApiKey } from '../controllers/adminController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check admin role
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Droits administrateur requis.' });
  }
  next();
};

// All admin routes require authentication and admin role
router.use(verifyJWT);
router.use(verifyAdmin);

// Get all users
router.get('/users', getUsers);

// Get admin stats
router.get('/stats', getUserStats);

// Update user role
router.put('/users/:id/role', updateRole);

// Get user's API key (admin only)
router.get('/users/:id/api-key', getUserApiKey);

// Delete user
router.delete('/users/:id', deleteUserById);

export default router;
