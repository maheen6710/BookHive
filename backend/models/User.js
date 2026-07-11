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
  profileImage: String,  // 👈 add comma here
  wishlist: [{           // 👈 wishlist is NOW inside the schema
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book"
  }]
});             

export default mongoose.model("User", userSchema);