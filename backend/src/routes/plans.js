import express from 'express';
import * as plansController from '../controllers/plansController.js';

const router = express.Router();

// Public route to get available plans
router.get('/', plansController.getPlans);

export default router;
