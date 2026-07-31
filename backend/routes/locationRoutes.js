import express from "express";
import { getNearbySellers } from "../controllers/locationController.js";

const router = express.Router();

router.get("/nearby-sellers", getNearbySellers);

export default router;
