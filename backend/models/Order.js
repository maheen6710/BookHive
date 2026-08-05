import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookListing",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerDetails: {
      name:    { type: String, required: true },
      phone:   { type: String, required: true },
      address: { type: String, required: true },
    },
    paymentMethod: {
      type:    String,
      default: "COD",
    },
    totalPrice: {
      type:     Number,
      required: true,
    },
    status: {
      type:    String,
      enum:    ["pending", "on the way", "delivered", "unavailable", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);