import api from './api';

export interface Instance {
  id: string;
  subdomain: string;
  url: string;
  port: number;
  status: 'running' | 'stopped' | 'error';
  createdAt: string;
}

export const instanceService = {
  async getMyInstance(): Promise<Instance | null> {
    try {
      const response = await api.get('/instances/my');
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async startInstance(): Promise<void> {
    await api.post('/instances/start');
  },

  async stopInstance(): Promise<void> {
    await api.post('/instances/stop');
  },

  async restartInstance(): Promise<void> {
    await api.post('/instances/restart');
  },

  async deleteInstance(): Promise<void> {
    await api.delete('/instances/delete');
  },

  async createInstance(): Promise<void> {
    await api.post('/instances/create');
  },

  async getLogs(tail: number = 500): Promise<string[]> {
    const response = await api.get(`/logs/logs?tail=${tail}`);
    return response.data.data;
  },

  async getErrors(tail: number = 1000): Promise<string[]> {
    const response = await api.get(`/logs/errors?tail=${tail}`);
    return response.data.data;
  }
};
