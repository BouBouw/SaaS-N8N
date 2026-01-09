import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Server } from 'lucide-react';
import { getApiUrl } from '../config/api';
import { authService } from '../services/authService';

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

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    // EventSource doesn't support custom headers, so we pass token as query param
    const url = `${getApiUrl('/api/instances/provision/progress')}?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressMessage = JSON.parse(event.data);
        
        setMessages(prev => [...prev, data]);
        
        if (data.progress !== null) {
          setCurrentProgress(data.progress);
        }

        if (data.type === 'connected') {
          setStatus('provisioning');
        } else if (data.type === 'success') {
          setStatus('success');
          setTimeout(() => {
            eventSource.close();
            onComplete();
          }, 2000);
        } else if (data.type === 'error') {
          setStatus('error');
          setTimeout(() => {
            eventSource.close();
          }, 5000);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setStatus('error');
      setMessages(prev => [...prev, {
        type: 'error',
        message: 'Connection lost. Please refresh the page.',
        progress: null,
        timestamp: new Date().toISOString()
      }]);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onComplete]);

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
      case 'provisioning':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'provisioning':
        return 'Creating your N8N instance...';
      case 'success':
        return 'Instance ready!';
      case 'error':
        return 'Provisioning failed';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            {getStatusIcon()}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getStatusText()}
          </h2>
          <p className="text-gray-600">
            Please wait while we set up your workflow automation environment
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{currentProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>

        {/* Progress Messages */}
        <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 text-sm ${
                msg.type === 'error' ? 'text-red-600' :
                msg.type === 'success' ? 'text-green-600' :
                'text-gray-700'
              }`}
            >
              <span className="text-gray-400 text-xs mt-0.5">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              <span className="flex-1">{msg.message}</span>
              {msg.type === 'success' && (
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              )}
              {msg.type === 'error' && (
                <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
              )}
            </div>
          ))}
        </div>

        {status === 'error' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
