import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true
    },

    author: { 
      type: String, 
      required: true,
      trim: true
    },

    edition: {
      type: String,
      trim: true
    },

    price: { 
      type: Number, 
      required: true,
      min: 1
    },

    condition: { 
      type: String, 
      required: true,
      enum: ["new", "like-new", "good", "fair"]
    },

    shopLocation: { 
      type: String,
      required: true,
      trim: true
    },

    category: {
  type: String,
  required: true,
  trim: true,
},

    // 🔥 IMPORTANT: link book to seller
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // (future use for images 👀)
    coverImage: {
      type: String
    }
  },
  { timestamps: true } // auto adds createdAt & updatedAt
);

export default mongoose.model("Book", bookSchema);