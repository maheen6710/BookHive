import Order from "../models/Order.js";
import BookListing from "../models/BookListing.js";

// ─── Place Order (buyer) ──────────────────────────────────────
export async function placeOrder(req, res) {
  try {
    const { bookId, sellerId, buyerDetails, paymentMethod, totalPrice } = req.body;

    const listing = await BookListing.findById(bookId);
    if (!listing) return res.status(404).json({ message: "Listing not found." });

    if (req.user.role !== "finder") {
      return res.status(403).json({ message: "Only buyers can place orders." });
    }

    if (req.user.id === sellerId) {
      return res.status(400).json({ message: "You cannot buy your own book." });
    }

    const order = new Order({
      book: bookId,
      buyer: req.user.id,
      seller: sellerId,
      buyerDetails,
      paymentMethod: paymentMethod || "COD",
      totalPrice,
      status: "pending",
    });

    await order.save();
    res.status(201).json({ message: "Order placed successfully!", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
}

// ─── Get Buyer Orders ─────────────────────────────────────────
export async function getBuyerOrders(req, res) {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate({
        path: "book",
        select: "price coverImage book",
        populate: { path: "book", select: "title" },
      })
      .populate("seller", "name")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
}

// ─── Get Seller Orders ────────────────────────────────────────
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

export async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate({
        path: "book",
        select: "price coverImage book",
        populate: { path: "book", select: "title" },
      })
      .populate("buyer", "name")        .populate("seller", "name");

    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "on the way", "delivered", "unavailable"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (order.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this order." });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Status updated", order });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
}

export async function cancelOrder(req, res) {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    // Normalize buyer ID (it could be populated or just a string)
    const buyerId = order.buyer?._id ? order.buyer._id.toString() : order.buyer?.toString();
    if (!buyerId || buyerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to cancel this order." });
    }

    const cancellable = ["pending", "unavailable"];
    if (!cancellable.includes(order.status)) {
      return res.status(400).json({ message: "This order cannot be cancelled." });
    }

    order.status = "cancelled";
    await order.save();

    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
}

// ─── Delete Order (buyer or seller, delivered/cancelled only) ─
export async function deleteOrder(req, res) {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    const userId = req.user.id;

    // Normalize buyer/seller IDs
    const buyerId = order.buyer?._id ? order.buyer._id.toString() : order.buyer?.toString();
    const sellerId = order.seller?._id ? order.seller._id.toString() : order.seller?.toString();

    const isBuyer = buyerId === userId;
    const isSeller = sellerId === userId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: "Not authorized to delete this order." });
    }

    if (!["delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({ message: "This order cannot be deleted." });
    }

    await Order.findByIdAndDelete(req.params.orderId);
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
}