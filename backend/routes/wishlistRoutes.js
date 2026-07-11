import express from "express";
import protect from "../middleware/auth.js";
import User from "../models/User.js";
import Book from "../models/Book.js";

const router = express.Router();

// GET /api/wishlist — get current buyer's wishlist
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "wishlist",
      populate: { path: "seller", select: "name location" },
    });
    res.json(user.wishlist || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wishlist/:bookId — add book to wishlist
router.post("/:bookId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { bookId } = req.params;

    // don't add duplicates
    if (user.wishlist.includes(bookId)) {
      return res.status(400).json({ message: "Already in wishlist" });
    }

    user.wishlist.push(bookId);
    await user.save();
    res.json({ message: "Added to wishlist" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/wishlist/:bookId — remove book from wishlist
router.delete("/:bookId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== req.params.bookId
    );
    await user.save();
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
