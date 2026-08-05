import User from "../models/User.js";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/users/:id — public profile view (used by SellerProfilePage)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name role shopName shopAddress location profileImage"
      // 🔥 deliberately NOT sending email/password — public view only
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/me — logged-in user's own full profile
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/me/location — set shop coordinates directly from device GPS
// (called from the frontend after navigator.geolocation captures the seller's
// current position while they're standing at their shop)
export const setShopLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ message: "latitude and longitude (numbers) are required." });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { latitude, longitude },
      { new: true }
    );

    res.json({ message: "Shop location updated", user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const updateMyProfile = async (req, res) => {
  try {
    const { name, username, shopName, shopAddress, location, password } = req.body;

    const updateData = { name, username, shopName, shopAddress, location };

    // 🔥 multer puts the uploaded file on req.file (same pattern as book covers)
    if (req.file) {
      // delete the old profile pic file from disk before pointing at the new one
      const currentUser = await User.findById(req.user.id).select("profileImage");
      if (currentUser?.profileImage) {
        const oldPath = path.join(__dirname, "..", currentUser.profileImage);
        fs.unlink(oldPath, (err) => {
          if (err) console.warn("Could not delete old profile pic:", err.message);
        });
      }

      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    // only re-hash + update password if the user actually sent a new one
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // strip undefined keys so we don't overwrite existing fields with undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updated = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    });

    res.json({ message: "Profile updated successfully", user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // 1. Find user with password field
    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    // 3. Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailNotifications } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { preferences: { emailNotifications } },
      { new: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};