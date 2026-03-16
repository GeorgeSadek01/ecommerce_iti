import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files are allowed!');
      error.code = 'INVALID_FILE';
      cb(error, false);
    }
  },
}).single('images', 1); // This executes the configuration

// The Wrapper Middleware
const uploadImages = (req, res, next) => {
  upload(req, res, (err) => {
if (err) {
      // 1. Check if it's the "Too many files" error
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          status: "failed",
          message: 'You uploaded more than one photo. Please delete one and try again.',
        });
      }

      // 2. Handle other Multer errors (like file size)
      return res.status(400).json({
        status: "failed",
        message: err.message || 'File upload error',
      });
    }

    // 3. Check if no file was provided at all
    if (!req.file) {
      return res.status(400).json({
        status: "failed",
        message: 'No file uploaded. Please provide an image.',
      });
    }

    next();
  });
};

export default uploadImages;
