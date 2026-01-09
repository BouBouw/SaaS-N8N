import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User, Mail, Lock, Save, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useToast } from '../contexts/ToastContext';

const Settings: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du profil');
      }

      // Update local storage with new user data
      const updatedUser = { ...currentUser, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      showToast('success', 'Profil mis à jour avec succès');
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('error', 'Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('error', 'Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du mot de passe');
      }

      showToast('success', 'Mot de passe mis à jour avec succès');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast('error', 'Veuillez entrer votre mot de passe');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ password: deletePassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression du compte');
      }

      // Logout and redirect
      showToast('success', 'Compte supprimé avec succès');
      setTimeout(() => {
        authService.logout();
        navigate('/login');
      }, 1000);
    } catch (err: any) {
      showToast('error', err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030709]">
      {/* Header */}
      <div className="bg-[#132426] border-b border-[#0a1b1e] px-6 py-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#05F26C] rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-[#132426]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Paramètres</h1>
            <p className="text-gray-400 mt-1">Gérez vos informations personnelles et votre sécurité</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Section */}
        <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-[#05F26C]/10 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-[#05F26C]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Informations personnelles</h2>
              <p className="text-sm text-gray-400">Mettez à jour votre nom et email</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                Prénom / Nom
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="pl-10 w-full px-4 py-3 bg-[#0a1b1e] border border-[#0a1b1e] focus:border-[#05F26C] rounded-lg text-white placeholder-gray-500 outline-none transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="pl-10 w-full px-4 py-3 bg-[#0a1b1e] border border-[#0a1b1e] focus:border-[#05F26C] rounded-lg text-white placeholder-gray-500 outline-none transition-colors"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-[#05F26C]/10 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#05F26C]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Sécurité</h2>
              <p className="text-sm text-gray-400">Modifiez votre mot de passe</p>
            </div>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-400 mb-2">
                Mot de passe actuel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="pl-10 w-full px-4 py-3 bg-[#0a1b1e] border border-[#0a1b1e] focus:border-[#05F26C] rounded-lg text-white placeholder-gray-500 outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-400 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="pl-10 w-full px-4 py-3 bg-[#0a1b1e] border border-[#0a1b1e] focus:border-[#05F26C] rounded-lg text-white placeholder-gray-500 outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="pl-10 w-full px-4 py-3 bg-[#0a1b1e] border border-[#0a1b1e] focus:border-[#05F26C] rounded-lg text-white placeholder-gray-500 outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#05F26C] hover:bg-[#05F26C]/80 text-[#132426] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-5 h-5" />
              <span>{loading ? 'Modification...' : 'Modifier le mot de passe'}</span>
            </button>
          </form>
        </div>

        {/* Delete Account Section */}
        <div className="bg-[#132426] border border-red-500/30 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Zone dangereuse</h2>
              <p className="text-sm text-gray-400">Suppression définitive du compte</p>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-400">
              <strong>Attention :</strong> La suppression de votre compte est <strong>irréversible</strong>. 
              Toutes vos données, instances N8N, clés API et configurations seront définitivement supprimées.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg transition-all"
          >
            <Trash2 className="w-5 h-5" />
            <span>Supprimer mon compte</span>
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
            <div className="bg-[#132426] border border-[#0a1b1e] rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Confirmer la suppression</h3>
              </div>

              <p className="text-sm text-gray-400 mb-4">
                Cette action est <strong className="text-red-400">irréversible</strong>. Pour confirmer la suppression de votre compte, 
                veuillez entrer votre mot de passe.
              </p>

              <div className="mb-6">
                <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-400 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="pl-10 w-full px-4 py-3 bg-[#0a1b1e] border border-[#0a1b1e] focus:border-red-500 rounded-lg text-white placeholder-gray-500 outline-none transition-colors"
                    placeholder="••••••••"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#0a1b1e] hover:bg-[#132426] text-white rounded-lg transition-all disabled:opacity-50 border border-[#0a1b1e]"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || !deletePassword}
                  className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Suppression...' : 'Supprimer définitivement'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
