<<<<<<< HEAD
=======
// models/clothing.model.js
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
const mongoose = require('mongoose');
const { Schema } = mongoose;

const clothingSchema = new Schema({
  clothingID: { type: String, required: true, unique: true },
<<<<<<< HEAD
  gender: { type: String, required: true, enum: ['male', 'female', 'nonbinary', 'all gender'] },
  category: { 
    type: String, 
    required: true, 
    enum: ['Blouses', 'Cardigans', 'Jackets', 'Sweaters', 'Tanks', 'Tees', 'Tops', 'Jeans', 'Shorts', 'Skirts', 'Dress']
  },
  image2D: { type: String, required: true },
  asset3D: { type: String, required: true }
=======
  gender: { type: String, required: true, enum: ['male', 'female', 'nonbinary'] },
  category: { type: String, required: true },
  image2D: { type: String, required: true },  // URL or file path
  asset3D: { type: String, required: false }     // URL or file path
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
}, {
  timestamps: true,
});

<<<<<<< HEAD
// Prevent model overwrite during hot-reload in development
=======
// Prevent model overwrite in hot-reloading
>>>>>>> b8a709c (Addition of YOLO, improved front-end, working mongo backend, cloudinary implementation, early rough implementation of adding new images, working clicking (part 1))
module.exports = mongoose.models.Clothing || mongoose.model('Clothing', clothingSchema);
