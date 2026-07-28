import Order from "../models/Order.js";
import BookListing from "../models/BookListing.js"; // 🔥 was Book

// POST /api/orders
export async function placeOrder(req, res) {
  try {
    const { bookId, sellerId, buyerDetails, paymentMethod, totalPrice } = req.body;

    // 🔥 bookId sent from frontend is actually a LISTING id now
    const listing = await BookListing.findById(bookId);
    if (!listing) return res.status(404).json({ message: "Listing not found." });

    if (req.user.role !== "finder") {
      return res.status(403).json({ message: "Only buyers can place orders." });
    }

    if (req.user.id === sellerId) {
      return res.status(400).json({ message: "You cannot buy your own book." });
    }

    const order = new Order({
      book:          bookId, // stores the listing's ObjectId
      buyer:         req.user.id,
      seller:        sellerId,
      buyerDetails,
      paymentMethod: paymentMethod || "COD",
      totalPrice,
      status:        "pending",
    });

    await order.save();
    res.status(201).json({ message: "Order placed successfully!", order });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
}

// GET /api/orders/my  (buyer)
export async function getBuyerOrders(req, res) {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate({
        path: "book",
        select: "price coverImage book", // listing fields + ref to actual Book
        populate: { path: "book", select: "title" }, // 🔥 nested populate for title
      })
      .populate("seller", "name")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
}

// GET /api/orders/seller  (seller)
export async function getSellerOrders(req, res) {
  try {
    const orders = await Order.find({ seller: req.user.id })
      .populate({
        path: "book",
        select: "price coverImage book",
        populate: { path: "book", select: "title" },
      })
      .populate("buyer", "name")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
}

//get order details by orderId
export async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: "book",
        select: "price coverImage book",
        populate: { path: "book", select: "title" },
      })
      .populate("buyer", "name");

    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
}
