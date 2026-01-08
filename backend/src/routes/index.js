import express from 'express';
import authRoutes from './auth.js';
import instanceRoutes from './instances.js';
import plansRoutes from './plans.js';
import workflowsRoutes from './workflows.js';
import apiKeysRoutes from './apiKeys.js';
import adminRoutes from './admin.js';
import statsRoutes from './stats.js';
import logsRoutes from './logs.js';
import teamRoutes from './team.js';
import commentsRoutes from './comments.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/instances', instanceRoutes);
router.use('/plans', plansRoutes);
router.use('/workflows', workflowsRoutes);
router.use('/api-keys', apiKeysRoutes);
router.use('/admin', adminRoutes);
router.use('/stats', statsRoutes);
router.use('/logs', logsRoutes);
router.use('/team', teamRoutes);
router.use('/comments', commentsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
