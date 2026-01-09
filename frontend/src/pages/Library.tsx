import { Library as LibraryIcon, Search, Filter, Download, Heart, Code, X, Workflow } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { API_URL } from '../config/api';

interface Workflow {
  id: number | string;
  name: string;
  description?: string;
  workflow_json: any;
  author_name?: string;
  downloads?: number;
  created_at?: string;
  updatedAt?: string;
  active?: boolean;
  is_favorite?: boolean;
  favorited_at?: string;
  source: 'favorite' | 'instance';
}

export default function Library() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'favorites' | 'instance'>('all');
  const [favorites, setFavorites] = useState<Workflow[]>([]);
  const [instanceWorkflows, setInstanceWorkflows] = useState<Workflow[]>([]);
  const [_loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [favoritesRes, instanceRes] = await Promise.all([
        fetch(`${API_URL}/api/favorites`, {
          headers: { 'Authorization': `Bearer ${authService.getToken()}` }
        }),
        fetch(`${API_URL}/api/workflows`, {
          headers: { 'Authorization': `Bearer ${authService.getToken()}` }
        })
      ]);

      if (favoritesRes.ok) {
        const favData = await favoritesRes.json();
        setFavorites((favData.data || []).map((wf: any) => ({ ...wf, source: 'favorite' as const })));
      }

      if (instanceRes.ok) {
        const instData = await instanceRes.json();
        setInstanceWorkflows((instData.data || []).map((wf: any) => ({ ...wf, source: 'instance' as const })));
      }
    } catch (error) {
      console.error('Error fetching library data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'Tous', count: favorites.length + instanceWorkflows.length },
    { id: 'favorites', name: 'Favoris', count: favorites.length },
    { id: 'instance', name: 'Mon Instance N8N', count: instanceWorkflows.length },
  ];

  const allWorkflows = [
    ...favorites,
    ...instanceWorkflows
  ];

  const filteredWorkflows = allWorkflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (workflow.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory === 'favorites') {
      matchesCategory = workflow.source === 'favorite';
    } else if (selectedCategory === 'instance') {
      matchesCategory = workflow.source === 'instance';
    }
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#030709]">
      {/* Header */}
      <div className="bg-[#132426] border-b border-[#0a1b1e] px-6 py-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-[#05F26C] rounded-lg flex items-center justify-center">
            <LibraryIcon className="w-6 h-6 text-[#132426]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Bibliothèque</h1>
            <p className="text-gray-400 mt-1">Workflows prêts à l'emploi créés par la communauté</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un workflow..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#030709] border border-[#0a1b1e] focus:border-[#05F26C] rounded-lg text-white placeholder-gray-500 outline-none transition-colors"
            />
          </div>
          <button className="px-4 py-3 bg-[#030709] border border-[#0a1b1e] hover:border-[#05F26C] text-white rounded-lg transition-colors flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtres</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar Categories */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-4 sticky top-6">
              <h3 className="text-white font-semibold mb-3">Catégories</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id as 'all' | 'favorites' | 'instance')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-[#05F26C] text-[#132426] font-semibold'
                        : 'text-gray-400 hover:bg-[#05F26C]/10 hover:text-white'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Workflows Grid */}
          <div className="flex-1">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredWorkflows.map((workflow, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedWorkflow(workflow)}
                  className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6 hover:border-[#05F26C]/30 transition-all cursor-pointer relative"
                >
                  {/* Visual Indicators */}
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    {workflow.is_favorite && (
                      <div className="p-1.5 bg-red-500/10 rounded-full">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </div>
                    )}
                    {workflow.active && (
                      <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-semibold rounded">
                        Actif
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 pr-20">{workflow.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{workflow.description || 'Aucune description'}</p>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mb-4">
                    {workflow.source === 'favorite' && workflow.author_name && (
                      <>
                        <span>Par {workflow.author_name}</span>
                        <span>•</span>
                      </>
                    )}
                    {workflow.downloads !== undefined && (
                      <>
                        <div className="flex items-center space-x-1">
                          <Download className="w-3 h-3" />
                          <span>{workflow.downloads}</span>
                        </div>
                        <span>•</span>
                      </>
                    )}
                    {workflow.created_at && (
                      <span>Créé le {new Date(workflow.created_at).toLocaleDateString('fr-FR')}</span>
                    )}
                    {workflow.updatedAt && !workflow.created_at && (
                      <span>Modifié le {new Date(workflow.updatedAt).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#0a1b1e]">
                    <div className="text-xs text-gray-500">
                      {workflow.source === 'favorite' ? (
                        <span className="flex items-center space-x-1">
                          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                          <span>Workflow Communautaire</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <Workflow className="w-3 h-3 text-[#05F26C]" />
                          <span>Mon Instance N8N</span>
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkflow(workflow);
                      }}
                      className="px-4 py-2 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] font-semibold rounded-lg transition-all text-sm"
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredWorkflows.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#132426] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400">Aucun workflow trouvé</p>
                <p className="text-sm text-gray-500 mt-1">Essayez de modifier vos critères de recherche</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Workflow Details */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedWorkflow(null)}>
          <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#0a1b1e]">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-2xl font-bold text-white">{selectedWorkflow.name}</h2>
                  {selectedWorkflow.source === 'favorite' && (
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  )}
                  {selectedWorkflow.source === 'instance' && selectedWorkflow.active && (
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded">Actif</span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  {selectedWorkflow.author_name && (
                    <span>Par {selectedWorkflow.author_name}</span>
                  )}
                  {selectedWorkflow.source === 'instance' && selectedWorkflow.updatedAt && (
                    <span>Modifié le {new Date(selectedWorkflow.updatedAt).toLocaleDateString('fr-FR')}</span>
                  )}
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
              {selectedWorkflow.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-400">{selectedWorkflow.description}</p>
                </div>
              )}

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
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-[#0a1b1e]">
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="px-6 py-2 bg-[#0a1b1e] hover:bg-[#132426] text-white rounded-lg transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}