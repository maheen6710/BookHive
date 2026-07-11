import multer from "multer";
import path from "path";

// where to save the file and what to name it
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");   // saves to /uploads folder in your backend
  },
  filename: function (req, file, cb) {
    // unique name: timestamp + original extension (e.g. 1712345678_cover.jpg)
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;