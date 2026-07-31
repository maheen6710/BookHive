import express from "express";
import protect from "../middleware/auth.js";
import upload from "../middleware/upload.js"; // 🔥 same multer setup as book covers
import {
  getUserById,
  getMyProfile,
  updateMyProfile,
  setShopLocation,
} from "../controllers/profileController.js";

const router = express.Router();

// 🔥 specific routes BEFORE the /:id catch-all, or "/me" gets swallowed as an id
router.get("/me", protect, getMyProfile);
router.put("/me", protect, upload.single("profileImage"), updateMyProfile);
router.put("/me/location", protect, setShopLocation);

// GET /api/users/:id — public profile view (used by SellerProfilePage)
router.get("/:id", getUserById);

export default router;
