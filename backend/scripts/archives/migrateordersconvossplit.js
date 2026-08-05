import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Order from "../../models/Order.js";
import Conversation from "../../models/Conversation.js";
import BookListing from "../../models/BookListing.js";

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ connected to MongoDB");

  // build a lookup: "oldBookId|sellerId" -> new BookListing._id
  // we rebuild this by reading the backup collection saved during migration #1
  const db = mongoose.connection.db;
  const backupExists = await db.listCollections({ name: "books_backup_pre_split" }).toArray();

  if (backupExists.length === 0) {
    console.log("❌ 'books_backup_pre_split' not found — can't map old Book IDs. Aborting.");
    process.exit(1);
  }

  const oldBooks = await db.collection("books_backup_pre_split").find({}).toArray();
  console.log(`📚 loaded ${oldBooks.length} old book docs from backup`);

  // for each old book doc, find the listing created for that seller with matching
  // title/author/edition (since that's how migration #1 built it)
  const lookup = new Map(); // key: oldBookId string -> listing._id

  for (const old of oldBooks) {
    const normTitle = (old.title || "").trim();
    const normAuthor = (old.author || "").trim();
    const normEdition = (old.edition || "").trim();

    // find the Book doc that was created from this data
    const newBook = await mongoose.connection.db.collection("books").findOne({
      title: { $regex: `^${normTitle}$`, $options: "i" },
      author: { $regex: `^${normAuthor}$`, $options: "i" },
      edition: normEdition,
    });

    if (!newBook) {
      console.log(`⚠️  no matching new Book found for old book "${normTitle}" — skipping`);
      continue;
    }

    // find the listing tied to that Book + that seller (unique combo)
    const listing = await BookListing.findOne({
      book: newBook._id,
      seller: old.seller,
    });

    if (!listing) {
      console.log(`⚠️  no matching listing found for "${normTitle}" / seller ${old.seller} — skipping`);
      continue;
    }

    lookup.set(old._id.toString(), listing._id);
  }

  console.log(`🔗 built lookup for ${lookup.size} old book -> listing mappings`);

  // --- fix Orders ---
  const orders = await Order.find({});
  let ordersFixed = 0;
  let ordersSkipped = 0;

  for (const order of orders) {
    const stillValidListing = await BookListing.findById(order.book);
    if (stillValidListing) {
      ordersSkipped++; // already points at a valid listing, leave it alone
      continue;
    }

    const newListingId = lookup.get(order.book.toString());
    if (newListingId) {
      order.book = newListingId;
      await order.save();
      ordersFixed++;
    } else {
      console.log(`⚠️  order ${order._id}: no mapping found for old book ${order.book}, left as-is`);
    }
  }

  // --- fix Conversations ---
  const convos = await Conversation.find({});
  let convosFixed = 0;
  let convosSkipped = 0;

  for (const convo of convos) {
    const stillValidListing = await BookListing.findById(convo.book);
    if (stillValidListing) {
      convosSkipped++;
      continue;
    }

    const newListingId = lookup.get(convo.book.toString());
    if (newListingId) {
      convo.book = newListingId;
      await convo.save();
      convosFixed++;
    } else {
      console.log(`⚠️  conversation ${convo._id}: no mapping found for old book ${convo.book}, left as-is`);
    }
  }

  console.log(`✅ migration complete:`);
  console.log(`   🧾 Orders — fixed: ${ordersFixed}, already valid: ${ordersSkipped}`);
  console.log(`   💬 Conversations — fixed: ${convosFixed}, already valid: ${convosSkipped}`);

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ migration failed:", err);
  process.exit(1);
});