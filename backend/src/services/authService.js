import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import * as User from '../models/User.js';
import * as Instance from '../models/Instance.js';
import * as ApiKey from '../models/ApiKey.js';
import { deleteInstance } from './instanceService.js';

export const register = async (email, password, name) => {
  // Check if user already exists
  const existingUser = await User.findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const userId = await User.createUser(email, hashedPassword, name);

  // Generate JWT token
  const token = generateToken(userId);

  // Get user data
  const user = await User.findUserById(userId);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at
    }
  };
};

export const login = async (email, password) => {
  // Find user
  const user = await User.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT token
  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at
    }
  };
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

export const getUserById = async (userId) => {
  const user = await User.findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export const updateProfile = async (userId, data) => {
  const { name, email } = data;

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await User.findUserByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email already in use');
    }
  }

  // Update user profile
  await User.updateUser(userId, { name, email });

  // Get updated user data
  const user = await User.findUserById(userId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
};

export const updatePassword = async (userId, currentPassword, newPassword) => {
  // Get user
  const user = await User.findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await User.updateUser(userId, { password: hashedPassword });
};

export const deleteAccount = async (userId, password) => {
  // Get user
  const user = await User.findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Password is incorrect');
  }

  console.log(`🗑️ Deleting account for user ${userId}`);

  // 1. Delete all user instances (containers, volumes, nginx configs)
  try {
    await deleteInstance(userId);
    console.log('✅ Instance deleted');
  } catch (error) {
    console.log('⚠️ No instance to delete or error:', error.message);
  }

  // 2. Delete all API keys
  try {
    await ApiKey.deleteApiKeysByUserId(userId);
    console.log('✅ API keys deleted');
  } catch (error) {
    console.log('⚠️ Error deleting API keys:', error.message);
  }

  // 3. Delete user (will cascade delete team_members, workflow_comments via foreign keys)
  await User.deleteUser(userId);
  console.log('✅ User account deleted');

  return { success: true };
};

export default {
  register,
  login,
  verifyToken,
  generateToken,
  getUserById,
  updateProfile,
  updatePassword,
  deleteAccount
};
