import express from 'express';
import * as instanceController from '../controllers/instanceController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// SSE endpoint - must be before verifyJWT middleware
router.get('/provision/progress', instanceController.getProvisioningProgress);

// All other routes are protected
router.use(verifyJWT);

router.get('/my', instanceController.getMyInstance);
router.post('/create', instanceController.createInstance);
router.post('/start', instanceController.startInstance);
router.post('/stop', instanceController.stopInstance);
router.post('/restart', instanceController.restartInstance);
router.delete('/delete', instanceController.deleteInstance);

export default router;
