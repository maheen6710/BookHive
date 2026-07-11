import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "No token, access denied" });
  }

  try {
    const decoded = jwt.verify(token, "secretkey"); // must match exactly

    req.user = decoded; // 👈 this puts the seller's id into req.user._id
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export default protect;