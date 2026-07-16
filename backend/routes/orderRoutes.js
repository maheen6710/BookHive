import express from "express";
import auth from "../middleware/auth.js";
import {
  placeOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderById,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/",       auth, placeOrder);
router.get("/my",      auth, getBuyerOrders);
router.get("/seller",  auth, getSellerOrders);
router.get("/:orderId", auth, getOrderById);

export default router;