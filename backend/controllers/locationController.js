import User from "../models/User.js";
import { haversineDistanceKm } from "../utils/geoUtils.js";

// GET /api/location/nearby-sellers?lat=..&lng=..
// Returns all sellers who have coordinates set, sorted nearest-first,
// each annotated with distanceKm from the finder's current location.
export const getNearbySellers = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng query params are required." });
    }

    const finderLat = parseFloat(lat);
    const finderLng = parseFloat(lng);

    // only sellers who actually have coordinates set can be located
    const sellers = await User.find({
      role: "seller",
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
    }).select("name shopName shopAddress location profileImage latitude longitude");

    const sellersWithDistance = sellers
      .map((seller) => ({
        ...seller.toObject(),
        distanceKm: haversineDistanceKm(finderLat, finderLng, seller.latitude, seller.longitude),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json(sellersWithDistance);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
