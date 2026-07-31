import Book from "../models/Book.js";
import BookListing from "../models/BookListing.js";

// GET /api/books/suggestions?search=rich — autocomplete dropdown
export const getSuggestions = async (req, res) => {
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
};

// GET /api/books?search=... — full search results (moved from bookController's getBooks)
export const searchListings = async (req, res) => {
  try {
    const { search } = req.query;

    let bookQuery = {};

    if (search && search.trim() !== "") {
      const words = search.trim().split(/\s+/);

      bookQuery = {
        $and: words.map((word) => ({
          $or: [
            { title: { $regex: word, $options: "i" } },
            { author: { $regex: word, $options: "i" } },
            { category: { $regex: word, $options: "i" } },
          ],
        })),
      };
    }

    let listingQuery = {};
    if (search && search.trim() !== "") {
      const matchingBooks = await Book.find(bookQuery).select("_id");
      const bookIds = matchingBooks.map((b) => b._id);
      listingQuery = { book: { $in: bookIds } };
    }

    const listings = await BookListing.find(listingQuery)
      .populate("book")
      .populate("seller", "name location profileImage latitude longitude")
      .sort({ createdAt: -1 });

    res.json(listings);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
