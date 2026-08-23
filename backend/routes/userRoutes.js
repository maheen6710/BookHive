import express from "express";
import protect from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  getUserById,
  getMyProfile,
  updateMyProfile,
  setShopLocation,
} from "../controllers/profileController.js";
import {
  changePassword,
  updatePreferences,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, upload.single("profileImage"), updateMyProfile);
router.put("/me/location", protect, setShopLocation);
router.get("/:id", getUserById);
router.put("/me/password", protect, changePassword);
router.put("/me/preferences", protect, updatePreferences);

export default router;
