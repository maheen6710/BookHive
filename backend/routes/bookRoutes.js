import express from "express";
import { addBook, getSellerBooks, updateBook, deleteBook, getBookById, getBooksByCategory } from "../controllers/bookController.js";
import { getSuggestions, searchListings } from "../controllers/searchController.js";
import upload from "../middleware/upload.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// GET /api/books/suggestions?search=rich — autocomplete
router.get("/suggestions", getSuggestions);

router.post("/", protect, upload.single("coverImage"), addBook);

// 🔥 GET / — with or without ?search=, always handled by searchController
// (searchListings returns everything when search is empty, same as old getBooks did)
router.get("/", searchListings);

router.get("/:id", getBookById);
router.get("/seller/:id", getSellerBooks);
router.put("/:id", protect, upload.single("coverImage"), updateBook);
router.delete("/:id", protect, deleteBook);
router.get('/category/:categoryName', getBooksByCategory);

export default router;
