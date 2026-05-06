const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// ── Ensure upload sub-folders exist ──────────────────────────────────────────
const dirs = {
  images: path.join(__dirname, "../uploads/images"),
  videos: path.join(__dirname, "../uploads/videos"),
};
Object.values(dirs).forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Unique filename helper ────────────────────────────────────────────────────
const uniqueName = (file) =>
  Date.now() + "-" + Math.round(Math.random() * 1e6) + path.extname(file.originalname).toLowerCase();

// ── Storage: route to images/ or videos/ based on fieldname ──────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.fieldname === "video" || file.mimetype.startsWith("video/");
    cb(null, isVideo ? dirs.videos : dirs.images);
  },
  filename: (req, file, cb) => cb(null, uniqueName(file)),
});

// ── File filter: accept images AND videos ─────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp|avif/;
  const videoTypes = /mp4|webm|ogg|mov|avi|mkv/;

  const ext  = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mime = file.mimetype;

  const isImage = imageTypes.test(ext) && mime.startsWith("image/");
  const isVideo = videoTypes.test(ext) && mime.startsWith("video/");

  if (isImage || isVideo) return cb(null, true);
  cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: images (jpg/png/webp) and videos (mp4/webm/mov).`));
};

// ── Limits ────────────────────────────────────────────────────────────────────
const LIMITS = {
  image: 8  * 1024 * 1024,  //  8 MB
  video: 100 * 1024 * 1024, // 100 MB
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: LIMITS.video }, // use the larger limit; per-field checked below
});

// ── Named exports ─────────────────────────────────────────────────────────────

/** Single image upload  (field: "image") */
upload.singleImage = upload.single("image");

/** Single video upload  (field: "video") */
upload.singleVideo = upload.single("video");

/**
 * Both image + video in one request
 * fields: [{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]
 */
upload.imageAndVideo = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);

/**
 * Middleware that enforces per-field size limits AFTER multer parses the files.
 * Call after upload.imageAndVideo.
 */
upload.checkSizes = (req, res, next) => {
  const files = req.files || {};
  if (files.image?.[0] && files.image[0].size > LIMITS.image) {
    return res.status(400).json({ message: `Image too large. Max size is ${LIMITS.image / 1024 / 1024} MB.` });
  }
  if (files.video?.[0] && files.video[0].size > LIMITS.video) {
    return res.status(400).json({ message: `Video too large. Max size is ${LIMITS.video / 1024 / 1024} MB.` });
  }
  next();
};

module.exports = upload;
