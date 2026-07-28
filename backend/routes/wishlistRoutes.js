import express from "express";
import protect from "../middleware/auth.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.get("/", protect, getWishlist);
router.post("/:listingId", protect, addToWishlist);
router.delete("/:listingId", protect, removeFromWishlist);

export default router;
