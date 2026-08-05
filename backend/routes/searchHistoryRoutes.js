import express from 'express';
import protect from '../middleware/auth.js';
import {
  saveSearch,
  getSearchHistory,
  deleteSearch,
  clearAllSearches,
} from '../controllers/searchHistoryController.js';

const router = express.Router();

router.post('/', protect, saveSearch);
router.get('/', protect, getSearchHistory);
router.delete('/:id', protect, deleteSearch);
router.delete('/', protect, clearAllSearches);

export default router;