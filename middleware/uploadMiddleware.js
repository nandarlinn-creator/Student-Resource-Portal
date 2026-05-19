const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "public/uploads";
const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "20", 10);

const ALLOWED_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(path.join(UPLOAD_DIR, "images"), { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // images go into uploads/images/
    const isImage = file.mimetype.startsWith("image/");
    cb(null, isImage ? path.join(UPLOAD_DIR, "images") : UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${req.session.userId}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", `File type not allowed: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

// Accept: one 'project_file' + up to 15 images named image_0, image_1, ...
const uploadFields = upload.fields([
  { name: "project_file", maxCount: 1 },
  ...Array.from({ length: 15 }, (_, i) => ({ name: `image_${i}`, maxCount: 1 })),
]);

module.exports = uploadFields;
