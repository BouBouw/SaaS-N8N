import express from 'express';
import * as apiKeyController from '../controllers/apiKeyController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected with JWT
router.use(verifyJWT);

router.post('/', apiKeyController.createApiKey);
router.get('/', apiKeyController.getApiKeys);
router.get('/:keyId/reveal', apiKeyController.revealApiKey);
router.delete('/:keyId', apiKeyController.deleteApiKey);

export default router;
