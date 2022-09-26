const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  title: {type: String, required: true},
  owner: {type: String}
},
{
    timestamps: true
}
);


module.exports = mongoose.model("Request", RequestSchema);