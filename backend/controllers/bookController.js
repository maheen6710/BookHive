import Book from "../models/Book.js";

// 🔥 ADD BOOK
export const addBook = async (req, res) => {
  try {
    const { title, author, edition, price, condition, category, shopLocation } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : "";

    const book = new Book({
      title,
      author,
      edition,
      price,
      condition,
      category,
      shopLocation,
      seller: req.user.id,
      coverImage,
    });

    const saved = await book.save();
    res.json(saved);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET ALL BOOKS — supports ?search= query param
export const getBooks = async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};

    if (search && search.trim() !== "") {
      const words = search.trim().split(/\s+/);

      // every word must match at least one of: title, author, category
      query = {
        $and: words.map((word) => ({
          $or: [
            { title:    { $regex: word, $options: "i" } },
            { author:   { $regex: word, $options: "i" } },
            { category: { $regex: word, $options: "i" } },
          ],
        })),
      };
    }

    const books = await Book.find(query)
      .populate("seller", "name location") // 👈 adjust field names if yours differ
      .sort({ createdAt: -1 });

    res.json(books);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET BOOKS BY SELLER (for dashboard)
export const getSellerBooks = async (req, res) => {
  try {
    const books = await Book.find({ seller: req.params.id });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 UPDATE BOOK
export const updateBook = async (req, res) => {
  try {
    const { title, author, edition, price, condition, category } = req.body;

    const updateData = { title, author, edition, price, condition, category };

    if (req.file) {
      updateData.coverImage = `/uploads/${req.file.filename}`;
    }

    const updated = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 DELETE BOOK
export const deleteBook = async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET SINGLE BOOK (for product page)
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("seller", "name location");
    if (!book) return res.status(404).json({ message: "Not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};