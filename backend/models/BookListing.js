import mongoose from "mongoose";

const bookListingSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 1,
    },

    condition: {
      type: String,
      required: true,
      enum: ["new", "like-new", "good", "fair"],
    },

    shopLocation: {
      type: String,
      required: true,
      trim: true,
    },

    coverImage: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BookListing", bookListingSchema);