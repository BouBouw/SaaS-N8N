import express from 'express';
import * as commentsController from '../controllers/commentsController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(verifyJWT);

// Comments
router.post('/', commentsController.addComment);
router.get('/', commentsController.getAllComments);
router.get('/recent', commentsController.getRecentComments);
router.get('/workflow/:workflowId', commentsController.getWorkflowComments);
router.put('/:commentId', commentsController.updateComment);
router.delete('/:commentId', commentsController.deleteComment);

export default router;
