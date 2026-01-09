import * as Favorite from '../models/Favorite.js';

export const toggleFavorite = async (req, res) => {
  try {
    const { workflowId } = req.body;
    const userId = req.user.id;

    if (!workflowId) {
      return res.status(400).json({
        success: false,
        message: 'Workflow ID is required'
      });
    }

    const isFav = await Favorite.isFavorite(userId, workflowId);

    if (isFav) {
      await Favorite.removeFavorite(userId, workflowId);
      return res.json({
        success: true,
        favorited: false,
        message: 'Removed from favorites'
      });
    } else {
      await Favorite.addFavorite(userId, workflowId);
      return res.json({
        success: true,
        favorited: true,
        message: 'Added to favorites'
      });
    }

  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating favorite'
    });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await Favorite.getUserFavorites(userId);

    res.json({
      success: true,
      data: favorites
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites'
    });
  }
};

export default {
  toggleFavorite,
  getFavorites
};
