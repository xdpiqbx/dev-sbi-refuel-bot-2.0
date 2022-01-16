require('dotenv').config();

module.exports = {
  TOKEN: process.env.BOT_TOKEN,
  DB_URL: process.env.MONGO,
  CLOUDINARY_CONFIG: process.env.CLOUDINARY_URL,
  CLOUDINARY_ROOT_FOLDER: process.env.CLOUDINARY_ROOT_FOLDER
};
