const cloudinary = require('../../core/utils/cloudinary.js');
const streamifier = require('streamifier');

exports.uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    const readableStream = streamifier.createReadStream(fileBuffer);
    readableStream.on('error', reject);
    stream.on('error', reject);
    readableStream.pipe(stream);
  });
};