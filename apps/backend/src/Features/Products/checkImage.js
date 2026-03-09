const multer = require('multer');

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
  }
}).array('images', 5); // This executes the configuration

// The Wrapper Middleware
const uploadImages = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      // If there is an error (Multer or custom), send response and STOP
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    
    // IF NO ERROR, move to the next function (the Controller)
    next();
  });
};

module.exports = uploadImages;