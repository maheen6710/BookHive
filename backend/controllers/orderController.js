import Order from "../models/Order.js";
import Book from "../models/Book.js";

// POST /api/orders
export async function placeOrder(req, res) {
  try {
    const { bookId, sellerId, buyerDetails, paymentMethod, totalPrice } = req.body;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found." });

    if (req.user.role !== "finder") {
      return res.status(403).json({ message: "Only buyers can place orders." });
    }

    if (req.user.id === sellerId) {
      return res.status(400).json({ message: "You cannot buy your own book." });
    }

    const order = new Order({
      book:          bookId,
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
      .populate("book", "title coverImage price")
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
      .populate("book", "title coverImage price")
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
      .populate("book", "title coverImage price")
      .populate("buyer", "name");

    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
}