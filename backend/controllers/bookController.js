import Book from "../models/Book.js";
import BookListing from "../models/BookListing.js";

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

export const getSellerBooks = async (req, res) => {
  try {
    const listings = await BookListing.find({ seller: req.params.id })
      .populate("book");
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

    Object.assign(currentListing, listingUpdate);

    const bookFieldsChanged =
      title !== undefined || author !== undefined || edition !== undefined || category !== undefined;

    if (bookFieldsChanged) {
      const oldBook = await Book.findById(oldBookId);

      const normTitle   = (title   !== undefined ? title   : oldBook.title).trim();
      const normAuthor  = (author  !== undefined ? author  : oldBook.author).trim();
      const normEdition = (edition !== undefined ? edition : (oldBook.edition || "")).trim();
      const newCategory = category !== undefined ? category : oldBook.category;

      const matchedBook = await Book.findOne({
        _id: { $ne: oldBookId },
        title: { $regex: `^${normTitle}$`, $options: "i" },
        author: { $regex: `^${normAuthor}$`, $options: "i" },
        edition: normEdition,
      });

      if (matchedBook) {
        currentListing.book = matchedBook._id;
      } else {
        const newBook = new Book({
          title: normTitle,
          author: normAuthor,
          edition: normEdition,
          category: newCategory,
        });
        await newBook.save();
        currentListing.book = newBook._id;
      }
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

export const deleteBook = async (req, res) => {
  try {
    await BookListing.findByIdAndDelete(req.params.id);
    res.json({ message: "Listing deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBookById = async (req, res) => {
  try {
    const listing = await BookListing.findById(req.params.id)
      .populate("book")
      .populate("seller", "name location profileImage latitude longitude");
    if (!listing) return res.status(404).json({ message: "Not found" });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBooksByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;

    const books = await Book.find({ category: categoryName });
    const bookIds = books.map((b) => b._id);

    const listings = await BookListing.find({ book: { $in: bookIds } })
      .populate("book")
      .populate("seller", "name location profileImage");

    res.status(200).json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching books by category" });
  }
};