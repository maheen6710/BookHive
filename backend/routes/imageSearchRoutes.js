import express from "express";
import multer from "multer";
import { searchByImage } from "../controllers/imageSearchController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, 
});

router.post("/", upload.single("coverImage"), searchByImage);

export default router;
