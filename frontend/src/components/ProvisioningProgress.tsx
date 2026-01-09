import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Server, RefreshCw, Zap } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config/api';
import { authService } from '../services/authService';
import { instanceService } from '../services/instanceService';

interface ProgressMessage {
  type: 'info' | 'success' | 'error' | 'connected';
  message: string;
  progress: number | null;
  timestamp: string;
}

interface Props {
  onComplete: () => void;
}

export default function ProvisioningProgress({ onComplete }: Props) {
  const [messages, setMessages] = useState<ProgressMessage[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [status, setStatus] = useState<'connecting' | 'provisioning' | 'success' | 'error'>('connecting');
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) return;

    // Set timeout for connection (30 seconds)
    const timeoutId = setTimeout(() => {
      if (status === 'connecting') {
        setConnectionTimeout(true);
        setStatus('error');
        setMessages(prev => [...prev, {
          type: 'error',
          message: 'Connection timeout. No instance provisioning in progress.',
          progress: null,
          timestamp: new Date().toISOString()
        }]);
      }
    }, 30000);

    // Set timeout for manual creation button (1 minute)
    const manualCreateTimeoutId = setTimeout(() => {
      if (currentProgress === 0) {
        setShowManualCreate(true);
        setMessages(prev => [...prev, {
          type: 'info',
          message: 'La création automatique semble bloquée. Vous pouvez lancer manuellement la création.',
          progress: null,
          timestamp: new Date().toISOString()
        }]);
      }
    }, 60000);

    // Connect to Socket.IO server
    const socketUrl = API_URL || window.location.origin;
    const socket: Socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      clearTimeout(timeoutId);
      setStatus('provisioning');
      setMessages(prev => [...prev, {
        type: 'connected',
        message: 'Connecté au service de provisioning',
        progress: null,
        timestamp: new Date().toISOString()
      }]);
    });

    // Listen for provisioning updates for this user
    socket.on(`provisioning:${user.id}`, (data: ProgressMessage) => {
      console.log('📡 Progress update:', data);
      clearTimeout(timeoutId);
      
      setMessages(prev => [...prev, {
        ...data,
        timestamp: new Date().toISOString()
      }]);
      
      if (data.progress !== null && data.progress !== undefined) {
        setCurrentProgress(data.progress);
      }

      if (data.type === 'success') {
        setStatus('success');
        setTimeout(() => {
          socket.disconnect();
          onComplete();
        }, 2000);
      } else if (data.type === 'error') {
        setStatus('error');
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      clearTimeout(timeoutId);
      setStatus('error');
      setMessages(prev => [...prev, {
        type: 'error',
        message: 'Erreur de connexion. Veuillez actualiser la page.',
        progress: null,
        timestamp: new Date().toISOString()
      }]);
    });

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(manualCreateTimeoutId);
      socket.disconnect();
    };
  }, [onComplete, status, currentProgress]);

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
      case 'provisioning':
        return <Loader2 className="w-16 h-16 text-[#05F26C] animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-[#05F26C]" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connexion...';
      case 'provisioning':
        return 'Création de votre instance N8N...';
      case 'success':
        return 'Instance prête !';
      case 'error':
        return connectionTimeout ? 'Aucun provisioning en cours' : 'Échec du provisioning';
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleBackToDashboard = () => {
    window.location.href = '/';
  };

  const handleManualCreate = async () => {
    setIsCreating(true);
    setShowManualCreate(false);
    try {
      await instanceService.createInstance();
      setMessages(prev => [...prev, {
        type: 'info',
        message: 'Création de l\'instance lancée manuellement...',
        progress: null,
        timestamp: new Date().toISOString()
      }]);
    } catch (error: any) {
      setStatus('error');
      setMessages(prev => [...prev, {
        type: 'error',
        message: error.response?.data?.error || 'Échec du lancement de la création',
        progress: null,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030709] px-4">
      <div className="max-w-2xl w-full bg-[#132426] border border-[#0a1b1e] rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-6 p-4 bg-[#05F26C]/10 rounded-full">
            {getStatusIcon()}
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            {getStatusText()}
          </h2>
          <p className="text-gray-400 text-lg">
            {status === 'error' && connectionTimeout
              ? "Aucune instance en cours de création. Veuillez retourner au tableau de bord."
              : "Veuillez patienter pendant la configuration de votre environnement d'automatisation"}
          </p>
        </div>

        {/* Progress Bar */}
        {status !== 'error' && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span className="font-medium">Progression</span>
              <span className="font-semibold text-[#05F26C]">{currentProgress}%</span>
            </div>
            <div className="w-full bg-[#0a1b1e] rounded-full h-4 overflow-hidden border border-[#0a1b1e]">
              <div
                className="bg-gradient-to-r from-[#05F26C] to-[#05F26C]/80 h-full rounded-full transition-all duration-500 ease-out shadow-lg shadow-[#05F26C]/20"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Progress Messages */}
        <div className="space-y-2 max-h-80 overflow-y-auto bg-[#0a1b1e] rounded-lg p-4 border border-[#0a1b1e]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">En attente de mises à jour...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 text-sm p-3 rounded-lg transition-all ${
                  msg.type === 'error' ? 'bg-red-500/10 text-red-400' :
                  msg.type === 'success' ? 'bg-[#05F26C]/10 text-[#05F26C]' :
                  msg.type === 'connected' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-[#132426] text-gray-300'
                }`}
              >
                <span className="text-gray-500 text-xs mt-0.5 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString('fr-FR')}
                </span>
                <span className="flex-1">{msg.message}</span>
                {msg.type === 'success' && (
                  <CheckCircle className="w-4 h-4 text-[#05F26C] mt-0.5 flex-shrink-0" />
                )}
                {msg.type === 'error' && (
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        {status === 'error' && (
          <div className="mt-8 flex gap-4 justify-center">
            {connectionTimeout ? (
              <button
                onClick={handleBackToDashboard}
                className="px-6 py-3 bg-[#05F26C] text-[#132426] font-semibold rounded-lg hover:bg-[#05F26C]/80 transition-all flex items-center space-x-2"
              >
                <Server className="w-5 h-5" />
                <span>Retour au tableau de bord</span>
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-[#05F26C] text-[#132426] font-semibold rounded-lg hover:bg-[#05F26C]/80 transition-all flex items-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Réessayer</span>
              </button>
            )}
          </div>
        )}

        {/* Manual Create Button */}
        {showManualCreate && status !== 'error' && status !== 'success' && (
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={handleManualCreate}
              disabled={isCreating}
              className="px-6 py-3 bg-[#05F26C] text-[#132426] font-semibold rounded-lg hover:bg-[#05F26C]/80 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              <span>{isCreating ? 'Création en cours...' : 'Lancer manuellement la création'}</span>
            </button>
          </div>
        )}

        {/* Loading indicator for connecting state */}
        {status === 'connecting' && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-400 text-sm">
              <div className="w-2 h-2 bg-[#05F26C] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[#05F26C] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-[#05F26C] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
