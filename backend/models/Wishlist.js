import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    // one wishlist doc per buyer (finder)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // 🔥 points at BookListing, not Book — a wishlist saves a specific
    // seller's copy (with its price/condition), not just the abstract book
    listings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BookListing",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Wishlist", wishlistSchema);
