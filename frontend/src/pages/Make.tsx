import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader, Download, Upload, CheckCircle, ExternalLink } from 'lucide-react';
import { authService } from '../services/authService';
import { API_URL } from '../config/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  workflow?: any;
  timestamp: Date;
}

export default function Make() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Bonjour! Je suis votre assistant IA pour créer des workflows N8N. Décrivez-moi l'automatisation que vous souhaitez créer et je générerai un workflow fonctionnel pour vous.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai/create-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ prompt: input })
      });

      if (!response.ok) throw new Error('Failed to generate workflow');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data.description,
        workflow: data.data.workflow,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite lors de la génération du workflow. Veuillez réessayer.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (workflow: any, messageId: string) => {
    setImporting(messageId);
    try {
      const response = await fetch(`${API_URL}/api/workflows/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ workflow })
      });

      if (!response.ok) throw new Error('Failed to import workflow');

      const data = await response.json();
      
      // Show success message
      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Workflow importé avec succès dans votre instance N8N! Vous pouvez le consulter à l'adresse: ${data.data.editorUrl}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "❌ Erreur lors de l'import du workflow. Assurez-vous que votre instance N8N est active.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setImporting(null);
    }
  };

  const handleDownload = (workflow: any, messageId: string) => {
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${messageId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePublish = async (workflow: any, _messageId: string, description: string) => {
    try {
      const response = await fetch(`${API_URL}/api/public-workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          name: workflow.name,
          description: description,
          workflow: workflow
        })
      });

      if (!response.ok) throw new Error('Failed to publish workflow');

      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "✅ Workflow publié avec succès! Il est maintenant disponible dans la section Ressources.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "❌ Erreur lors de la publication du workflow.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen bg-[#030709] flex flex-col">
      {/* Header */}
      <div className="bg-[#132426] border-b border-[#0a1b1e] px-6 py-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-[#05F26C] rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#132426]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Workflow Generator</h1>
            <p className="text-sm text-gray-400">Créez des workflows N8N avec l'IA</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-[#05F26C] rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#132426]" />
                  </div>
                  <span className="text-sm text-gray-400">AI Assistant</span>
                </div>
              )}
              
              <div
                className={`rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-[#05F26C] text-[#132426]'
                    : 'bg-[#132426] border border-[#0a1b1e] text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {message.workflow && (
                  <div className="mt-4 pt-4 border-t border-[#0a1b1e]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-[#05F26C]" />
                        <span className="text-sm font-semibold text-white">Workflow généré</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {message.workflow.nodes?.length || 0} nodes
                      </span>
                    </div>
                    
                    <div className="bg-[#0a0e10] border border-[#0a1b1e] rounded p-3 mb-3">
                      <p className="text-xs text-gray-400 font-mono">
                        {message.workflow.name || 'Untitled Workflow'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleImport(message.workflow, message.id)}
                        disabled={importing === message.id}
                        className="flex-1 px-3 py-2 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {importing === message.id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Import...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Importer</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDownload(message.workflow, message.id)}
                        className="px-3 py-2 bg-[#0a1b1e] hover:bg-[#0a1b1e]/80 text-white rounded-lg font-medium text-sm transition-all flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Télécharger</span>
                      </button>
                      
                      <button
                        onClick={() => handlePublish(message.workflow, message.id, message.content)}
                        className="px-3 py-2 bg-[#0a1b1e] hover:bg-[#0a1b1e]/80 text-white rounded-lg font-medium text-sm transition-all flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Publier</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="flex items-center justify-end space-x-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-3xl">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-[#05F26C] rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#132426]" />
                </div>
                <span className="text-sm text-gray-400">AI Assistant</span>
              </div>
              <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Loader className="w-5 h-5 text-[#05F26C] animate-spin" />
                  <span className="text-white">Génération du workflow en cours...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#132426] border-t border-[#0a1b1e] px-6 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 bg-[#0a0e10] border border-[#0a1b1e] rounded-lg focus-within:border-[#05F26C]/50 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Décrivez le workflow que vous souhaitez créer..."
                className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none"
                rows={3}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Envoyer</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Exemple: "Créer un workflow qui envoie un email quand je reçois un webhook"
          </p>
        </div>
      </div>
    </div>
  );
}
