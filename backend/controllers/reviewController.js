import Review from "../models/Review.js";

export async function addReview(req, res) {
  const { bookId, rating, comment, username } = req.body;

  if (req.user.role !== "finder") {
    return res.status(403).json({ message: "Only book finders can post reviews." });
  }

  try {
    const existing = await Review.findOne({ bookId, userId: req.user.id });
    if (existing) {
      return res.status(400).json({ message: "You already reviewed this book." });
    }

    const review = await Review.create({
      bookId,
      userId: req.user.id,
      username,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

export async function getReviewsByBook(req, res) {
  try {
    const reviews = await Review.find({ bookId: req.params.bookId }).sort({
      createdAt: -1,
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}