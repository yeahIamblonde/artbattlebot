const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  cover_img: {type: String, required:true},
  cover_img2: {type: String, required:true},
  votesAvailable: {type: Number, default:2},  
  vote1: {type: Number, default:0},
  vote2: {type: Number, default:0},
  owner: {type: String}, 
},
{
    timestamps: true
}
);

module.exports = mongoose.model("Book", BookSchema);