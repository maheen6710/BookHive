import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  name: String,
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    unique: true
  },
  password: {
  type: String,
  select: false
},
  role: {
    type: String,
    enum: ["seller", "finder"],
    default: "finder"
  },
  shopName: String,
  sellerId: {
    type: String,
    default: () => "SELLER-" + Math.random().toString(36).substring(2, 8).toUpperCase()
  },
  shopAddress: String,
  location: String,
  profileImage: String,
  // 🔥 wishlist removed — now lives in its own Wishlist model (see models/Wishlist.js)
});             

export default mongoose.model("User", userSchema);
