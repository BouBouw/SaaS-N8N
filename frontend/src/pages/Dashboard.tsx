import { useState, useEffect, useRef } from 'react';
import { 
  Server, 
  Play, 
  Square, 
  ExternalLink, 
  Activity,
  Cpu,
  HardDrive,
  Network,
  Clock,
  Trash2,
  RotateCw,
  Database
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { authService, User } from '../services/authService';
import { instanceService, Instance } from '../services/instanceService';
import { getApiUrl } from '../config/api';
import ProvisioningProgress from '../components/ProvisioningProgress';
import { useToast } from '../contexts/ToastContext';

interface InstanceStats {
  status: string;
  uptime: string;
  cpu: {
    percent: number;
    usage: number;
  };
  memory: {
    usage: number;
    limit: number;
    percent: number;
    usageMB: number;
    limitMB: number;
  };
  network: {
    rx: number;
    tx: number;
    rxMB: number;
    txMB: number;
  };
  disk: {
    read: number;
    write: number;
    readMB: number;
    writeMB: number;
  };
  restarts: number;
}

interface HistoryData {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
}

export default function Dashboard() {
  const [_user, setUser] = useState<User | null>(null);
  const [instance, setInstance] = useState<Instance | null>(null);
  const [stats, setStats] = useState<InstanceStats | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [workflowCount, setWorkflowCount] = useState<number>(0);
  const [executionCount, setExecutionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showProvisioning, setShowProvisioning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const { showToast, showDemand } = useToast();

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (instance?.status === 'running') {
        loadStats();
        loadHistory();
        loadLogs();
        loadWorkflowStats();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [instance?.status]);

  const loadData = async () => {
    try {
      const userData = authService.getUser();
      setUser(userData);

      const instanceData = await instanceService.getMyInstance();
      setInstance(instanceData);

      if (!instanceData) {
        setShowProvisioning(true);
        setLoading(false);
        return;
      }

      if (instanceData?.status === 'running') {
        await loadStats();
        await loadHistory();
        await loadLogs();
        await loadWorkflowStats();
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setShowProvisioning(true);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(getApiUrl('/api/stats/current'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(getApiUrl('/api/stats/history?hours=24'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const loadLogs = async () => {
    try {
      const logData = await instanceService.getLogs(10);
      setLogs(logData);
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  const loadWorkflowStats = async () => {
    try {
      const response = await fetch(`${getApiUrl('/api/workflows')}`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setWorkflowCount(data.data.length);
          
          // Calculer le total d'exécutions
          let totalExecutions = 0;
          for (const workflow of data.data) {
            if (workflow.staticData?.executionCount) {
              totalExecutions += workflow.staticData.executionCount;
            }
          }
          setExecutionCount(totalExecutions);
        }
      }
    } catch (err) {
      console.error('Error loading workflow stats:', err);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await instanceService.startInstance();
      await loadData();
      showToast('success', 'Instance démarrée avec succès');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Échec du démarrage de l\'instance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      await instanceService.stopInstance();
      await loadData();
      showToast('success', 'Instance arrêtée avec succès');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Échec de l\'arrêt de l\'instance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestart = async () => {
    setActionLoading(true);
    try {
      await instanceService.restartInstance();
      await loadData();
      showToast('success', 'Instance redémarrée avec succès');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Échec du redémarrage de l\'instance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    showDemand(
      'Êtes-vous sûr de vouloir supprimer cette instance ? Cette action est irréversible et supprimera tous vos workflows et données. Une nouvelle instance sera automatiquement créée.',
      async () => {
        setActionLoading(true);
        try {
          await instanceService.deleteInstance();
          setShowProvisioning(true);
          setInstance(null);
          showToast('success', 'Instance supprimée. Création d\'une nouvelle instance en cours...');
        } catch (err: any) {
          showToast('error', err.response?.data?.error || 'Échec de la suppression de l\'instance');
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  const handleProvisioningComplete = async () => {
    setShowProvisioning(false);
    setLoading(true);
    await loadData();
  };

  const formatUptime = (uptime: string) => {
    if (!uptime) return '0s';
    
    // Parse uptime string (format: "X days, HH:MM:SS" or "HH:MM:SS")
    const parts = uptime.split(',');
    let days = 0;
    let timeStr = uptime;
    
    if (parts.length === 2) {
      days = parseInt(parts[0].trim().split(' ')[0]);
      timeStr = parts[1].trim();
    }
    
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    
    const result: string[] = [];
    if (days > 0) result.push(`${days}j`);
    if (hours > 0) result.push(`${hours}h`);
    if (minutes > 0) result.push(`${minutes}m`);
    if (seconds > 0 || result.length === 0) result.push(`${seconds}s`);
    
    return result.join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#030709]">
        <div className="w-12 h-12 border-4 border-[#05F26C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showProvisioning) {
    return <ProvisioningProgress onComplete={handleProvisioningComplete} />;
  }

  if (!instance) {
    return null;
  }

  const isRunning = instance?.status === 'running';

  return (
    <div className="min-h-screen bg-[#030709]">
      {/* Header */}
      <div className="bg-[#132426] border-b border-[#0a1b1e]">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-[#05F26C]' : 'bg-gray-500'}`}></div>
              <h1 className="text-2xl font-bold text-white">n8n-{instance.subdomain}</h1>
              <span className={`text-sm px-3 py-1 rounded-full ${isRunning ? 'bg-[#05F26C]/10 text-[#05F26C]' : 'bg-gray-500/10 text-gray-500'}`}>
                {isRunning ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {isRunning && (
                <button
                  onClick={handleRestart}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#0a1b1e] hover:bg-[#132426] text-white rounded-lg transition-all disabled:opacity-50 flex items-center space-x-2 border border-[#0a1b1e]"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Redémarrer</span>
                </button>
              )}
              {isRunning ? (
                <button
                  onClick={handleStop}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all disabled:opacity-50 flex items-center space-x-2 border border-red-500/30"
                >
                  <Square className="w-4 h-4" />
                  <span>Arrêter</span>
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Démarrer</span>
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all disabled:opacity-50 border border-[#0a1b1e] hover:border-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* IP Address */}
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                  <Network className="w-4 h-4" />
                  <span>Adresse IP</span>
                </div>
                <div className="text-white text-lg font-semibold">
                  {instance.subdomain}.boubouw.com
                </div>
              </div>
              <a
                href={instance.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg transition-all ${
                  isRunning
                    ? 'bg-[#05F26C]/10 hover:bg-[#05F26C]/20 text-[#05F26C]'
                    : 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                }`}
                onClick={(e) => !isRunning && e.preventDefault()}
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Port */}
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-4">
            <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
              <Server className="w-4 h-4" />
              <span>Port</span>
            </div>
            <div className="text-white text-lg font-semibold">5678</div>
          </div>

          {/* Version */}
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-4">
            <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
              <Activity className="w-4 h-4" />
              <span>Version</span>
            </div>
            <div className="text-white text-lg font-semibold">v1.24.3</div>
          </div>

          {/* Uptime */}
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-4">
            <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>Uptime</span>
            </div>
            <div className="text-white text-lg font-semibold">
              {stats?.uptime ? formatUptime(stats.uptime) : '0s'}
            </div>
          </div>
        </div>

        {/* Usage Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU Usage */}
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#05F26C]/10 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-[#05F26C]" />
                </div>
                <span className="text-gray-400 text-sm">CPU Usage</span>
              </div>
              {stats && (
                <span className="text-xs text-[#05F26C]">
                  {stats.cpu.percent > 0 ? '+' : ''}{stats.cpu.percent.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="text-4xl font-bold text-white">
              {stats?.cpu.percent.toFixed(0) || '0'}%
            </div>
          </div>

          {/* RAM Usage */}
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#05F26C]/10 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#05F26C]" />
                </div>
                <span className="text-gray-400 text-sm">RAM Usage</span>
              </div>
              {stats && (
                <span className="text-xs text-[#05F26C]">
                  +{((stats.memory.usageMB / stats.memory.limitMB) * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="text-4xl font-bold text-white">
              {stats?.memory.percent.toFixed(0) || '0'}%
            </div>
          </div>

          {/* Storage */}
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#05F26C]/10 rounded-lg flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-[#05F26C]" />
                </div>
                <span className="text-gray-400 text-sm">Storage</span>
              </div>
              <span className="text-xs text-gray-500">-3%</span>
            </div>
            <div className="text-4xl font-bold text-white">38%</div>
          </div>
        </div>

        {/* Workflow Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Workflows Actifs */}
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Workflows Actifs</div>
                <div className="text-5xl font-bold text-white">{workflowCount}</div>
                <div className="text-gray-500 text-sm mt-2">Workflows configurés sur cette instance</div>
              </div>
              <div className="text-[#05F26C] text-4xl font-bold">{workflowCount}</div>
            </div>
          </div>

          {/* Exécutions Totales */}
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2">Exécutions Totales</div>
                <div className="text-5xl font-bold text-white">{executionCount.toLocaleString()}</div>
                <div className="text-gray-500 text-sm mt-2">Nombre total d'exécutions de workflows</div>
              </div>
              <div className="text-[#05F26C] text-4xl font-bold">{executionCount.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        {isRunning && history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPU Usage Chart */}
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">CPU Usage (24h)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0a1b1e" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#132426', 
                      border: '1px solid #0a1b1e',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleString('fr-FR')}
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'CPU']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#05F26C" 
                    strokeWidth={2}
                    dot={{ fill: '#05F26C', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* RAM Usage Chart */}
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">RAM Usage (24h)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#05F26C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#05F26C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0a1b1e" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#132426', 
                      border: '1px solid #0a1b1e',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleString('fr-FR')}
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'RAM']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#05F26C" 
                    strokeWidth={2}
                    fill="url(#memoryGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Logs Section */}
        {isRunning && logs.length > 0 && (
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg">
            <div className="p-6 border-b border-[#0a1b1e]">
              <h3 className="text-white font-semibold">Logs récents</h3>
            </div>
            <div ref={logsContainerRef} className="p-4 bg-black/30 font-mono text-sm space-y-2 max-h-[1536px] overflow-y-auto">
              {logs.slice(0, 10).map((log, idx) => {
                const isError = log.toLowerCase().includes('error');
                const isWarning = log.toLowerCase().includes('warn');
                const isSuccess = log.toLowerCase().includes('success');
                const isInfo = log.toLowerCase().includes('info');
                
                let color = 'text-gray-400';
                if (isError) color = 'text-red-400';
                else if (isWarning) color = 'text-yellow-400';
                else if (isSuccess) color = 'text-green-400';
                else if (isInfo) color = 'text-blue-400';
                
                return (
                  <div key={idx} className={`${color} break-all`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Not Running State */}
        {!isRunning && (
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Server className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Instance arrêtée</h3>
            <p className="text-gray-400 mb-6">Démarrez votre instance pour voir les métriques et les logs</p>
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="px-6 py-3 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] font-semibold rounded-lg transition-all disabled:opacity-50 inline-flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Démarrer l'instance</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
