import express from "express";
import { addReview, getReviewsByBook } from "../controllers/reviewController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, addReview);
router.get("/:bookId", getReviewsByBook);

export default router;