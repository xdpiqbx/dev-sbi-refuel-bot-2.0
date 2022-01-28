require('dotenv').config();

module.exports = {
  TOKEN: process.env.API_TOKEN,
  DB_URL: process.env.MONGO,
  CLOUDINARY_CONFIG: process.env.CLOUDINARY_URL,
  CLOUDINARY_ROOT_FOLDER: process.env.CLOUDINARY_ROOT_FOLDER,
  CREATOR_CHAT_ID: process.env.CREATOR_CHAT_ID
};
