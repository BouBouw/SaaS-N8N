import express from 'express';
import * as logsController from '../controllers/logsController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(verifyJWT);

router.get('/logs', logsController.getMyInstanceLogs);
router.get('/errors', logsController.getMyInstanceErrors);

export default router;
