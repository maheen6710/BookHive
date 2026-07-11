import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }
);

const ConversationSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [MessageSchema],

    // Soft-delete flags — each party deletes from their own end
    deletedByBuyer: { type: Boolean, default: false },
    deletedBySeller: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", ConversationSchema);
