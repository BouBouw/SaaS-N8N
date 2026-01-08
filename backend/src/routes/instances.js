import express from 'express';
import * as instanceController from '../controllers/instanceController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(verifyJWT);

router.get('/my', instanceController.getMyInstance);
router.post('/start', instanceController.startInstance);
router.post('/stop', instanceController.stopInstance);
router.post('/restart', instanceController.restartInstance);
router.delete('/delete', instanceController.deleteInstance);

export default router;
