import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { 
      name,
      username,
      email, 
      password, 
      role, 
      shopName, 
      shopAddress,
      location,
    } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      username,       // only sellers will send this, buyers send undefined (schema allows it)
      email,
      password: hashedPassword,
      role,
      shopName,
      shopAddress,
      location,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

      const token = jwt.sign(
  { id: user._id, role: user.role }, // ✅ add role here
  "secretkey",
  { expiresIn: "1d" }
);

    const { password: _, ...userData } = user._doc;

    res.json({
      message: "Login successful 😎",
      token,
      user: userData
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};