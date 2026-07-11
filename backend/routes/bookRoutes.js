import express from "express";
import { addBook, getBooks, getSellerBooks, updateBook, deleteBook , getBookById } from "../controllers/bookController.js";
import upload from "../middleware/upload.js";   // 👈 import multer middleware
import protect from "../middleware/auth.js";
import Book from "../models/Book.js"; //idk if this is needed but imma add it just in case, if it causes problems just delete it


const router = express.Router();


// GET /api/books/suggestions?search=rich
router.get("/suggestions", async (req, res) => {
  try {
    const { search } = req.query;
    if (!search?.trim()) return res.json([]);

    // prefix match first (starts with), then contains — sorted by relevance
    const prefixMatches = await Book.distinct("title", {
      title: { $regex: `^${search}`, $options: "i" }
    });

    const containsMatches = await Book.distinct("title", {
      title: { $regex: search, $options: "i" }
    });

    // merge: prefix matches come first, no duplicates, max 8 suggestions
    const combined = [...new Set([...prefixMatches, ...containsMatches])].slice(0, 8);
    res.json(combined);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/", protect, upload.single("coverImage"), addBook); // 👈 protect added
router.get("/", getBooks); //imma replacce it with the one in the next line
router.get("/:id", getBookById); 
router.get("/seller/:id", getSellerBooks);
router.put("/:id", protect, upload.single("coverImage"), updateBook); // 👈 protect added
router.delete("/:id", protect, deleteBook);
export default router;


