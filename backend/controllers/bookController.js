import Book from "../models/Book.js";
import BookListing from "../models/BookListing.js";

// 🔥 ADD BOOK (creates/reuses Book, always creates a new Listing)
export const addBook = async (req, res) => {
  try {
    const { title, author, edition, price, condition, category, shopLocation } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : "";

    const normTitle = title.trim();
    const normAuthor = author.trim();
    const normEdition = edition ? edition.trim() : "";

    let book = await Book.findOne({
      title: { $regex: `^${normTitle}$`, $options: "i" },
      author: { $regex: `^${normAuthor}$`, $options: "i" },
      edition: normEdition,
    });

    if (!book) {
      book = new Book({
        title: normTitle,
        author: normAuthor,
        edition: normEdition,
        category,
      });
      await book.save();
    }

    const listing = new BookListing({
      book: book._id,
      seller: req.user.id,
      price,
      condition,
      shopLocation,
      coverImage,
    });

    const savedListing = await listing.save();
    const populated = await savedListing.populate("book");
    res.json(populated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET ALL LISTINGS — supports ?search= query param (searches Book fields)
export const getBooks = async (req, res) => {
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
      .populate("seller", "name location profileImage") // 🔥 added profileImage
      .sort({ createdAt: -1 });

    res.json(listings);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET LISTINGS BY SELLER (for dashboard)
export const getSellerBooks = async (req, res) => {
  try {
    const listings = await BookListing.find({ seller: req.params.id })
      .populate("book");
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 UPDATE LISTING (price/condition/etc — NOT book identity fields)
export const updateBook = async (req, res) => {
  try {
    const { price, condition, shopLocation } = req.body;

    const updateData = { price, condition, shopLocation };

    if (req.file) {
      updateData.coverImage = `/uploads/${req.file.filename}`;
    }

    const updated = await BookListing.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("book");

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 DELETE LISTING
export const deleteBook = async (req, res) => {
  try {
    await BookListing.findByIdAndDelete(req.params.id);
    res.json({ message: "Listing deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 GET SINGLE LISTING (for product page)
export const getBookById = async (req, res) => {
  try {
    const listing = await BookListing.findById(req.params.id)
      .populate("book")
      .populate("seller", "name location profileImage"); // 🔥 added profileImage
    if (!listing) return res.status(404).json({ message: "Not found" });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
