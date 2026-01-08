import Docker from 'dockerode';
import config from '../config/index.js';
import * as Instance from '../models/Instance.js';
import { generateSubdomain } from '../utils/helpers.js';
import { getDockerLimits, DEFAULT_PLAN } from '../config/plans.js';
import NginxService from './nginxService.js';

const docker = new Docker({ socketPath: config.docker.socketPath });

export const provisionInstance = async (userId, userEmail) => {
  try {
    console.log(`🚀 Provisioning N8N instance for user ${userId}`);

    // Generate unique subdomain
    const subdomain = generateSubdomain();
    
    // Check if subdomain already exists
    const existingSubdomain = await Instance.findInstanceBySubdomain(subdomain);
    if (existingSubdomain) {
      throw new Error('Subdomain collision, please retry');
    }

    // Get next available port
    const port = await Instance.getNextAvailablePort();

    // Create container name
    const containerName = `n8n-${subdomain}`;

    // Create volume for persistence
    const volumeName = `n8n-data-${subdomain}`;
    
    try {
      await docker.createVolume({ Name: volumeName });
      console.log(`✅ Volume created: ${volumeName}`);
    } catch (error) {
      console.log(`Volume ${volumeName} may already exist`);
    }

    // Get resource limits based on plan (default: starter)
    const resourceLimits = getDockerLimits(DEFAULT_PLAN);
    
    // Container configuration with resource limits
    const containerConfig = {
      Image: 'n8nio/n8n:latest',
      name: containerName,
      Env: [
        `N8N_BASIC_AUTH_ACTIVE=false`,
        `N8N_HOST=${subdomain}.${config.domain.base}`,
        `N8N_PORT=${port}`,
        `N8N_PROTOCOL=https`,
        `WEBHOOK_URL=https://${subdomain}.${config.domain.base}/`,
        `GENERIC_TIMEZONE=Europe/Paris`
      ],
      HostConfig: {
        Binds: [
          `${volumeName}:/home/node/.n8n`
        ],
        PortBindings: {
          '5678/tcp': [{ HostPort: port.toString() }]
        },
        RestartPolicy: {
          Name: 'unless-stopped'
        },
        NetworkMode: config.docker.network,
        // Resource limits from plan
        ...resourceLimits
      },
      ExposedPorts: {
        '5678/tcp': {}
      }
    };

    // Pull N8N image if not exists
    try {
      console.log('📥 Pulling N8N image...');
      await new Promise((resolve, reject) => {
        docker.pull('n8nio/n8n:latest', (err, stream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err, output) => {
            if (err) return reject(err);
            resolve(output);
          });
        });
      });
      console.log('✅ N8N image pulled');
    } catch (error) {
      console.log('Image may already exist, continuing...');
    }

    // Create and start container
    console.log('📦 Creating container...');
    const container = await docker.createContainer(containerConfig);
    
    await container.start();
    console.log(`✅ Container started: ${containerName}`);

    // Get container info
    const containerInfo = await container.inspect();
    const containerId = containerInfo.Id;

    // Save instance to database
    const instanceId = await Instance.createInstance(
      userId,
      subdomain,
      containerId,
      containerName,
      port
    );

    // Configure Nginx for this instance
    await NginxService.addN8NUpstream(subdomain, port);

    console.log(`✅ Instance provisioned successfully for user ${userId}`);

    return {
      id: instanceId,
      subdomain,
      url: `https://${subdomain}.${config.domain.base}`,
      port,
      containerId,
      containerName,
      status: 'running'
    };
  } catch (error) {
    console.error('Error provisioning instance:', error);
    throw error;
  }
};

export const stopInstance = async (userId) => {
  try {
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    const container = docker.getContainer(instance.container_id);
    await container.stop();
    
    await Instance.updateInstanceStatus(instance.id, 'stopped');

    return { success: true, message: 'Instance stopped' };
  } catch (error) {
    console.error('Error stopping instance:', error);
    throw error;
  }
};

export const startInstance = async (userId) => {
  try {
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    const container = docker.getContainer(instance.container_id);
    await container.start();
    
    await Instance.updateInstanceStatus(instance.id, 'running');

    return { success: true, message: 'Instance started' };
  } catch (error) {
    console.error('Error starting instance:', error);
    throw error;
  }
};

export const restartInstance = async (userId) => {
  try {
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    const container = docker.getContainer(instance.container_id);
    await container.restart();
    
    await Instance.updateInstanceStatus(instance.id, 'running');

    return { success: true, message: 'Instance restarted' };
  } catch (error) {
    console.error('Error restarting instance:', error);
    throw error;
  }
};

export const deleteInstance = async (userId) => {
  try {
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    const container = docker.getContainer(instance.container_id);
    
    // Stop container if running
    try {
      await container.stop();
    } catch (error) {
      console.log('Container may already be stopped');
    }

    // Remove Nginx configuration
    await NginxService.removeN8NUpstream(instance.subdomain);
    
    // Remove container
    await container.remove();

    // Remove volume
    const volumeName = `n8n-data-${instance.subdomain}`;
    try {
      const volume = docker.getVolume(volumeName);
      await volume.remove();
    } catch (error) {
      console.log('Volume may not exist');
    }

    // Delete from database
    await Instance.deleteInstance(instance.id);

    return { success: true, message: 'Instance deleted' };
  } catch (error) {
    console.error('Error deleting instance:', error);
    throw error;
  }
};

export const getInstanceStatus = async (userId) => {
  try {
    const instance = await Instance.findInstanceByUserId(userId);
    if (!instance) {
      return null;
    }

    // Get container status
    try {
      const container = docker.getContainer(instance.container_id);
      const containerInfo = await container.inspect();
      
      const status = containerInfo.State.Running ? 'running' : 'stopped';
      
      // Update status if different
      if (status !== instance.status) {
        await Instance.updateInstanceStatus(instance.id, status);
      }

      return {
        id: instance.id,
        subdomain: instance.subdomain,
        url: `https://${instance.subdomain}.${config.domain.base}`,
        port: instance.port,
        status: status,
        createdAt: instance.created_at
      };
    } catch (error) {
      // Container not found
      await Instance.updateInstanceStatus(instance.id, 'error');
      return {
        ...instance,
        status: 'error',
        url: `https://${instance.subdomain}.${config.domain.base}`
      };
    }
  } catch (error) {
    console.error('Error getting instance status:', error);
    throw error;
  }
};

export default {
  provisionInstance,
  stopInstance,
  startInstance,
  deleteInstance,
  getInstanceStatus
};
