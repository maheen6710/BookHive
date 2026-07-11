import Conversation from "../models/Conversation.js";

// POST /api/conversations/start
const startConversation = async (req, res) => {
  try {
    const { bookId, sellerId } = req.body;
    const buyerId = req.user.id; // ✅ fixed: was req.user._id

    if (buyerId.toString() === sellerId) {
      return res.status(400).json({ message: "You can't chat with yourself." });
    }

    let convo = await Conversation.findOne({
      book: bookId,
      buyer: buyerId,
      seller: sellerId,
      deletedByBuyer: false,
    });

    if (!convo) {
      convo = await Conversation.create({
        book: bookId,
        buyer: buyerId,
        seller: sellerId,
      });
    }

    res.status(200).json(convo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/conversations/
const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ fixed

    const convos = await Conversation.find({
      $or: [
        { buyer: userId, deletedByBuyer: false },
        { seller: userId, deletedBySeller: false },
      ],
    })
      .populate("book", "title coverImage")
      .populate("buyer", "name")
      .populate("seller", "name")
      .sort({ updatedAt: -1 });

    res.status(200).json(convos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/conversations/:id
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ fixed
    const convo = await Conversation.findById(req.params.id)
      .populate("book", "title coverImage price")
      .populate("buyer", "name")
      .populate("seller", "name")
      .populate("messages.sender", "name");

    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    const isBuyer = convo.buyer._id.toString() === userId.toString();
    const isSeller = convo.seller._id.toString() === userId.toString();

    if (!isBuyer && !isSeller)
      return res.status(403).json({ message: "Unauthorized." });

    if (isBuyer && convo.deletedByBuyer)
      return res.status(404).json({ message: "Conversation not found." });
    if (isSeller && convo.deletedBySeller)
      return res.status(404).json({ message: "Conversation not found." });

    res.status(200).json(convo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations/:id/message
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ fixed
    const { text } = req.body;

    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    const isBuyer = convo.buyer.toString() === userId.toString();
    const isSeller = convo.seller.toString() === userId.toString();
    if (!isBuyer && !isSeller)
      return res.status(403).json({ message: "Unauthorized." });

    if (isBuyer) convo.deletedBySeller = false;
    if (isSeller) convo.deletedByBuyer = false;

    convo.messages.push({ sender: userId, text });
    await convo.save();

    const newMsg = convo.messages[convo.messages.length - 1];
    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/conversations/:id
const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ fixed
    const convo = await Conversation.findById(req.params.id);

    if (!convo) return res.status(404).json({ message: "Conversation not found." });

    const isBuyer = convo.buyer.toString() === userId.toString();
    const isSeller = convo.seller.toString() === userId.toString();

    if (!isBuyer && !isSeller)
      return res.status(403).json({ message: "Unauthorized." });

    if (isBuyer) convo.deletedByBuyer = true;
    if (isSeller) convo.deletedBySeller = true;

    if (convo.deletedByBuyer && convo.deletedBySeller) {
      await Conversation.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Conversation permanently deleted." });
    }

    await convo.save();
    res.status(200).json({ message: "Conversation removed from your inbox." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { startConversation, getMyConversations, getConversation, sendMessage, deleteConversation };
