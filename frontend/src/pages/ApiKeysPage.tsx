import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import { getApiUrl } from '../config/api';
import { useToast } from '../contexts/ToastContext';

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
}

interface RevealedKey {
  id: string;
  key: string;
}

const ApiKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copiedKey, _setCopiedKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<RevealedKey[]>([]);
  const [revealingKeyId, setRevealingKeyId] = useState<string | null>(null);
  const { showToast, showDemand } = useToast();

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(getApiUrl('/api/api-keys'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();
      setApiKeys(data.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      showToast('error', 'Impossible de charger les clés API');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setCreating(true);

    try {
      const token = authService.getToken();
      const response = await fetch(getApiUrl('/api/api-keys'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: keyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      setNewApiKey(data.data.apiKey);
      setKeyName('');
      await loadApiKeys();
      showToast('success', 'Clé API créée avec succès');
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    showDemand(
      'Êtes-vous sûr de vouloir supprimer cette clé API ?',
      async () => {
        try {
          const token = authService.getToken();
          const response = await fetch(getApiUrl(`/api/api-keys/${id}`), {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Erreur lors de la suppression');

          await loadApiKeys();
          showToast('success', 'Clé API supprimée avec succès');
        } catch (error) {
          console.error('Erreur:', error);
          showToast('error', 'Erreur lors de la suppression de la clé API');
        }
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Clé API copiée dans le presse-papiers');
  };

  const handleRevealKey = async (keyId: string) => {
    // Check if already revealed
    const existing = revealedKeys.find(k => k.id === keyId);
    if (existing) {
      // Toggle visibility
      setRevealedKeys(revealedKeys.filter(k => k.id !== keyId));
      return;
    }

    setRevealingKeyId(keyId);
    try {
      const token = authService.getToken();
      const response = await fetch(getApiUrl(`/api/api-keys/${keyId}/reveal`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors de la révélation de la clé');

      const data = await response.json();
      setRevealedKeys([...revealedKeys, { id: keyId, key: data.data.apiKey }]);
    } catch (error) {
      console.error('Erreur:', error);
      showToast('error', 'Impossible de révéler la clé API');
    } finally {
      setRevealingKeyId(null);
    }
  };

  const getRevealedKey = (keyId: string) => {
    return revealedKeys.find(k => k.id === keyId);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setNewApiKey(null);
    setKeyName('');
    setShowApiKey(false);
  };

  return (
    <div className="w-full p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clés API</h1>
          <p className="mt-2 text-gray-400">
            Gérez vos clés d'accès API pour l'intégration externe
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={apiKeys.length >= 1}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] rounded-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle clé</span>
        </button>
      </div>

      {/* Limit notice */}
      {apiKeys.length >= 1 && (
        <div className="flex items-start space-x-3 p-4 bg-[#05F26C]/10 border border-[#05F26C]/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-[#05F26C] mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              Limite atteinte
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Vous avez atteint la limite d'1 clé API par utilisateur. Supprimez votre clé existante pour en créer une nouvelle.
            </p>
          </div>
        </div>
      )}

      {/* API Keys List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#05F26C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-[#132426] rounded-xl border-2 border-dashed border-[#0a1b1e]">
          <Key className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Aucune clé API
          </h3>
          <p className="text-gray-400 mb-4">
            Créez votre première clé pour commencer à utiliser l'API
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] rounded-lg font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Créer une clé</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#132426] rounded-xl shadow-xl border border-[#0a1b1e] overflow-hidden">
          <div className="divide-y divide-[#0a1b1e]">
            {apiKeys.map((key) => {
              const revealed = getRevealedKey(key.id);
              return (
                <div key={key.id} className="p-6 hover:bg-[#05F26C]/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-10 h-10 bg-[#05F26C] rounded-lg flex items-center justify-center shrink-0">
                        <Key className="w-5 h-5 text-[#132426]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white">{key.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Créée le {new Date(key.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {revealed && (
                          <div className="mt-3 flex items-center space-x-2">
                            <input
                              type="text"
                              readOnly
                              value={revealed.key}
                              className="flex-1 px-3 py-2 border border-[#0a1b1e] rounded-lg bg-[#0a0e10] text-[#05F26C] text-sm font-mono"
                            />
                            <button
                              onClick={() => copyToClipboard(revealed.key)}
                              className="p-2 text-gray-400 hover:bg-[#05F26C]/10 hover:text-[#05F26C] rounded-lg transition-colors"
                              title="Copier"
                            >
                              {copiedKey ? <Check className="w-5 h-5 text-[#05F26C]" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleRevealKey(key.id)}
                        disabled={revealingKeyId === key.id}
                        className="p-2 text-[#05F26C] hover:bg-[#05F26C]/10 rounded-lg transition-colors disabled:opacity-50"
                        title={revealed ? "Masquer la clé" : "Voir la clé"}
                      >
                        {revealingKeyId === key.id ? (
                          <div className="w-5 h-5 border-2 border-[#05F26C] border-t-transparent rounded-full animate-spin" />
                        ) : revealed ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#132426] rounded-xl shadow-2xl border border-[#0a1b1e] max-w-lg w-full">
            <div className="p-6 border-b border-[#0a1b1e]">
              <h2 className="text-2xl font-bold text-white">
                {newApiKey ? 'Clé API créée' : 'Nouvelle clé API'}
              </h2>
            </div>

            {newApiKey ? (
              <div className="p-6 space-y-4">
                <div className="p-4 bg-[#05F26C]/10 border border-[#05F26C]/30 rounded-lg">
                  <p className="text-sm font-medium text-[#05F26C] mb-2">
                    ✓ Clé créée avec succès
                  </p>
                  <p className="text-sm text-gray-400">
                    Copiez cette clé maintenant. Elle ne sera plus affichée.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Votre clé API
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? "text" : "password"}
                        readOnly
                        value={newApiKey}
                        className="w-full px-4 py-2 pr-12 border border-[#0a1b1e] rounded-lg bg-[#0a0e10] text-[#05F26C] text-sm font-mono focus:ring-2 focus:ring-[#05F26C]/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#05F26C] transition-colors"
                        title={showApiKey ? "Masquer" : "Afficher"}
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <button
                      onClick={() => copyToClipboard(newApiKey)}
                      className="px-4 py-2 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] rounded-lg font-semibold transition-colors"
                      title="Copier"
                    >
                      {copiedKey ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2.5 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] rounded-lg font-semibold transition-all"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label htmlFor="keyName" className="block text-sm font-medium text-white mb-2">
                    Nom de la clé
                  </label>
                  <input
                    id="keyName"
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Ex: Production API Key"
                    className="w-full px-4 py-2.5 border border-[#0a1b1e] rounded-lg bg-[#0a0e10] text-white placeholder-gray-500 focus:ring-2 focus:ring-[#05F26C]/50 focus:border-[#05F26C] transition-all"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Donnez un nom descriptif pour identifier cette clé
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 border border-[#0a1b1e] text-gray-400 rounded-lg font-medium hover:bg-[#05F26C]/5 hover:text-white transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2.5 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] rounded-lg font-semibold disabled:opacity-50 transition-all"
                  >
                    {creating ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysPage;
