// migrateBookSplit.js
// 🔥 ONE-TIME SCRIPT — run once, then archive/delete this file.
// Splits the old merged "books" collection into new "books" (Book) +
// "booklistings" (BookListing) collections.
//
// SAFE-GUARD: renames the OLD collection to "books_backup_pre_split"
// before doing anything, so if this goes wrong your data is untouched.
//
// Run with: node migrateBookSplit.js

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// --- new split models ---
import Book from "./models/Book.js";
import BookListing from "./models/BookListing.js";

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ connected to MongoDB");

  const db = mongoose.connection.db;

  // 1. Rename old "books" collection so new Book model doesn't collide with it
  const collections = await db.listCollections().toArray();
  const hasOldBooks = collections.some((c) => c.name === "books");
  const hasBackup = collections.some((c) => c.name === "books_backup_pre_split");

  if (!hasOldBooks) {
    console.log("⚠️  No 'books' collection found — nothing to migrate.");
    process.exit(0);
  }

  if (hasBackup) {
    console.log("⚠️  'books_backup_pre_split' already exists — migration may have already run. Aborting to be safe.");
    process.exit(0);
  }

  await db.collection("books").rename("books_backup_pre_split");
  console.log("✅ backed up old collection → books_backup_pre_split");

  // 2. Read the old (merged) documents from the backup
  const oldBooks = await db.collection("books_backup_pre_split").find({}).toArray();
  console.log(`📚 found ${oldBooks.length} old merged book/listing docs`);

  let booksCreated = 0;
  let listingsCreated = 0;
  const bookCache = new Map(); // key: "title|author|edition" -> Book._id

  for (const old of oldBooks) {
    const normTitle = (old.title || "").trim();
    const normAuthor = (old.author || "").trim();
    const normEdition = (old.edition || "").trim();
    const cacheKey = `${normTitle.toLowerCase()}|${normAuthor.toLowerCase()}|${normEdition.toLowerCase()}`;

    let bookId = bookCache.get(cacheKey);

    if (!bookId) {
      // check if a matching Book was already created in THIS migration run
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
          category: old.category || "uncategorized",
        });
        await book.save();
        booksCreated++;
      }

      bookId = book._id;
      bookCache.set(cacheKey, bookId);
    }

    const listing = new BookListing({
      book: bookId,
      seller: old.seller,
      price: old.price,
      condition: old.condition,
      shopLocation: old.shopLocation,
      coverImage: old.coverImage || "",
      createdAt: old.createdAt,
      updatedAt: old.updatedAt,
    });
    await listing.save();
    listingsCreated++;
  }

  console.log(`✅ migration complete:`);
  console.log(`   📖 ${booksCreated} unique Book docs created`);
  console.log(`   🏷️  ${listingsCreated} BookListing docs created`);
  console.log(`   🗄️  old data safely preserved in "books_backup_pre_split"`);

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ migration failed:", err);
  process.exit(1);
});