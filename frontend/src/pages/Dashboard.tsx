import { useState, useEffect } from 'react';
import { 
  Server, 
  Circle, 
  Play, 
  Square, 
  RefreshCw, 
  ExternalLink, 
  Activity,
  Cpu,
  HardDrive,
  Network,
  Clock,
  Settings,
  Terminal,
  AlertTriangle,
  TrendingUp,
  RotateCw,
  Users,
  Mail,
  UserPlus,
  Shield,
  Trash2
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { authService, User } from '../services/authService';
import { instanceService, Instance } from '../services/instanceService';
import { teamService, TeamMember } from '../services/teamService';
import { getApiUrl } from '../config/api';

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

type TabType = 'console' | 'metrics' | 'errors' | 'team' | 'settings';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [instance, setInstance] = useState<Instance | null>(null);
  const [stats, setStats] = useState<InstanceStats | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'viewer'>('viewer');
  const [activeTab, setActiveTab] = useState<TabType>('console');

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (instance?.status === 'running') {
        loadStats();
        if (activeTab === 'console') loadLogs();
        if (activeTab === 'errors') loadErrors();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [instance?.status, activeTab]);

  const loadData = async () => {
    try {
      const userData = authService.getUser();
      setUser(userData);

      const instanceData = await instanceService.getMyInstance();
      setInstance(instanceData);

      if (instanceData?.status === 'running') {
        await loadStats();
        await loadHistory();
        await loadLogs();
        await loadErrors();
      }
      
      await loadTeamMembers();
    } catch (err) {
      console.error('Error loading data:', err);
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
      const logData = await instanceService.getLogs(100);
      setLogs(logData);
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  const loadErrors = async () => {
    try {
      const errorData = await instanceService.getErrors(100);
      setErrors(errorData);
    } catch (err) {
      console.error('Error loading errors:', err);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const members = await teamService.getMembers();
      setTeamMembers(members);
    } catch (err) {
      console.error('Error loading team members:', err);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;
    
    try {
      await teamService.inviteMember(inviteEmail, inviteRole);
      setInviteEmail('');
      setInviteRole('viewer');
      await loadTeamMembers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to invite member');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await teamService.removeMember(memberId);
      await loadTeamMembers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId: number, role: 'admin' | 'viewer') => {
    try {
      await teamService.updateMemberRole(memberId, role);
      await loadTeamMembers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    setError('');
    try {
      await instanceService.startInstance();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start instance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    setError('');
    try {
      await instanceService.stopInstance();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to stop instance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestart = async () => {
    setActionLoading(true);
    setError('');
    try {
      await instanceService.restartInstance();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to restart instance');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isRunning = instance?.status === 'running';

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Header - Pterodactyl Style */}
      <div className="bg-[#1a1f2e] border-b border-[#2d3748] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded flex items-center justify-center ${
              isRunning ? 'bg-green-500' : 'bg-gray-500'
            }`}>
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                {instance?.subdomain || 'N8N Instance'}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Circle className={`w-2 h-2 ${isRunning ? 'text-green-500 fill-green-500' : 'text-gray-500 fill-gray-500'}`} />
                <span className="text-sm text-gray-400">
                  {instance?.status || 'Provisioning'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isRunning && (
              <button
                onClick={handleRestart}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#2d3748] hover:bg-[#374151] text-white rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Restart</span>
              </button>
            )}
            {isRunning ? (
              <button
                onClick={handleStop}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>
            )}
            <a
              href={instance?.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center space-x-2 ${
                isRunning
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              onClick={(e) => !isRunning && e.preventDefault()}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open</span>
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {!instance ? (
        <div className="mx-6 mt-6 bg-[#1a1f2e] border border-[#2d3748] rounded p-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Provisioning Instance...
          </h2>
          <p className="text-gray-400 mb-4">
            Your N8N instance is being created. This usually takes 30-60 seconds.
          </p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          {/* Tabs - Pterodactyl Style */}
          <div className="bg-[#1a1f2e] border-b border-[#2d3748]">
            <div className="px-6">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('console')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'console'
                      ? 'text-white border-blue-500'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  <Terminal className="w-4 h-4 inline mr-2" />
                  Console
                </button>
                <button
                  onClick={() => setActiveTab('metrics')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'metrics'
                      ? 'text-white border-blue-500'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  <Activity className="w-4 h-4 inline mr-2" />
                  Metrics
                </button>
                <button
                  onClick={() => setActiveTab('errors')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'errors'
                      ? 'text-white border-blue-500'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Workflow Errors
                  {errors.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                      {errors.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'team'
                      ? 'text-white border-blue-500'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Team
                  {teamMembers.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {teamMembers.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'settings'
                      ? 'text-white border-blue-500'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-6">
            {/* Console Tab */}
            {activeTab === 'console' && (
              <div className="bg-[#1a1f2e] border border-[#2d3748] rounded">
                <div className="p-4 border-b border-[#2d3748] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-white">Console Output</h3>
                  </div>
                  <button
                    onClick={loadLogs}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                <div className="p-4 font-mono text-xs text-gray-300 bg-black/30 h-[600px] overflow-y-auto">
                  {!isRunning ? (
                    <div className="text-gray-500 text-center py-12">
                      Instance is not running. Start the instance to view logs.
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-gray-500 text-center py-12">
                      No logs available yet...
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="mb-1 hover:bg-[#2d3748]/30 px-2 py-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div className="space-y-6">
                {!isRunning ? (
                  <div className="bg-[#1a1f2e] border border-[#2d3748] rounded p-12 text-center">
                    <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Start the instance to view metrics
                    </p>
                  </div>
                ) : stats ? (
                  <>
                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-4 gap-4">
                      {/* CPU */}
                      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Cpu className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-300">CPU</span>
                          </div>
                          <span className="text-lg font-bold text-white">
                            {stats.cpu.percent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(stats.cpu.percent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Memory */}
                      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <HardDrive className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-gray-300">Memory</span>
                          </div>
                          <span className="text-lg font-bold text-white">
                            {stats.memory.percent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(stats.memory.percent, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {stats.memory.usageMB.toFixed(0)} MB / {stats.memory.limitMB.toFixed(0)} MB
                        </p>
                      </div>

                      {/* Network */}
                      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Network className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-300">Network</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">↓ RX</span>
                            <span className="text-white">{stats.network.rxMB.toFixed(2)} MB</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">↑ TX</span>
                            <span className="text-white">{stats.network.txMB.toFixed(2)} MB</span>
                          </div>
                        </div>
                      </div>

                      {/* Disk I/O */}
                      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <HardDrive className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-gray-300">Disk I/O</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Read</span>
                            <span className="text-white">{stats.disk.readMB.toFixed(2)} MB</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Write</span>
                            <span className="text-white">{stats.disk.writeMB.toFixed(2)} MB</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Charts */}
                    {history.length > 0 && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* CPU Chart */}
                        <div className="bg-[#1a1f2e] border border-[#2d3748] rounded p-4">
                          <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                            CPU Usage (24h)
                          </h3>
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={history}>
                              <defs>
                                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                              <XAxis 
                                dataKey="timestamp" 
                                stroke="#6b7280"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                              />
                              <YAxis 
                                stroke="#6b7280"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1a1f2e',
                                  border: '1px solid #2d3748',
                                  borderRadius: '4px',
                                  color: '#fff'
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="cpu"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#cpuGradient)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Memory Chart */}
                        <div className="bg-[#1a1f2e] border border-[#2d3748] rounded p-4">
                          <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 text-purple-500" />
                            Memory Usage (24h)
                          </h3>
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={history}>
                              <defs>
                                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                              <XAxis 
                                dataKey="timestamp" 
                                stroke="#6b7280"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                              />
                              <YAxis 
                                stroke="#6b7280"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1a1f2e',
                                  border: '1px solid #2d3748',
                                  borderRadius: '4px',
                                  color: '#fff'
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="memory"
                                stroke="#a855f7"
                                strokeWidth={2}
                                fill="url(#memGradient)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-[#1a1f2e] border border-[#2d3748] rounded p-12 text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading metrics...</p>
                  </div>
                )}
              </div>
            )}

            {/* Workflow Errors Tab */}
            {activeTab === 'errors' && (
              <div className="bg-[#1a1f2e] border border-[#2d3748] rounded">
                <div className="p-4 border-b border-[#2d3748] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-semibold text-white">Workflow Errors</h3>
                    {errors.length > 0 && (
                      <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                        {errors.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={loadErrors}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                <div className="p-4 font-mono text-xs bg-black/30 h-[600px] overflow-y-auto">
                  {!isRunning ? (
                    <div className="text-gray-500 text-center py-12">
                      Instance is not running. Start the instance to view errors.
                    </div>
                  ) : errors.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Circle className="w-6 h-6 text-green-500 fill-green-500" />
                      </div>
                      <p className="text-green-400 font-semibold mb-2">No errors detected</p>
                      <p className="text-gray-500 text-xs">Your workflows are running smoothly!</p>
                    </div>
                  ) : (
                    errors.map((error, idx) => (
                      <div
                        key={idx}
                        className="mb-2 p-2 bg-red-900/20 border border-red-800/50 rounded text-red-300 hover:bg-red-900/30"
                      >
                        {error}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                {/* Invite Member */}
                <div className="bg-[#1a1f2e] border border-[#2d3748] rounded">
                  <div className="p-4 border-b border-[#2d3748]">
                    <h3 className="text-sm font-semibold text-white flex items-center">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Team Member
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1">
                        <input
                          type="email"
                          placeholder="Email address"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-black/30 border border-[#2d3748] rounded text-sm text-white placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as 'admin' | 'viewer')}
                          className="px-3 py-2 bg-black/30 border border-[#2d3748] rounded text-sm text-white"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <button
                        onClick={handleInviteMember}
                        disabled={!inviteEmail}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Send Invite</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      <strong>Admin:</strong> Can manage team and settings. <strong>Viewer:</strong> Can only view workflows and metrics.
                    </p>
                  </div>
                </div>

                {/* Team Members List */}
                <div className="bg-[#1a1f2e] border border-[#2d3748] rounded">
                  <div className="p-4 border-b border-[#2d3748]">
                    <h3 className="text-sm font-semibold text-white flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Team Members ({teamMembers.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-[#2d3748]">
                    {teamMembers.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No team members yet</p>
                        <p className="text-gray-500 text-xs mt-1">Invite someone to collaborate on your instance</p>
                      </div>
                    ) : (
                      teamMembers.map((member) => (
                        <div key={member.id} className="p-4 hover:bg-black/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {member.user_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium text-white">{member.user_name}</p>
                                  {member.role === 'owner' && (
                                    <span className="px-2 py-0.5 bg-yellow-900/30 border border-yellow-700 text-yellow-400 text-xs rounded">
                                      Owner
                                    </span>
                                  )}
                                  {member.role === 'admin' && (
                                    <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-700 text-blue-400 text-xs rounded flex items-center space-x-1">
                                      <Shield className="w-3 h-3" />
                                      <span>Admin</span>
                                    </span>
                                  )}
                                  {member.role === 'viewer' && (
                                    <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                                      Viewer
                                    </span>
                                  )}
                                  {member.status === 'pending' && (
                                    <span className="px-2 py-0.5 bg-orange-900/30 border border-orange-700 text-orange-400 text-xs rounded">
                                      Pending
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{member.user_email}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {member.status === 'active' && member.joined_at
                                    ? `Joined ${new Date(member.joined_at).toLocaleDateString()}`
                                    : `Invited by ${member.invited_by_name}`}
                                </p>
                              </div>
                            </div>

                            {member.role !== 'owner' && (
                              <div className="flex items-center space-x-2">
                                {member.status === 'active' && (
                                  <select
                                    value={member.role}
                                    onChange={(e) => handleUpdateRole(member.id, e.target.value as 'admin' | 'viewer')}
                                    className="px-2 py-1 bg-black/30 border border-[#2d3748] rounded text-xs text-white"
                                  >
                                    <option value="viewer">Viewer</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                )}
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                  title="Remove member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Instance Information */}
                <div className="bg-[#1a1f2e] border border-[#2d3748] rounded">
                  <div className="p-4 border-b border-[#2d3748]">
                    <h3 className="text-sm font-semibold text-white">Instance Information</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Instance URL
                      </label>
                      <input
                        type="text"
                        value={instance.url}
                        readOnly
                        className="w-full px-3 py-2 bg-black/30 border border-[#2d3748] rounded text-sm text-white"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                          Subdomain
                        </label>
                        <input
                          type="text"
                          value={instance.subdomain}
                          readOnly
                          className="w-full px-3 py-2 bg-black/30 border border-[#2d3748] rounded text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                          Port
                        </label>
                        <input
                          type="text"
                          value={instance.port}
                          readOnly
                          className="w-full px-3 py-2 bg-black/30 border border-[#2d3748] rounded text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Created At
                      </label>
                      <input
                        type="text"
                        value={new Date(instance.createdAt).toLocaleString('fr-FR')}
                        readOnly
                        className="w-full px-3 py-2 bg-black/30 border border-[#2d3748] rounded text-sm text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-[#1a1f2e] border border-[#2d3748] rounded">
                  <div className="p-4 border-b border-[#2d3748]">
                    <h3 className="text-sm font-semibold text-white">Instance Control</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded">
                      <div>
                        <p className="text-sm font-medium text-white">Restart Instance</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Restart your N8N instance to apply changes or fix issues
                        </p>
                      </div>
                      <button
                        onClick={handleRestart}
                        disabled={actionLoading || !isRunning}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>Restart</span>
                      </button>
                    </div>

                    {isRunning ? (
                      <div className="flex items-center justify-between p-3 bg-black/30 rounded">
                        <div>
                          <p className="text-sm font-medium text-white">Stop Instance</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Stop your instance to save resources
                          </p>
                        </div>
                        <button
                          onClick={handleStop}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <Square className="w-4 h-4" />
                          <span>Stop</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-black/30 rounded">
                        <div>
                          <p className="text-sm font-medium text-white">Start Instance</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Start your N8N instance to begin working
                          </p>
                        </div>
                        <button
                          onClick={handleStart}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
