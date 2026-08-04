import express from "express";
import multer from "multer";
import { searchByImage } from "../controllers/imageSearchController.js";

const router = express.Router();

// Use memory storage (not disk) since we only need the buffer to send to Gemini
// — no need to permanently save the search photo like you do for listing images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB cap, plenty for a phone photo
});

router.post("/", upload.single("coverImage"), searchByImage);

export default router;
