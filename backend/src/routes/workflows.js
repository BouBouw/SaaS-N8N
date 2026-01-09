import express from 'express';
import * as workflowsController from '../controllers/workflowsController.js';
import { importWorkflow, getInstanceWorkflows } from '../controllers/workflowController.js';
import { verifyJWT } from '../middleware/auth.js';
import { verifyApiKey } from '../middleware/apiKey.js';

const router = express.Router();

// Public endpoints with API key authentication
router.get('/public', verifyApiKey, workflowsController.getWorkflows);
router.get('/public/:workflowId', verifyApiKey, workflowsController.getWorkflow);

// Protected endpoints with JWT
router.use(verifyJWT);

// Import workflow to user's N8N instance
router.post('/import', importWorkflow);

// Get all workflows from user's N8N instance
router.get('/', getInstanceWorkflows);

// Get specific workflow by ID
router.get('/:workflowId', workflowsController.getWorkflow);

// Export all workflows as JSON file
router.get('/export/all', workflowsController.exportWorkflows);

export default router;
