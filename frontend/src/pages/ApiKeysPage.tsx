import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import { getApiUrl } from '../config/api';

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
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<RevealedKey[]>([]);
  const [revealingKeyId, setRevealingKeyId] = useState<string | null>(null);

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
      setError(null);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les clés API');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setCreating(true);
    setError(null);

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
    } catch (error: any) {
      setError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé API ?')) return;

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
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression de la clé API');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
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
      alert('Impossible de révéler la clé API');
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
    setError(null);
    setShowApiKey(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clés API</h1>
          <p className="mt-2 text-gray-600">
            Gérez vos clés d'accès API pour l'intégration externe
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={apiKeys.length >= 1}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle clé</span>
        </button>
      </div>

      {/* Limit notice */}
      {apiKeys.length >= 1 && (
        <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Limite atteinte
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Vous avez atteint la limite d'1 clé API par utilisateur. Supprimez votre clé existante pour en créer une nouvelle.
            </p>
          </div>
        </div>
      )}

      {/* API Keys List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune clé API
          </h3>
          <p className="text-gray-600 mb-4">
            Créez votre première clé pour commencer à utiliser l'API
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Créer une clé</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {apiKeys.map((key) => {
              const revealed = getRevealedKey(key.id);
              return (
                <div key={key.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
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
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                            />
                            <button
                              onClick={() => copyToClipboard(revealed.key)}
                              className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Copier"
                            >
                              {copiedKey ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleRevealKey(key.id)}
                        disabled={revealingKeyId === key.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title={revealed ? "Masquer la clé" : "Voir la clé"}
                      >
                        {revealingKeyId === key.id ? (
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : revealed ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {newApiKey ? 'Clé API créée' : 'Nouvelle clé API'}
              </h2>
            </div>

            {newApiKey ? (
              <div className="p-6 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-2">
                    ✓ Clé créée avec succès
                  </p>
                  <p className="text-sm text-green-700">
                    Copiez cette clé maintenant. Elle ne sera plus affichée.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre clé API
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? "text" : "password"}
                        readOnly
                        value={newApiKey}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                        title={showApiKey ? "Masquer" : "Afficher"}
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <button
                      onClick={() => copyToClipboard(newApiKey)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      title="Copier"
                    >
                      {copiedKey ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la clé
                  </label>
                  <input
                    id="keyName"
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Ex: Production API Key"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Donnez un nom descriptif pour identifier cette clé
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50"
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
