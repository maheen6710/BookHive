import dotenv from "dotenv";
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
import imageSearchRoutes from "./routes/imageSearchRoutes.js";
import searchHistoryRoutes from './routes/searchHistoryRoutes.js';
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);  
app.use("/api/location", locationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/imagesearch", imageSearchRoutes);
app.use('/api/search-history', searchHistoryRoutes);

app.get("/", (req, res) => {
  res.send("API is running...finally!");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch(err => console.log(err));

app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});
