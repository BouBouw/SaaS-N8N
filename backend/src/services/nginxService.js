import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

class NginxService {
  static NGINX_CONF_PATH = '/etc/nginx/conf.d/n8n-upstreams.conf';
  static NGINX_SITES_AVAILABLE = '/etc/nginx/sites-available';
  
  /**
   * Ajouter une configuration d'upstream pour une instance N8N
   */
  static async addN8NUpstream(subdomain, port) {
    // Vérifier si on est en environnement de développement (Windows)
    if (process.platform === 'win32') {
      console.log(`⚠️ Mode développement - Skip Nginx config pour ${subdomain}:${port}`);
      return true;
    }

    const upstreamConfig = `
# Instance ${subdomain}
upstream n8n_${subdomain.replace(/[^a-zA-Z0-9]/g, '_')} {
    server 127.0.0.1:${port};
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name ${subdomain}.${process.env.BASE_DOMAIN || 'boubouw.com'};

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/${process.env.BASE_DOMAIN || 'boubouw.com'}-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${process.env.BASE_DOMAIN || 'boubouw.com'}-0001/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://n8n_${subdomain.replace(/[^a-zA-Z0-9]/g, '_')};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_redirect off;
    }
}
`;

    try {
      const configPath = `/etc/nginx/sites-available/n8n-${subdomain}`;
      
      // Écrire la configuration
      await fs.writeFile(configPath, upstreamConfig, 'utf8');

      // Créer le lien symbolique
      const linkPath = `/etc/nginx/sites-enabled/n8n-${subdomain}`;
      try {
        await fs.access(linkPath);
        // Le lien existe déjà
      } catch {
        await fs.symlink(configPath, linkPath);
      }

      // Recharger Nginx
      await this.reloadNginx();

      console.log(`✅ Nginx upstream configuré pour ${subdomain}:${port}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la configuration Nginx:', error);
      // Ne pas faire échouer le provisioning si Nginx échoue
      return false;
    }
  }

  /**
   * Supprimer une configuration d'upstream
   */
  static async removeN8NUpstream(subdomain) {
    if (process.platform === 'win32') {
      console.log(`⚠️ Mode développement - Skip Nginx removal pour ${subdomain}`);
      return true;
    }

    try {
      const configPath = `/etc/nginx/sites-available/n8n-${subdomain}`;
      const linkPath = `/etc/nginx/sites-enabled/n8n-${subdomain}`;

      // Supprimer le lien symbolique
      try {
        await fs.unlink(linkPath);
      } catch (err) {
        // Le lien n'existe pas
      }

      // Supprimer le fichier de configuration
      try {
        await fs.unlink(configPath);
      } catch (err) {
        // Le fichier n'existe pas
      }

      await this.reloadNginx();

      console.log(`✅ Nginx upstream supprimé pour ${subdomain}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'upstream:', error);
      return false;
    }
  }

  /**
   * Recharger Nginx sans interrompre les connexions
   */
  static async reloadNginx() {
    if (process.platform === 'win32') {
      return true;
    }

    try {
      // Tester la configuration avant de recharger
      await execAsync('nginx -t');
      
      // Recharger Nginx en envoyant un signal au processus de l'hôte
      // Trouver le PID du process nginx master sur l'hôte
      const { stdout } = await execAsync('pgrep -x nginx | head -1');
      const nginxPid = stdout.trim();
      
      if (nginxPid) {
        // Envoyer SIGHUP pour recharger la configuration
        await execAsync(`kill -HUP ${nginxPid}`);
        console.log('✅ Nginx rechargé avec succès');
        return true;
      } else {
        console.error('❌ Impossible de trouver le processus Nginx');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors du rechargement de Nginx:', error.message);
      // Ne pas faire échouer l'opération si Nginx échoue
      return false;
    }
  }

  /**
   * Vérifier que Nginx fonctionne
   */
  static async checkNginxStatus() {
    if (process.platform === 'win32') {
      return true;
    }

    try {
      const { stdout } = await execAsync('pgrep -x nginx');
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Créer la configuration principale de Nginx
   */
  static async createMainConfig(domain) {
    if (process.platform === 'win32') {
      console.log('⚠️ Mode développement - Skip création config principale Nginx');
      return true;
    }

    const mainConfig = `# Configuration principale pour ${domain}
server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};

    # Logs
    access_log /var/log/nginx/n8n-saas-access.log;
    error_log /var/log/nginx/n8n-saas-error.log;

    # Frontend React
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Sécurité
    server_tokens off;
    
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
`;

    try {
      const configPath = `/etc/nginx/sites-available/n8n-saas-main`;
      await fs.writeFile(configPath, mainConfig, 'utf8');

      const linkPath = `/etc/nginx/sites-enabled/n8n-saas-main`;
      try {
        await fs.access(linkPath);
      } catch {
        await fs.symlink(configPath, linkPath);
      }

      await this.reloadNginx();
      console.log(`✅ Configuration principale Nginx créée pour ${domain}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la création de la config principale:', error);
      return false;
    }
  }
}

export default NginxService;
