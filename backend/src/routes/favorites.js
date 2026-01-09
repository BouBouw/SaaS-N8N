import express from 'express';
import { toggleFavorite, getFavorites } from '../controllers/favoriteController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

router.post('/toggle', verifyJWT, toggleFavorite);
router.get('/', verifyJWT, getFavorites);

export default router;
