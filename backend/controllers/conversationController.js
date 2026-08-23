import Conversation from "../models/Conversation.js";

const startConversation = async (req, res) => {
  try {
    const { bookId, sellerId } = req.body;
    const buyerId = req.user.id;

    if (buyerId.toString() === sellerId) {
      return res.status(400).json({ message: "You can't chat with yourself." });
    }

    const findQuery = {
      buyer: buyerId,
      seller: sellerId,
      deletedByBuyer: false,
    };
    findQuery.book = bookId || null;

    let convo = await Conversation.findOne(findQuery);

    if (!convo) {
      convo = await Conversation.create({
        book: bookId || null,
        buyer: buyerId,
        seller: sellerId,
      });
    }

    res.status(200).json(convo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const convos = await Conversation.find({
      $or: [
        { buyer: userId, deletedByBuyer: false },
        { seller: userId, deletedBySeller: false },
      ],
    })
      .populate({
        path: "book",
        select: "coverImage book",
        populate: { path: "book", select: "title" }, 
      })
      .populate("buyer", "name profileImage")
      .populate("seller", "name profileImage")
      .sort({ updatedAt: -1 });

    res.status(200).json(convos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const convo = await Conversation.findById(req.params.id)
      .populate({
        path: "book",
        select: "coverImage price book",
        populate: { path: "book", select: "title" }, 
      })
      .populate("buyer", "name profileImage")
      .populate("seller", "name profileImage")
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

const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
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

const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
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
