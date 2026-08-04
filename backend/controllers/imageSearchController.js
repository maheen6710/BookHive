import { GoogleGenAI } from "@google/genai";

// NOTE: client is created lazily (inside the handler, not up here) so that
// dotenv has definitely finished loading GEMINI_API_KEY before we read it.
// ES module imports run before top-level code in other files, so creating
// this at module load time can grab an undefined key if dotenv.config()
// happens to run after this file is first imported.

/**
 * POST /api/imagesearch
 * Accepts an uploaded cover photo (multer -> req.file), asks Gemini to
 * extract { title, author, edition } from it. The frontend then takes
 * this and searches your existing /search page with it.
 */
export const searchByImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Server misconfigured: missing GEMINI_API_KEY" });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 1. Convert uploaded image to base64 for Gemini
    const imageBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    // 2. Ask Gemini to extract structured info from the cover
    const prompt = `You are looking at a photo of a book cover, which may be angled, partially blurry, or have a non-standard/reprint cover design.

Extract the following as STRICT JSON only, no markdown fences, no preamble:
{
  "title": "the book's title, best guess, cleaned up",
  "author": "the author's full name, best guess",
  "edition": "edition info if visible (e.g. '2nd Edition'), otherwise null"
}

If you truly cannot identify the book, return {"title": null, "author": null, "edition": null}.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: prompt },
          ],
        },
      ],
    });

    let raw = result.text.trim();
    // Gemini sometimes wraps JSON in ```json fences despite instructions — strip them
    raw = raw.replace(/```json|```/g, "").trim();

    let extracted;
    try {
      extracted = JSON.parse(raw);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response:", raw);
      return res.status(502).json({ message: "Couldn't read the book cover, try a clearer photo" });
    }

    if (!extracted.title && !extracted.author) {
      return res.status(200).json({
        extracted,
        matches: [],
        message: "Couldn't identify this book — try a clearer or front-facing photo",
      });
    }

    // Frontend takes this extracted title/author and redirects to the
    // existing /search?q=... page, which already handles finding listings —
    // so this endpoint's only job is extraction, nothing more.
    return res.status(200).json({ extracted });
  } catch (err) {
    console.error("Image search error:", err);
    return res.status(500).json({ message: "Image search failed, try again" });
  }
};
