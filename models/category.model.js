// models/category.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const allowedCategories = [
  "Blouses",
  "Cardigans",
  "Jackets",
  "Sweaters",
  "Tanks",
  "Tees",
  "Tops",
  "Jeans",
  "Shorts",
  "Skirts",
  "Dress"
];

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: allowedCategories  // Only these values are allowed
  }
}, {
  timestamps: true,
});

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
