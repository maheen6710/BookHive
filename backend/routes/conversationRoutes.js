import express from "express";
import protect from "../middleware/auth.js";
import { startConversation, getMyConversations, getConversation, sendMessage, deleteConversation } from "../controllers/conversationController.js";

const router = express.Router();

router.post("/start", protect, startConversation);
router.get("/", protect, getMyConversations);
router.get("/:id", protect, getConversation);
router.post("/:id/message", protect, sendMessage);
router.delete("/:id", protect, deleteConversation);

export default router;