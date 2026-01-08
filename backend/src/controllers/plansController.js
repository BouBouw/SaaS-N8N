import { RESOURCE_PLANS } from '../config/plans.js';

export const getPlans = async (req, res) => {
  try {
    // Transform plans to frontend-friendly format
    const plans = Object.entries(RESOURCE_PLANS).map(([key, plan]) => ({
      id: key,
      ...plan
    }));

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export default {
  getPlans
};
