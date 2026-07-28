// migrateWishlistSplit.js
// 🔥 ONE-TIME SCRIPT — run once, then archive/delete this file.
// Moves old User.wishlist arrays (old Book IDs) into the new Wishlist
// collection (BookListing IDs).
//
// SAFE: only reads old wishlist data from User docs directly via the raw
// db driver (since the field no longer exists on the Mongoose schema).
// Skips users who already have a Wishlist doc.
//
// Run with: node migratewishlistsplit.js

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Wishlist from "./models/Wishlist.js";
import BookListing from "./models/BookListing.js";

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ connected to MongoDB");

  const db = mongoose.connection.db;

  // check backup exists (needed to map old Book IDs -> new Book IDs -> listings)
  const backupExists = await db.listCollections({ name: "books_backup_pre_split" }).toArray();
  if (backupExists.length === 0) {
    console.log("❌ 'books_backup_pre_split' not found — can't map old Book IDs. Aborting.");
    process.exit(1);
  }

  const oldBooks = await db.collection("books_backup_pre_split").find({}).toArray();
  const oldBooksById = new Map(oldBooks.map((b) => [b._id.toString(), b]));
  console.log(`📚 loaded ${oldBooks.length} old book docs from backup`);

  // read raw User docs (bypass Mongoose schema since "wishlist" field was removed from it)
  const rawUsers = await db.collection("users").find({
    wishlist: { $exists: true, $ne: [] },
  }).toArray();

  console.log(`👤 found ${rawUsers.length} users with old wishlist data`);

  let usersMigrated = 0;
  let itemsMigrated = 0;
  let usersSkipped = 0;

  for (const rawUser of rawUsers) {
    const existingWishlist = await Wishlist.findOne({ user: rawUser._id });
    if (existingWishlist) {
      usersSkipped++;
      continue; // already migrated, don't duplicate
    }

    const listingIds = [];

    for (const oldBookId of rawUser.wishlist) {
      const oldBook = oldBooksById.get(oldBookId.toString());
      if (!oldBook) {
        console.log(`⚠️  old book ${oldBookId} not found in backup — skipping this item`);
        continue;
      }

      const normTitle = (oldBook.title || "").trim();
      const normAuthor = (oldBook.author || "").trim();
      const normEdition = (oldBook.edition || "").trim();

      const newBook = await db.collection("books").findOne({
        title: { $regex: `^${normTitle}$`, $options: "i" },
        author: { $regex: `^${normAuthor}$`, $options: "i" },
        edition: normEdition,
      });

      if (!newBook) {
        console.log(`⚠️  no matching new Book for "${normTitle}" — skipping this item`);
        continue;
      }

      // match listing by book + the ORIGINAL seller (since that's the specific
      // copy the user wishlisted)
      const listing = await BookListing.findOne({
        book: newBook._id,
        seller: oldBook.seller,
      });

      if (!listing) {
        console.log(`⚠️  no matching listing for "${normTitle}" / seller ${oldBook.seller} — skipping this item`);
        continue;
      }

      listingIds.push(listing._id);
    }

    if (listingIds.length > 0) {
      await Wishlist.create({ user: rawUser._id, listings: listingIds });
      usersMigrated++;
      itemsMigrated += listingIds.length;
    }
  }

  console.log(`✅ migration complete:`);
  console.log(`   👤 users migrated: ${usersMigrated}`);
  console.log(`   📖 total wishlist items migrated: ${itemsMigrated}`);
  console.log(`   ⏭️  users already had a Wishlist doc, skipped: ${usersSkipped}`);

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ migration failed:", err);
  process.exit(1);
});