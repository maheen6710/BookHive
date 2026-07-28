import User from "../models/User.js";
import bcrypt from "bcrypt";

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

// PUT /api/users/me — edit own profile
export const updateMyProfile = async (req, res) => {
  try {
    const { name, shopName, shopAddress, location, profileImage, password } = req.body;

    const updateData = { name, shopName, shopAddress, location, profileImage };

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
