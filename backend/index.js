import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);  
app.use("/api/location", locationRoutes);

//conversation routes
app.use("/api/conversations", conversationRoutes);

//order routes
app.use("/api/orders", orderRoutes);

// test route
app.get("/", (req, res) => {
  res.send("API is running...finally 😭🔥");
});

// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected 😌"))
  .catch(err => console.log(err));

// start server
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});
