import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'demand';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  duration?: number;
}

export default function Toast({ 
  id, 
  type, 
  message, 
  onClose, 
  onConfirm, 
  onCancel, 
  duration = 7000 
}: ToastProps) {
  useEffect(() => {
    if (type !== 'demand') {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [type, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[#05F26C]" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'demand':
        return <HelpCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-[#132426] border-[#05F26C]/30';
      case 'error':
        return 'bg-[#132426] border-red-500/30';
      case 'warning':
        return 'bg-[#132426] border-yellow-500/30';
      case 'demand':
        return 'bg-[#132426] border-blue-500/30';
    }
  };

  return (
    <div
      className={`${getStyles()} border rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px] animate-slide-in`}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <p className="text-white text-sm">{message}</p>
          {type === 'demand' && (
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => {
                  onConfirm?.();
                  onClose();
                }}
                className="px-3 py-1.5 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] text-sm font-semibold rounded transition-all"
              >
                Oui
              </button>
              <button
                onClick={() => {
                  onCancel?.();
                  onClose();
                }}
                className="px-3 py-1.5 bg-[#0a1b1e] hover:bg-[#132426] text-white text-sm rounded transition-all"
              >
                Non
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
