import express from 'express';
import { createWorkflow } from '../controllers/aiController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// Create workflow with AI
router.post('/create-workflow', verifyJWT, createWorkflow);

export default router;
