import express from 'express';
import { getMyInstanceStats, getMyInstanceHistory } from '../controllers/statsController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(verifyJWT);

// Get current instance stats
router.get('/current', getMyInstanceStats);

// Get historical stats
router.get('/history', getMyInstanceHistory);

export default router;
