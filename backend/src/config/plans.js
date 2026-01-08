// Resource plans for N8N instances

export const RESOURCE_PLANS = {
  free: {
    name: 'Free Plan',
    cpu: 2, // vCPU cores
    memory: 6, // GB
    storage: 50, // GB
    bandwidth: 2048, // GB/month (2 TB)
    maxWorkflows: -1, // unlimited
    price: 0
  }
};

// Default plan for new users
export const DEFAULT_PLAN = 'free';

// Convert plan resources to Docker configuration
export const getDockerLimits = (planName = DEFAULT_PLAN) => {
  const plan = RESOURCE_PLANS[planName] || RESOURCE_PLANS[DEFAULT_PLAN];
  
  return {
    Memory: plan.memory * 1024 * 1024 * 1024, // Convert GB to bytes
    MemorySwap: plan.memory * 1024 * 1024 * 1024, // No swap
    NanoCpus: plan.cpu * 1000000000, // Convert cores to nanocpus
    StorageOpt: {
      size: `${plan.storage}G`
    },
    BlkioWeight: 500 // I/O weight
  };
};

export default {
  RESOURCE_PLANS,
  DEFAULT_PLAN,
  getDockerLimits
};
