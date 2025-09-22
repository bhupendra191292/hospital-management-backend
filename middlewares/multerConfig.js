// middlewares/multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';

let storage;
let upload;

if (isServerless) {
  // Use memory storage for serverless environments
  storage = multer.memoryStorage();
  upload = multer({ 
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    }
  });
  console.log('📁 Using memory storage for serverless environment');
} else {
  // Use disk storage for development
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

  upload = multer({ 
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    }
  });
  console.log('📁 Using disk storage for development environment');
}

module.exports = upload;
