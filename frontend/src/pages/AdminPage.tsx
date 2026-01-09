import React, { useState, useEffect } from 'react';
import { Users, Shield, Trash2, Activity, Database, Key as KeyIcon, TrendingUp, Server, Eye, EyeOff, Copy, Search } from 'lucide-react';
import { authService } from '../services/authService';
import { getApiUrl } from '../config/api';
import { useToast } from '../contexts/ToastContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
  subdomain?: string;
  instance_status?: string;
  api_keys_count: number;
  api_key_id?: string;
}

interface RevealedApiKey {
  userId: string;
  apiKey: string;
}

interface Stats {
  total_users: number;
  admin_count: number;
  total_instances: number;
  running_instances: number;
  total_api_keys: number;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedApiKeys, setRevealedApiKeys] = useState<RevealedApiKey[]>([]);
  const [revealingUserId, setRevealingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast, showDemand } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = authService.getToken();
      
      const [usersRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/users'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl('/api/admin/stats'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const token = authService.getToken();
      const response = await fetch(getApiUrl(`/api/admin/users/${userId}/role`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      await loadData();
      showToast('success', 'Rôle modifié avec succès');
    } catch (error: any) {
      showToast('error', error.message || 'Erreur lors de la modification du rôle');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    showDemand(
      'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.',
      async () => {
        try {
          const token = authService.getToken();
          const response = await fetch(getApiUrl(`/api/admin/users/${userId}`), {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
          }

          await loadData();
          showToast('success', 'Utilisateur supprimé avec succès');
        } catch (error: any) {
          showToast('error', error.message || 'Erreur lors de la suppression');
        }
      }
    );
  };

  const handleRevealApiKey = async (userId: string, apiKeyId?: string) => {
    if (!apiKeyId) {
      showToast('warning', 'Cet utilisateur n\'a pas de clé API');
      return;
    }

    // Check if already revealed
    const existing = revealedApiKeys.find(k => k.userId === userId);
    if (existing) {
      // Hide it
      setRevealedApiKeys(revealedApiKeys.filter(k => k.userId !== userId));
      return;
    }

    setRevealingUserId(userId);
    try {
      const token = authService.getToken();
      const response = await fetch(getApiUrl(`/api/admin/users/${userId}/api-key`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de la récupération de la clé API');
      }

      const data = await response.json();
      setRevealedApiKeys([...revealedApiKeys, { userId, apiKey: data.apiKey }]);
    } catch (error: any) {
      showToast('error', error.message || 'Impossible de révéler la clé API');
    } finally {
      setRevealingUserId(null);
    }
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    showToast('success', 'Clé API copiée dans le presse-papiers');
  };

  const getRevealedApiKey = (userId: string) => {
    return revealedApiKeys.find(k => k.userId === userId);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030709] flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#05F26C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030709]">
      {/* Header */}
      <div className="bg-[#132426] border-b border-[#0a1b1e] px-6 py-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#05F26C] rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#132426]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Administration</h1>
            <p className="text-gray-400 mt-1">Gérez les utilisateurs et surveillez la plateforme</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Users */}
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6 shadow-2xl hover:border-[#05F26C]/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Utilisateurs</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.total_users}</p>
                  <div className="flex items-center mt-2 text-xs text-[#05F26C]">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>Total</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Admins */}
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6 shadow-2xl hover:border-[#05F26C]/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Admins</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.admin_count}</p>
                  <div className="flex items-center mt-2 text-xs text-purple-400">
                    <Shield className="w-3 h-3 mr-1" />
                    <span>Privilèges</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Total Instances */}
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6 shadow-2xl hover:border-[#05F26C]/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Instances</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.total_instances}</p>
                  <div className="flex items-center mt-2 text-xs text-green-400">
                    <Database className="w-3 h-3 mr-1" />
                    <span>Total</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            {/* Running Instances */}
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6 shadow-2xl hover:border-[#05F26C]/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">En ligne</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.running_instances}</p>
                  <div className="flex items-center mt-2 text-xs text-[#05F26C]">
                    <Activity className="w-3 h-3 mr-1" />
                    <span>Actives</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-[#05F26C]/10 rounded-lg flex items-center justify-center">
                  <Server className="w-6 h-6 text-[#05F26C]" />
                </div>
              </div>
            </div>

            {/* API Keys */}
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6 shadow-2xl hover:border-[#05F26C]/20 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Clés API</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.total_api_keys}</p>
                  <div className="flex items-center mt-2 text-xs text-orange-400">
                    <KeyIcon className="w-3 h-3 mr-1" />
                    <span>Actives</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <KeyIcon className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>
          </div>
          )}

        {/* Users Table */}
        <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#0a1b1e]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Utilisateurs</h2>
                <p className="text-sm text-gray-400 mt-1">{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} {searchTerm && `trouvé${filteredUsers.length > 1 ? 's' : ''}`}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#05F26C] rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Temps réel</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a1b1e] border border-[#0a1b1e] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#05F26C]/50 focus:border-[#05F26C] transition-all outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a1b1e] border-b border-[#0a1b1e]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Instance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Clés API
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0a1b1e]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#0a1b1e]/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#05F26C]/10 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#05F26C]" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#0a1b1e] transition-all cursor-pointer outline-none ${
                          user.role === 'admin'
                            ? 'bg-[#05F26C]/10 text-[#05F26C] hover:bg-[#05F26C]/20'
                            : 'bg-[#132426] text-gray-300 hover:bg-[#0a1b1e]'
                        }`}
                      >
                        <option value="user" className="bg-[#132426] text-white">User</option>
                        <option value="admin" className="bg-[#132426] text-white">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.subdomain ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{user.subdomain}</div>
                            <div className="flex items-center mt-1">
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                user.instance_status === 'running' 
                                  ? 'bg-[#05F26C]' 
                                  : 'bg-gray-500'
                              }`}></div>
                              <span className={`text-xs ${
                                user.instance_status === 'running' 
                                  ? 'text-[#05F26C]' 
                                  : 'text-gray-400'
                              }`}>
                                {user.instance_status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Aucune instance</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.api_keys_count > 0 ? (
                        <div className="flex items-center space-x-2">
                          {getRevealedApiKey(user.id) ? (
                            <>
                              <div className="flex items-center space-x-2 bg-[#0a1b1e] border border-[#05F26C]/30 rounded-lg px-3 py-1.5">
                                <code className="text-xs text-[#05F26C] font-mono">
                                  {getRevealedApiKey(user.id)?.apiKey.substring(0, 20)}...
                                </code>
                                <button
                                  onClick={() => copyApiKey(getRevealedApiKey(user.id)?.apiKey || '')}
                                  className="p-1 text-[#05F26C] hover:bg-[#05F26C]/10 rounded transition-all"
                                  title="Copier"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                onClick={() => handleRevealApiKey(user.id, user.api_key_id)}
                                className="p-1.5 text-gray-400 hover:text-[#05F26C] hover:bg-[#05F26C]/10 rounded-lg transition-all"
                                title="Masquer"
                                disabled={revealingUserId === user.id}
                              >
                                <EyeOff className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-semibold text-[#05F26C]">
                                {user.api_keys_count}
                              </span>
                              <KeyIcon className="w-3.5 h-3.5 text-[#05F26C]" />
                              <button
                                onClick={() => handleRevealApiKey(user.id, user.api_key_id)}
                                className="p-1.5 text-gray-400 hover:text-[#05F26C] hover:bg-[#05F26C]/10 rounded-lg transition-all"
                                title="Révéler la clé API"
                                disabled={revealingUserId === user.id}
                              >
                                {revealingUserId === user.id ? (
                                  <div className="w-4 h-4 border-2 border-[#05F26C] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all hover:scale-110"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                {searchTerm ? (
                  <>
                    <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Aucun utilisateur trouvé pour "{searchTerm}"</p>
                  </>
                ) : (
                  <>
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Aucun utilisateur trouvé</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
