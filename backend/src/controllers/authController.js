import * as authService from '../services/authService.js';
import * as instanceService from '../services/instanceService.js';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Register user
    const result = await authService.register(email, password, name);
    
    // Provision N8N instance (async - don't wait)
    instanceService.provisionInstance(result.user.id, email)
      .catch(error => {
        console.error('Error provisioning N8N instance:', error);
      });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Your N8N instance is being provisioned.',
      data: result
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const me = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    const result = await authService.updateProfile(userId, { name, email });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    await authService.updatePassword(userId, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};

export default {
  register,
  login,
  me,
  updateProfile,
  updatePassword
};
