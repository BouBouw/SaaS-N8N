import Docker from 'dockerode';
import config from '../config/index.js';

const docker = new Docker({ socketPath: config.docker.socketPath });

/**
 * Get container logs
 */
export const getContainerLogs = async (containerName, options = {}) => {
  try {
    const container = docker.getContainer(containerName);
    
    const logOptions = {
      stdout: true,
      stderr: true,
      tail: options.tail || 500,
      timestamps: true,
      ...options
    };

    const logs = await container.logs(logOptions);
    
    // Convert buffer to string and split by lines
    const logString = logs.toString('utf8');
    const logLines = logString
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Remove Docker header bytes (first 8 bytes)
        const cleaned = line.slice(8);
        return cleaned;
      });

    return logLines;
  } catch (error) {
    console.error('Error getting container logs:', error);
    throw error;
  }
};

/**
 * Get workflow error logs from N8N
 * Filters logs for error-related content
 */
export const getWorkflowErrors = async (containerName, options = {}) => {
  try {
    const logs = await getContainerLogs(containerName, {
      tail: options.tail || 1000,
      ...options
    });

    // Filter for error-related logs
    const errorKeywords = ['error', 'ERROR', 'failed', 'FAILED', 'exception', 'Exception'];
    const errorLogs = logs.filter(log => {
      const lowerLog = log.toLowerCase();
      return errorKeywords.some(keyword => lowerLog.includes(keyword.toLowerCase()));
    });

    return errorLogs;
  } catch (error) {
    console.error('Error getting workflow errors:', error);
    throw error;
  }
};

/**
 * Stream container logs in real-time
 */
export const streamContainerLogs = async (containerName, onData, onError) => {
  try {
    const container = docker.getContainer(containerName);
    
    const logStream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      timestamps: true,
      tail: 100
    });

    logStream.on('data', (chunk) => {
      const logString = chunk.toString('utf8');
      const cleaned = logString.slice(8); // Remove Docker header
      onData(cleaned);
    });

    logStream.on('error', (error) => {
      onError(error);
    });

    return logStream;
  } catch (error) {
    console.error('Error streaming container logs:', error);
    throw error;
  }
};

export default {
  getContainerLogs,
  getWorkflowErrors,
  streamContainerLogs
};
