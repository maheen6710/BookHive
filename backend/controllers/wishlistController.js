import Wishlist from "../models/Wishlist.js";

export const getWishlist = async (req, res) => {
  try {
    if (req.user.role !== "finder") {
      return res.status(403).json({ message: "Only buyers have a wishlist." });
    }

    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: "listings",
      populate: [
        { path: "book" },                        
        { path: "seller", select: "name location" },
      ],
    });

    res.json(wishlist?.listings || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    if (req.user.role !== "finder") {
      return res.status(403).json({ message: "Only buyers can add to wishlist." });
    }

    const { listingId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, listings: [] });
    }

    if (wishlist.listings.some((id) => id.toString() === listingId)) {
      return res.status(400).json({ message: "Already in wishlist" });
    }

    wishlist.listings.push(listingId);
    await wishlist.save();
    res.json({ message: "Added to wishlist" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    if (req.user.role !== "finder") {
      return res.status(403).json({ message: "Only buyers have a wishlist." });
    }

    const { listingId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) return res.json({ message: "Removed from wishlist" });

    wishlist.listings = wishlist.listings.filter(
      (id) => id.toString() !== listingId
    );
    await wishlist.save();
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
