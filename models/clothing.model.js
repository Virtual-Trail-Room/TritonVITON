// models/clothing.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const clothingSchema = new Schema({
  clothingID: { type: String, required: true, unique: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'nonbinary'] },
  category: { type: String, required: true },
  image2D: { type: String, required: true },  // URL or file path
  asset3D: { type: String, required: false }     // URL or file path
}, {
  timestamps: true,
});

// Prevent model overwrite in hot-reloading
module.exports = mongoose.models.Clothing || mongoose.model('Clothing', clothingSchema);
