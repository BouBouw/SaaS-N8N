import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateRequest, registerSchema, loginSchema } from '../middleware/validation.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

// Protected routes
router.get('/me', verifyJWT, authController.me);
router.put('/profile', verifyJWT, authController.updateProfile);
router.put('/password', verifyJWT, authController.updatePassword);
router.delete('/account', verifyJWT, authController.deleteAccount);

export default router;
