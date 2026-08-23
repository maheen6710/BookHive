import User from "../models/User.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name role shopName shopAddress location profileImage latitude longitude"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
    const { name, username, shopName, shopAddress, location } = req.body;

    const updateData = { name, username, shopName, shopAddress, location };

    if (req.file) {
      const currentUser = await User.findById(req.user.id).select("profileImage");
      if (currentUser?.profileImage) {
        const oldPath = path.join(__dirname, "..", currentUser.profileImage);
        fs.unlink(oldPath, (err) => {
          if (err) console.warn("Could not delete old profile pic:", err.message);
        });
      }

      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

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