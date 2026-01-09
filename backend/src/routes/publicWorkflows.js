import express from 'express';
import {
  createPublicWorkflow,
  getPublicWorkflows,
  getPublicWorkflow,
  usePublicWorkflow,
  deletePublicWorkflow
} from '../controllers/publicWorkflowController.js';
import { verifyJWT, optionalJWT } from '../middleware/auth.js';

const router = express.Router();

// Public endpoints (optional auth to get is_favorite status)
router.get('/', optionalJWT, getPublicWorkflows);
router.get('/:id', getPublicWorkflow);

// Protected endpoints
router.post('/', verifyJWT, createPublicWorkflow);
router.post('/:id/use', verifyJWT, usePublicWorkflow);
router.delete('/:id', verifyJWT, deletePublicWorkflow);

export default router;
