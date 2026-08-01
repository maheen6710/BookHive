import Book from "../models/Book.js";
import BookListing from "../models/BookListing.js";
import { haversineDistanceKm } from "../utils/geoUtils.js";

// GET /api/books/suggestions?search=rich — autocomplete dropdown
export const getSuggestions = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search?.trim()) return res.json([]);

    // prefix match first (starts with), then contains — sorted by relevance
    const prefixMatches = await Book.distinct("title", {
      title: { $regex: `^${search}`, $options: "i" }
    });

    const containsMatches = await Book.distinct("title", {
      title: { $regex: search, $options: "i" }
    });

    // merge: prefix matches come first, no duplicates, max 8 suggestions
    const combined = [...new Set([...prefixMatches, ...containsMatches])].slice(0, 8);
    res.json(combined);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/books?search=...&lat=..&lng=..&radiusKm=.. — full search results
// (moved from bookController's getBooks). lat/lng/radiusKm are all optional —
// if provided, results are filtered to sellers within that radius and
// annotated with distanceKm, sorted nearest-first.
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

    // 🔥 optional distance filter + annotation, only when finder's location is provided
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
            obj.distanceKm = null; // seller hasn't set their location yet
          }
          return obj;
        })
        // only filter out listings whose seller HAS a location but is too far.
        // listings from sellers with no location set are kept (can't be excluded
        // by distance we can't calculate) but sort to the end.
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
