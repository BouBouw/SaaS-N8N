import crypto from 'crypto';

export const generateSubdomain = () => {
  // Generate a random 8-character subdomain
  return crypto.randomBytes(4).toString('hex');
};

export const generatePassword = (length = 16) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomValues = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  return password;
};

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  generateSubdomain,
  generatePassword,
  wait
};
