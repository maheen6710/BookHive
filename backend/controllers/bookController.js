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
// (getBooks removed — GET /api/books is now fully handled by
// searchController.js's searchListings, which also covers the no-search case)

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

// 🔥 UPDATE LISTING + book identity fields.
// Editing title/author/edition/category NEVER mutates the shared Book doc
// directly (that would silently change other sellers' listings too).
// Instead: look for a matching existing Book and merge into it, or create
// a brand new Book if no match — then re-point this listing at it.
export const updateBook = async (req, res) => {
  try {
    const { price, condition, shopLocation, title, author, edition, category } = req.body;

    const listingUpdate = { price, condition, shopLocation };
    if (req.file) {
      listingUpdate.coverImage = `/uploads/${req.file.filename}`;
    }

    const currentListing = await BookListing.findById(req.params.id);
    if (!currentListing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const oldBookId = currentListing.book;

    // apply listing-level field changes
    Object.assign(currentListing, listingUpdate);

    const bookFieldsChanged =
      title !== undefined || author !== undefined || edition !== undefined || category !== undefined;

    if (bookFieldsChanged) {
      const oldBook = await Book.findById(oldBookId);

      const normTitle   = (title   !== undefined ? title   : oldBook.title).trim();
      const normAuthor  = (author  !== undefined ? author  : oldBook.author).trim();
      const normEdition = (edition !== undefined ? edition : (oldBook.edition || "")).trim();
      const newCategory = category !== undefined ? category : oldBook.category;

      // 🔎 does a DIFFERENT Book already match these values?
      const matchedBook = await Book.findOne({
        _id: { $ne: oldBookId },
        title: { $regex: `^${normTitle}$`, $options: "i" },
        author: { $regex: `^${normAuthor}$`, $options: "i" },
        edition: normEdition,
      });

      if (matchedBook) {
        // 🔥 merge into the existing matching Book — no data changes, just re-point
        currentListing.book = matchedBook._id;
      } else {
        // 🔥 no match — spin off a BRAND NEW Book, never touch the old shared one
        const newBook = new Book({
          title: normTitle,
          author: normAuthor,
          edition: normEdition,
          category: newCategory,
        });
        await newBook.save();
        currentListing.book = newBook._id;
      }

      // clean up the old Book doc if nothing else points to it anymore
      const remainingListings = await BookListing.countDocuments({
        book: oldBookId,
        _id: { $ne: currentListing._id },
      });
      if (remainingListings === 0) {
        await Book.findByIdAndDelete(oldBookId);
      }
    }

    await currentListing.save();

    const populated = await BookListing.findById(currentListing._id).populate("book");
    res.json(populated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 DELETE LISTING
export const deleteBook = async (req, res) => {
  try {
    const listing = await BookListing.findByIdAndDelete(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const remainingListings = await BookListing.countDocuments({ book: listing.book });
    if (remainingListings === 0) {
      await Book.findByIdAndDelete(listing.book);
    }

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
      .populate("seller", "name location profileImage latitude longitude"); // 🔥 added lat/lng for map
    if (!listing) return res.status(404).json({ message: "Not found" });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// for listing books by category
export const getBooksByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;

    // find shared Book docs that match this category
    const books = await Book.find({ category: categoryName });
    const bookIds = books.map((b) => b._id);

    // find seller listings pointing at those books, populated with book info
    // (same shape as getSellerBooks / getBookById, so BookCard renders it the same way)
    const listings = await BookListing.find({ book: { $in: bookIds } })
      .populate("book")
      .populate("seller", "name location profileImage");

    res.status(200).json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching books by category" });
  }
};