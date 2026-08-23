import Book from "../models/Book.js";
import BookListing from "../models/BookListing.js";
import { haversineDistanceKm } from "../utils/geoUtils.js";

export const getSuggestions = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search?.trim()) return res.json([]);

    const prefixMatches = await Book.distinct("title", {
      title: { $regex: `^${search}`, $options: "i" }
    });

    const containsMatches = await Book.distinct("title", {
      title: { $regex: search, $options: "i" }
    });

    const combined = [...new Set([...prefixMatches, ...containsMatches])].slice(0, 8);
    res.json(combined);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const searchListings = async (req, res) => {
  try {
    const { search, lat, lng, radiusKm } = req.query;

    let bookQuery = {};

    if (search && search.trim() !== "") {
      const words = search.trim().split(/\s+/);

      bookQuery = {
        $and: words.map((word) => ({
          $or: [
            { title: { $regex: word, $options: "i" } },
            { author: { $regex: word, $options: "i" } },
            { category: { $regex: word, $options: "i" } },
          ],
        })),
      };
    }

    let listingQuery = {};
    if (search && search.trim() !== "") {
      const matchingBooks = await Book.find(bookQuery).select("_id");
      const bookIds = matchingBooks.map((b) => b._id);
      listingQuery = { book: { $in: bookIds } };
    }

    let listings = await BookListing.find(listingQuery)
      .populate("book")
      .populate("seller", "name location profileImage latitude longitude")
      .sort({ createdAt: -1 });

    if (lat && lng) {
      const finderLat = parseFloat(lat);
      const finderLng = parseFloat(lng);
      const maxRadius = radiusKm ? parseFloat(radiusKm) : null;

      listings = listings
        .map((listing) => {
          const obj = listing.toObject();
          if (listing.seller?.latitude != null && listing.seller?.longitude != null) {
            obj.distanceKm = haversineDistanceKm(
              finderLat,
              finderLng,
              listing.seller.latitude,
              listing.seller.longitude
            );
          } else {
            obj.distanceKm = null; 
          }
          return obj;
        })
        
        .filter((l) => maxRadius == null || l.distanceKm == null || l.distanceKm <= maxRadius)
        .sort((a, b) => {
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });
    }

    res.json(listings);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
