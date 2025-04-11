const mongoose = require('mongoose');
const { Schema } = mongoose;

const clothingSchema = new Schema({
  clothingID: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Blouses', 'Cardigans', 'Jackets', 'Sweaters', 'Tanks', 'Tees', 'Tops', 'Jeans', 'Shorts', 'Skirts', 'Dress']
  },
  image2D: { type: String, required: true },
  asset3D: { type: String, required: true }
}, {
  timestamps: true,
});

// Prevent model overwrite during hot-reload in development
module.exports = mongoose.models.Clothing || mongoose.model('Clothing', clothingSchema);
