const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  id: {type: String, required: true},
  msatoshi: {type: Number},
  description: {type: String},
  userid: {type: String},
  address: {type: String},
  file_id: {type: String},
  book_id: {type: String}, 
  owner: {type: String}
});

module.exports = mongoose.model("Invoice", InvoiceSchema);