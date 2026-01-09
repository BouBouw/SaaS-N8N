import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container } from '@tsparticles/engine';
import { authService } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { User, Mail, Lock, UserPlus, Sparkles } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (container?: Container) => {
    console.log('Particles loaded', container);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.register(formData);
      authService.setToken(response.token);
      authService.setUser(response.user);
      showToast('success', 'Inscription réussie');
      navigate('/');
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-[#030709] relative overflow-hidden flex items-center justify-center px-4">
      {/* Particles Background */}
      {init && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          options={{
          background: {
            color: {
              value: '#030709',
            },
          },
          fpsLimit: 120,
          particles: {
            color: {
              value: '#05F26C',
            },
            links: {
              color: '#05F26C',
              distance: 150,
              enable: true,
              opacity: 0.2,
              width: 1,
            },
            move: {
              enable: true,
              speed: 1,
              direction: 'none',
              random: false,
              straight: false,
              outModes: {
                default: 'bounce',
              },
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 120,
            },
            opacity: {
              value: 0.3,
            },
            shape: {
              type: 'circle',
            },
            size: {
              value: { min: 1, max: 3 },
            },
          },
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: 'grab',
              },
              onClick: {
                enable: true,
                mode: 'push',
              },
            },
            modes: {
              grab: {
                distance: 200,
                links: {
                  opacity: 0.5,
                },
              },
              push: {
                quantity: 4,
              },
            },
          },
          detectRetina: true,
        }}
        className="absolute inset-0"
      />
      )}

      {/* Register Form */}
      <div className="relative z-10 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Créer un compte</h1>
          <p className="text-gray-400">Obtenez votre instance N8N en quelques secondes</p>
        </div>

        <div className="bg-[#132426] border border-[#0a1b1e] rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a1b1e] border border-[#0a1b1e] text-white rounded-lg focus:ring-2 focus:ring-[#05F26C] focus:border-[#05F26C] transition placeholder-gray-500"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a1b1e] border border-[#0a1b1e] text-white rounded-lg focus:ring-2 focus:ring-[#05F26C] focus:border-[#05F26C] transition placeholder-gray-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a1b1e] border border-[#0a1b1e] text-white rounded-lg focus:ring-2 focus:ring-[#05F26C] focus:border-[#05F26C] transition placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">Au moins 8 caractères</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#05F26C] text-[#132426] py-3 rounded-lg font-semibold hover:bg-[#05F26C]/80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#132426] border-t-transparent rounded-full animate-spin" />
                  <span>Création du compte...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Créer mon compte</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-[#05F26C] hover:text-[#05F26C]/80 font-semibold transition">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm flex items-center justify-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#05F26C]" />
            <span>Votre instance N8N sera automatiquement provisionnée</span>
          </p>
        </div>
      </div>
    </div>
  );
}
