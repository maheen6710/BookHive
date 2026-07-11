import express from "express";
import { signup, login } from "../controllers/userController.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

// GET /api/users/:id — public seller info
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name shopName shopAddress location role"); // no password!
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;