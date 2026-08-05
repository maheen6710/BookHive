import SearchHistory from '../models/SearchHistory.js';

// Save a search (upsert)
export const saveSearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const result = await SearchHistory.findOneAndUpdate(
      { userId, query: query.trim() },
      { updatedAt: Date.now() },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all searches for the logged-in user
export const getSearchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await SearchHistory.find({ userId })
      .sort({ updatedAt: -1 })
      .select('query updatedAt');
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a single search by ID
export const deleteSearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await SearchHistory.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Search not found' });
    }

    res.json({ message: 'Search deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Clear all searches for the user
export const clearAllSearches = async (req, res) => {
  try {
    const userId = req.user.id;
    await SearchHistory.deleteMany({ userId });
    res.json({ message: 'All searches cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};