import { findAllUsers, findUserById, updateUserRole, deleteUser } from '../models/User.js';
import { deleteInstance } from '../services/instanceService.js';
import { query } from '../config/database.js';

export const getUsers = async (req, res) => {
  try {
    const users = await findAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent user from changing their own role
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    await updateUserRole(id, role);
    const updatedUser = await findUserById(id);
    
    res.json({ 
      message: 'Rôle mis à jour avec succès',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    res.status(500).json({ message: error.message || 'Erreur serveur' });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent user from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Get user's instance to delete it
    const instances = await query('SELECT * FROM instances WHERE user_id = ?', [id]);
    
    // Delete instance if exists
    if (instances.length > 0) {
      for (const instance of instances) {
        try {
          await deleteInstance(instance.subdomain);
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'instance:', error);
        }
      }
    }

    // Delete API keys
    await query('DELETE FROM api_keys WHERE user_id = ?', [id]);
    
    // Delete instances records
    await query('DELETE FROM instances WHERE user_id = ?', [id]);
    
    // Delete user
    await deleteUser(id);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
        (SELECT COUNT(*) FROM instances) as total_instances,
        (SELECT COUNT(*) FROM instances WHERE status = 'running') as running_instances,
        (SELECT COUNT(*) FROM api_keys) as total_api_keys
    `);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
