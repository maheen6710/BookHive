import { GoogleGenAI } from "@google/genai";

export const searchByImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Server misconfigured: missing GEMINI_API_KEY" });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const imageBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

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

    return res.status(200).json({ extracted });
  } catch (err) {
    console.error("Image search error:", err);
    return res.status(500).json({ message: "Image search failed, try again" });
  }
};
