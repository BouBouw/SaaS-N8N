import dotenv from 'dotenv';

dotenv.config();

export default {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'saas_n8n',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Docker
  docker: {
    socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
    basePort: parseInt(process.env.N8N_BASE_PORT) || 5678,
    network: process.env.N8N_NETWORK || 'n8n_network'
  },
  
  // Domain
  domain: {
    base: process.env.BASE_DOMAIN || 'boubouw.com'
  }
};
