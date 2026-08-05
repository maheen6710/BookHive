import express from "express";
import auth from "../middleware/auth.js";
import {
  placeOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,    
  cancelOrder,     
  deleteOrder,     
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/",       auth, placeOrder);
router.get("/my",      auth, getBuyerOrders);
router.get("/seller",  auth, getSellerOrders);
router.get("/:orderId", auth, getOrderById);
router.put("/:orderId/status", auth, updateOrderStatus);  
router.put("/:orderId/cancel", auth, cancelOrder);
router.delete("/:orderId", auth, deleteOrder);


export default router;