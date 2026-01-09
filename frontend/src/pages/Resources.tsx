import { useState, useEffect } from 'react';
import { FolderOpen, FileText, Upload, User, Calendar, TrendingUp, X, Code, Trash2, Heart } from 'lucide-react';
import { authService } from '../services/authService';
import { API_URL } from '../config/api';
import { useToast } from '../contexts/ToastContext';

interface PublicWorkflow {
  id: number;
  name: string;
  description: string;
  workflow_json: any;
  author_name: string;
  user_id: string;
  downloads: number;
  favorites_count: number;
  created_at: string;
  is_favorite?: boolean;
}

export default function Resources() {
  const [publicWorkflows, setPublicWorkflows] = useState<PublicWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [favoritingId, setFavoritingId] = useState<number | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<PublicWorkflow | null>(null);
  const currentUser = authService.getCurrentUser();
  const { showToast, showDemand } = useToast();

  useEffect(() => {
    fetchPublicWorkflows();
  }, []);

  const fetchPublicWorkflows = async () => {
    try {
      const response = await fetch(`${API_URL}/api/public-workflows`);
      const data = await response.json();
      if (data.success) {
        setPublicWorkflows(data.data);
      }
    } catch (error) {
      console.error('Error fetching public workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseWorkflow = async (workflowId: number) => {
    setImporting(workflowId);
    try {
      const response = await fetch(`${API_URL}/api/public-workflows/${workflowId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        showToast('success', 'Workflow importé avec succès dans votre instance N8N!');
        fetchPublicWorkflows();
        setSelectedWorkflow(null);
        
        // Open N8N editor if URL is provided
        if (data.data?.editorUrl) {
          setTimeout(() => {
            window.open(data.data.editorUrl, '_blank');
          }, 1000);
        }
      } else {
        const errorData = await response.json();
        console.error('Import error:', errorData);
        const errorMessage = errorData.message || 'Erreur lors de l\'import du workflow';
        showToast('error', errorMessage);
      }
    } catch (error) {
      console.error('Error using workflow:', error);
      showToast('error', 'Erreur lors de l\'import du workflow - vérifiez que votre instance N8N est active');
    } finally {
      setImporting(null);
    }
  };

  const handleDeleteWorkflow = async (workflowId: number) => {
    showDemand(
      'Êtes-vous sûr de vouloir supprimer ce workflow ?',
      async () => {
        setDeleting(workflowId);
        try {
          const response = await fetch(`${API_URL}/api/public-workflows/${workflowId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authService.getToken()}`
            }
          });

          if (response.ok) {
            showToast('success', 'Workflow supprimé avec succès!');
            fetchPublicWorkflows();
            setSelectedWorkflow(null);
          } else {
            showToast('error', 'Erreur lors de la suppression du workflow');
          }
        } catch (error) {
          console.error('Error deleting workflow:', error);
          showToast('error', 'Erreur lors de la suppression du workflow');
        } finally {
          setDeleting(null);
        }
      }
    );
  };

  const handleToggleFavorite = async (workflowId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setFavoritingId(workflowId);
    try {
      const response = await fetch(`${API_URL}/api/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ workflowId })
      });

      if (response.ok) {
        const data = await response.json();
        setPublicWorkflows(prev => prev.map(wf => 
          wf.id === workflowId 
            ? { 
                ...wf, 
                is_favorite: data.favorited,
                favorites_count: wf.favorites_count + (data.favorited ? 1 : -1)
              }
            : wf
        ));
        if (selectedWorkflow?.id === workflowId) {
          setSelectedWorkflow(prev => prev ? { 
            ...prev, 
            is_favorite: data.favorited,
            favorites_count: prev.favorites_count + (data.favorited ? 1 : -1)
          } : null);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoritingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#030709]">
      {/* Header */}
      <div className="bg-[#132426] border-b border-[#0a1b1e] px-6 py-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-[#05F26C] rounded-lg flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-[#132426]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Ressources</h1>
            <p className="text-gray-400 mt-1">Workflows communautaires</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {/* Public Workflows Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-[#05F26C]" />
              <h2 className="text-2xl font-bold text-white">Workflows Communautaires</h2>
            </div>
            <span className="text-sm text-gray-400">
              {publicWorkflows.length} workflow{publicWorkflows.length > 1 ? 's' : ''} disponible{publicWorkflows.length > 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-8 text-center">
              <p className="text-gray-400">Chargement des workflows...</p>
            </div>
          ) : publicWorkflows.length === 0 ? (
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-8 text-center">
              <p className="text-gray-400">Aucun workflow public disponible pour le moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  onClick={() => setSelectedWorkflow(workflow)}
                  className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-4 hover:border-[#05F26C]/30 transition-all cursor-pointer relative"
                >
                  {/* Favorite button */}
                  <button
                    onClick={(e) => handleToggleFavorite(workflow.id, e)}
                    disabled={favoritingId === workflow.id}
                    className="absolute top-3 right-3 p-2 bg-[#030709] hover:bg-[#0a1b1e] rounded-lg transition-all disabled:opacity-50 z-10"
                  >
                    <Heart 
                      className={`w-4 h-4 ${workflow.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                    />
                  </button>

                  <h3 className="text-white font-semibold mb-2 pr-10">{workflow.name}</h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{workflow.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{workflow.author_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{workflow.downloads}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3 text-red-500" />
                        <span>{workflow.favorites_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(workflow.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Workflow Details */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedWorkflow(null)}>
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#0a1b1e]">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedWorkflow.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{selectedWorkflow.author_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(selectedWorkflow.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{selectedWorkflow.downloads} imports</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>{selectedWorkflow.favorites_count} favoris</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="p-2 hover:bg-[#0a1b1e] rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-400">{selectedWorkflow.description}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Code className="w-5 h-5 text-[#05F26C]" />
                  <h3 className="text-lg font-semibold text-white">Configuration JSON</h3>
                </div>
                <pre className="bg-[#030709] border border-[#0a1b1e] rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                  {JSON.stringify(selectedWorkflow.workflow_json, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-[#0a1b1e]">
              <div className="flex items-center space-x-2">
                {currentUser && currentUser.id === selectedWorkflow.user_id && (
                  <button
                    onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                    disabled={deleting === selectedWorkflow.id}
                    className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {deleting === selectedWorkflow.id ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Suppression...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleToggleFavorite(selectedWorkflow.id)}
                  disabled={favoritingId === selectedWorkflow.id}
                  className="px-6 py-2 bg-[#0a1b1e] hover:bg-[#132426] rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Heart 
                    className={`w-4 h-4 ${selectedWorkflow.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                  />
                  <span className="text-white">{selectedWorkflow.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</span>
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="px-6 py-2 bg-[#0a1b1e] hover:bg-[#132426] text-white rounded-lg transition-all"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handleUseWorkflow(selectedWorkflow.id)}
                  disabled={importing === selectedWorkflow.id}
                  className="px-6 py-2 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] font-semibold rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {importing === selectedWorkflow.id ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Import...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Utiliser ce workflow</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
