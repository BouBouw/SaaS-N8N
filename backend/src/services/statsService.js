import Docker from 'dockerode';
import config from '../config/index.js';

const docker = new Docker({ socketPath: config.docker.socketPath });

/**
 * Get instance statistics (CPU, Memory, Network, etc.)
 */
export const getInstanceStats = async (containerName) => {
  try {
    const container = docker.getContainer(containerName);
    
    // Get container info
    const containerInfo = await container.inspect();
    
    // Get container stats (CPU, Memory, etc.)
    const stats = await container.stats({ stream: false });
    
    // Calculate CPU usage percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100 : 0;
    
    // Calculate memory usage
    const memoryUsage = stats.memory_stats.usage || 0;
    const memoryLimit = stats.memory_stats.limit || 0;
    const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;
    
    // Network I/O
    const networks = stats.networks || {};
    let networkRx = 0;
    let networkTx = 0;
    Object.values(networks).forEach(net => {
      networkRx += net.rx_bytes || 0;
      networkTx += net.tx_bytes || 0;
    });
    
    // Block I/O
    const blockIO = stats.blkio_stats.io_service_bytes_recursive || [];
    let blockRead = 0;
    let blockWrite = 0;
    blockIO.forEach(io => {
      if (io.op === 'read' || io.op === 'Read') blockRead += io.value;
      if (io.op === 'write' || io.op === 'Write') blockWrite += io.value;
    });
    
    return {
      status: containerInfo.State.Status,
      uptime: containerInfo.State.StartedAt,
      cpu: {
        percent: parseFloat(cpuPercent.toFixed(2)),
        usage: stats.cpu_stats.cpu_usage.total_usage,
      },
      memory: {
        usage: memoryUsage,
        limit: memoryLimit,
        percent: parseFloat(memoryPercent.toFixed(2)),
        usageMB: parseFloat((memoryUsage / 1024 / 1024).toFixed(2)),
        limitMB: parseFloat((memoryLimit / 1024 / 1024).toFixed(2)),
      },
      network: {
        rx: networkRx,
        tx: networkTx,
        rxMB: parseFloat((networkRx / 1024 / 1024).toFixed(2)),
        txMB: parseFloat((networkTx / 1024 / 1024).toFixed(2)),
      },
      disk: {
        read: blockRead,
        write: blockWrite,
        readMB: parseFloat((blockRead / 1024 / 1024).toFixed(2)),
        writeMB: parseFloat((blockWrite / 1024 / 1024).toFixed(2)),
      },
      restarts: containerInfo.RestartCount || 0,
    };
  } catch (error) {
    console.error('Error getting instance stats:', error);
    throw new Error('Unable to fetch instance statistics');
  }
};

/**
 * Get historical stats for charts (mock data for now, can be extended with time-series DB)
 */
export const getInstanceHistory = async (containerName, hours = 24) => {
  try {
    // For now, return mock historical data
    // In production, you'd store this in a time-series database
    const now = Date.now();
    const interval = (hours * 60 * 60 * 1000) / 24; // 24 data points
    
    const history = [];
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * interval);
      history.push({
        timestamp: new Date(timestamp).toISOString(),
        cpu: Math.random() * 50 + 10, // Random between 10-60%
        memory: Math.random() * 40 + 30, // Random between 30-70%
        network: Math.random() * 10, // Random 0-10 MB/s
      });
    }
    
    return history;
  } catch (error) {
    console.error('Error getting instance history:', error);
    throw new Error('Unable to fetch instance history');
  }
};

export default {
  getInstanceStats,
  getInstanceHistory,
};
